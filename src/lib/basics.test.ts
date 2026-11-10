// Tests for phone, money, slug, schedule, access, time and tokens.
import { describe, expect, it } from "vitest";
import { canAcceptOnlineBookings, extendPaidUntil, getAccess } from "@/lib/access";
import { formatMoney } from "@/lib/money";
import { formatLocalPhoneInput, formatPhone, normalizePhone } from "@/lib/phone";
import {
  defaultWeeklySchedule,
  weeklyScheduleSchema,
  workingIntervals,
  type WeeklySchedule,
} from "@/lib/schedule";
import { nextAvailableSlug, slugify, validateSlug } from "@/lib/slug";
import {
  DAY_MS,
  addDays,
  formatDateFull,
  formatDateLong,
  formatDuration,
  localDateTimeToUtc,
  timeInZone,
} from "@/lib/time";
import { isTokenShape, randomToken, safeEqual } from "@/lib/tokens";

describe("phone", () => {
  it.each([
    ["90 123 45 67", "+998901234567"],
    ["+998 90 123-45-67", "+998901234567"],
    ["998901234567", "+998901234567"],
    ["901234567", "+998901234567"],
    ["(33) 555-66-77", "+998335556677"],
  ])("accepts %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "12345", "90123456", "9012345678", "+7 901 234 56 78", "997901234567"])(
    "rejects %s",
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );

  it("formats for display and input mask", () => {
    expect(formatPhone("+998901234567")).toBe("+998 90 123 45 67");
    expect(formatLocalPhoneInput("90123")).toBe("90 123");
    expect(formatLocalPhoneInput("9012345678999")).toBe("90 123 45 67");
  });
});

describe("money", () => {
  const nb = (s: string) => s.replaceAll(" ", " ");
  it("formats so'm with non-breaking spaces", () => {
    expect(formatMoney(150_000, "uz")).toBe(nb("150 000 soʻm"));
    expect(formatMoney(1_500_000, "uz")).toBe(nb("1 500 000 soʻm"));
    expect(formatMoney(150_000, "ru")).toBe(nb("150 000 сум"));
    expect(formatMoney(999, "uz")).toBe(nb("999 soʻm"));
  });
  it("price from", () => {
    expect(formatMoney(150_000, "uz", true)).toBe(nb("150 000 soʻmdan"));
    expect(formatMoney(150_000, "ru", true)).toBe(nb("от 150 000 сум"));
  });
  it("free", () => {
    expect(formatMoney(0, "uz")).toBe("Bepul");
    expect(formatMoney(0, "ru", true)).toBe("Бесплатно");
  });
});

describe("slug", () => {
  it.each([
    ["Ali Barber", "ali-barber"],
    ["Goʻzallik saloni", "gozallik-saloni"],
    ["Go'zal Qo‘l", "gozal-qol"],
    ["O`g`il bola", "ogil-bola"],
    ["Гулнора салон", "gulnora-salon"],
    ["Шаҳноза Ўқув маркази", "shahnoza-oquv-markazi"],
    ["Цирюльня Щука", "tsiryulnya-shuka"],
    ["  --Barber   №1!!  ", "barber-1"],
    ["!!!", "biznes"],
    ["AB", "ab-biznes"],
    ["Admin", "admin-biznes"],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("cuts to 40 characters without a trailing dash", () => {
    const slug = slugify("a".repeat(39) + " b" + "c".repeat(10));
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("adds -2, -3 when taken", () => {
    expect(nextAvailableSlug("ali", new Set())).toBe("ali");
    expect(nextAvailableSlug("ali", new Set(["ali"]))).toBe("ali-2");
    expect(nextAvailableSlug("ali", new Set(["ali", "ali-2"]))).toBe("ali-3");
    expect(nextAvailableSlug("a".repeat(40), new Set(["a".repeat(40)]))).toHaveLength(40);
  });

  it("validates owner input", () => {
    expect(validateSlug("ali-barber")).toBeNull();
    expect(validateSlug("panel")).toBe("SLUG_RESERVED");
    expect(validateSlug("ab")).toBe("SLUG_FORMAT");
    expect(validateSlug("Ali")).toBe("SLUG_FORMAT");
    expect(validateSlug("ali--barber")).toBe("SLUG_FORMAT");
    expect(validateSlug("-ali")).toBe("SLUG_FORMAT");
  });
});

describe("schedule", () => {
  const withMonday = (mon: WeeklySchedule["mon"]) => ({ ...defaultWeeklySchedule(), mon });

  it("accepts the default schedule", () => {
    expect(weeklyScheduleSchema.safeParse(defaultWeeklySchedule()).success).toBe(true);
  });

  it.each([
    ["bad format", { open: true, start: "9:00", end: "18:00", breaks: [] }],
    ["not a multiple of 5", { open: true, start: "09:03", end: "18:00", breaks: [] }],
    ["start after end", { open: true, start: "18:00", end: "09:00", breaks: [] }],
    ["after 24:00", { open: true, start: "09:00", end: "24:30", breaks: [] }],
    [
      "break outside hours",
      { open: true, start: "09:00", end: "18:00", breaks: [{ start: "08:00", end: "10:00" }] },
    ],
    [
      "overlapping breaks",
      {
        open: true,
        start: "09:00",
        end: "18:00",
        breaks: [
          { start: "12:00", end: "13:00" },
          { start: "12:30", end: "14:00" },
        ],
      },
    ],
    [
      "unsorted breaks",
      {
        open: true,
        start: "09:00",
        end: "18:00",
        breaks: [
          { start: "15:00", end: "16:00" },
          { start: "12:00", end: "13:00" },
        ],
      },
    ],
    [
      "more than 3 breaks",
      {
        open: true,
        start: "09:00",
        end: "18:00",
        breaks: [
          { start: "10:00", end: "10:15" },
          { start: "11:00", end: "11:15" },
          { start: "12:00", end: "12:15" },
          { start: "13:00", end: "13:15" },
        ],
      },
    ],
  ])("rejects %s", (_name, mon) => {
    expect(weeklyScheduleSchema.safeParse(withMonday(mon)).success).toBe(false);
  });

  it("allows end 24:00 and cuts breaks out of working intervals", () => {
    const mon = {
      open: true,
      start: "09:00",
      end: "24:00",
      breaks: [{ start: "13:00", end: "14:00" }],
    };
    expect(weeklyScheduleSchema.safeParse(withMonday(mon)).success).toBe(true);
    expect(workingIntervals(mon)).toEqual([
      [540, 780],
      [840, 1440],
    ]);
    expect(workingIntervals({ ...mon, open: false })).toEqual([]);
  });
});

describe("access", () => {
  const now = new Date("2026-11-10T07:00:00Z");
  const days = (n: number) => new Date(now.getTime() + n * DAY_MS);
  const base = { isBlocked: false, plan: "TRIAL" as const, trialEndsAt: days(5), paidUntil: null };

  it("TRIAL", () => {
    const a = getAccess(base, now);
    expect(a.state).toBe("TRIAL");
    expect(a.daysLeft).toBe(5);
    expect(a.maxStaff).toBe(5);
  });
  it("ACTIVE uses the paid plan limit", () => {
    const a = getAccess(
      { ...base, plan: "START", trialEndsAt: days(-20), paidUntil: days(10) },
      now,
    );
    expect(a.state).toBe("ACTIVE");
    expect(a.maxStaff).toBe(1);
  });
  it("GRACE after trial end", () => {
    expect(getAccess({ ...base, trialEndsAt: days(-2) }, now).state).toBe("GRACE");
  });
  it("GRACE after paid period end", () => {
    const a = getAccess({ ...base, plan: "PRO", trialEndsAt: days(-40), paidUntil: days(-1) }, now);
    expect(a.state).toBe("GRACE");
    expect(a.daysLeft).toBe(2);
  });
  it("EXPIRED", () => {
    const a = getAccess({ ...base, trialEndsAt: days(-4) }, now);
    expect(a.state).toBe("EXPIRED");
    expect(canAcceptOnlineBookings(a.state)).toBe(false);
  });
  it("BLOCKED wins over everything", () => {
    const a = getAccess({ ...base, isBlocked: true, paidUntil: days(30) }, now);
    expect(a.state).toBe("BLOCKED");
    expect(canAcceptOnlineBookings(a.state)).toBe(false);
  });
  it("payment extends from max(now, paidUntil)", () => {
    expect(extendPaidUntil(null, now, 30).getTime()).toBe(days(30).getTime());
    expect(extendPaidUntil(days(5), now, 30).getTime()).toBe(days(35).getTime());
    expect(extendPaidUntil(days(-5), now, 30).getTime()).toBe(days(30).getTime());
  });
});

describe("time", () => {
  it("formats durations", () => {
    expect(formatDuration(45, "uz")).toBe("45 daqiqa");
    expect(formatDuration(60, "uz")).toBe("1 soat");
    expect(formatDuration(90, "uz")).toBe("1 soat 30 daqiqa");
    expect(formatDuration(45, "ru")).toBe("45 мин");
    expect(formatDuration(60, "ru")).toBe("1 ч");
    expect(formatDuration(90, "ru")).toBe("1 ч 30 мин");
  });
  it("formats dates", () => {
    expect(formatDateLong("2026-10-21", "uz")).toBe("21-oktyabr, chorshanba");
    expect(formatDateLong("2026-10-20", "ru")).toBe("20 октября, вторник");
    expect(formatDateFull("2026-10-21", "uz")).toBe("2026-yil 21-oktyabr");
  });
  it("calendar math and zones", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    const instant = localDateTimeToUtc("2026-11-10", "09:00", "Asia/Tashkent");
    expect(instant.toISOString()).toBe("2026-11-10T04:00:00.000Z");
    expect(timeInZone(instant, "Asia/Tashkent")).toBe("09:00");
    expect(timeInZone(instant, "Europe/Moscow")).toBe("07:00");
  });
});

describe("tokens", () => {
  it("random tokens are 32 url-safe chars and unique", () => {
    const a = randomToken();
    expect(isTokenShape(a)).toBe(true);
    expect(`bk_${a}`.length).toBeLessThanOrEqual(64);
    expect(randomToken()).not.toBe(a);
  });
  it("safeEqual", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
