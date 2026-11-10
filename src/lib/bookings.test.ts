import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUSES,
  bookingTimes,
  checkTransition,
  type Actor,
  type BookingStatus,
} from "@/lib/bookings";
import { buildIcs, icsEscape } from "@/lib/ics";
import { signInitData, verifyInitData } from "@/lib/telegram/init-data";

const HOUR = 3_600_000;
const now = new Date("2026-11-10T07:00:00Z");
const ctx = (hoursFromNow: number, cancelUntilHours = 2) => ({
  startsAt: new Date(now.getTime() + hoursFromNow * HOUR),
  now,
  cancelUntilHours,
});

describe("booking transitions", () => {
  it.each<[BookingStatus, BookingStatus, Actor]>([
    ["PENDING", "CONFIRMED", "business"],
    ["PENDING", "CANCELLED_BY_BUSINESS", "business"],
    ["PENDING", "CANCELLED_BY_BUSINESS", "system"],
    ["PENDING", "CANCELLED_BY_CLIENT", "client"],
    ["CONFIRMED", "CANCELLED_BY_CLIENT", "client"],
    ["CONFIRMED", "CANCELLED_BY_BUSINESS", "business"],
  ])("allows %s → %s by %s (visit in 24h)", (from, to, actor) => {
    expect(checkTransition(from, to, actor, ctx(24))).toBeNull();
  });

  it("allows outcomes after the visit and auto-complete by system", () => {
    expect(checkTransition("CONFIRMED", "COMPLETED", "business", ctx(-1))).toBeNull();
    expect(checkTransition("CONFIRMED", "NO_SHOW", "business", ctx(-1))).toBeNull();
    expect(checkTransition("CONFIRMED", "COMPLETED", "system", ctx(-8))).toBeNull();
    expect(checkTransition("COMPLETED", "NO_SHOW", "business", ctx(-48))).toBeNull();
    expect(checkTransition("NO_SHOW", "COMPLETED", "business", ctx(-48))).toBeNull();
  });

  it.each<[BookingStatus, BookingStatus, Actor]>([
    ["PENDING", "CONFIRMED", "client"],
    ["PENDING", "CONFIRMED", "system"],
    ["PENDING", "COMPLETED", "business"],
    ["PENDING", "NO_SHOW", "business"],
    ["CONFIRMED", "PENDING", "business"],
    ["CONFIRMED", "NO_SHOW", "system"],
    ["CONFIRMED", "CANCELLED_BY_BUSINESS", "client"],
    ["CONFIRMED", "CANCELLED_BY_CLIENT", "business"],
    ["COMPLETED", "CONFIRMED", "business"],
    ["COMPLETED", "CANCELLED_BY_BUSINESS", "business"],
    ["NO_SHOW", "CONFIRMED", "business"],
  ])("forbids %s → %s by %s", (from, to, actor) => {
    expect(checkTransition(from, to, actor, ctx(-1))).toBe("NOT_ALLOWED");
  });

  it("cancelled bookings are final", () => {
    for (const from of ["CANCELLED_BY_CLIENT", "CANCELLED_BY_BUSINESS"] as const) {
      for (const to of BOOKING_STATUSES) {
        for (const actor of ["client", "business", "system"] as const) {
          expect(checkTransition(from, to, actor, ctx(24))).toBe("NOT_ALLOWED");
        }
      }
    }
  });

  it("client cannot cancel later than cancelUntilHours before the visit", () => {
    expect(checkTransition("CONFIRMED", "CANCELLED_BY_CLIENT", "client", ctx(1.5, 2))).toBe(
      "TOO_LATE_TO_CANCEL",
    );
    expect(checkTransition("CONFIRMED", "CANCELLED_BY_CLIENT", "client", ctx(2, 2))).toBeNull();
  });

  it("outcome cannot be marked long before the visit", () => {
    expect(checkTransition("CONFIRMED", "NO_SHOW", "business", ctx(5))).toBe("TOO_EARLY");
    expect(checkTransition("CONFIRMED", "COMPLETED", "business", ctx(0.5))).toBeNull();
  });

  it("COMPLETED ↔ NO_SHOW only within the edit window", () => {
    expect(checkTransition("COMPLETED", "NO_SHOW", "business", ctx(-24 * 8))).toBe(
      "EDIT_WINDOW_CLOSED",
    );
  });

  it("computes endsAt and blockedUntil", () => {
    const start = new Date("2026-11-16T05:00:00Z");
    const { endsAt, blockedUntil } = bookingTimes(start, 60, 15);
    expect(endsAt.toISOString()).toBe("2026-11-16T06:00:00.000Z");
    expect(blockedUntil.toISOString()).toBe("2026-11-16T06:15:00.000Z");
  });
});

describe("Telegram initData", () => {
  const token = "123456:TEST-token_for_unit_tests";
  const authDate = Math.floor(now.getTime() / 1000) - 60;
  function sample(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams({
      query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
      user: JSON.stringify({
        id: 279058397,
        first_name: "Aziz",
        username: "aziz",
        language_code: "ru",
      }),
      auth_date: String(authDate),
      ...overrides,
    });
    params.set("hash", signInitData(params, token));
    return params;
  }

  it("accepts a correct signature", () => {
    const result = verifyInitData(sample().toString(), token, now);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.id).toBe(279058397n);
      expect(result.user.firstName).toBe("Aziz");
      expect(result.user.languageCode).toBe("ru");
    }
  });

  it("rejects modified data", () => {
    const params = sample();
    params.set("user", JSON.stringify({ id: 1, first_name: "Hacker" }));
    expect(verifyInitData(params.toString(), token, now)).toEqual({
      ok: false,
      error: "BAD_SIGNATURE",
    });
  });

  it("rejects a different bot token", () => {
    expect(verifyInitData(sample().toString(), "999:other", now)).toMatchObject({ ok: false });
  });

  it("rejects old auth_date", () => {
    const old = sample({ auth_date: String(authDate - 25 * 3600) });
    expect(verifyInitData(old.toString(), token, now)).toEqual({ ok: false, error: "EXPIRED" });
  });

  it("rejects garbage", () => {
    expect(verifyInitData("", token, now).ok).toBe(false);
    expect(verifyInitData("hash=zz&user=1", token, now).ok).toBe(false);
  });
});

describe("ics", () => {
  it("builds a VEVENT in UTC", () => {
    const ics = buildIcs({
      uid: "abc@navbat",
      startsAt: new Date("2026-11-16T05:00:00Z"),
      endsAt: new Date("2026-11-16T06:00:00Z"),
      summary: "Soch olish — Ali Barber",
      location: "Bunyodkor, 12; Chilonzor",
      description: "https://example.uz/y/token",
      now: new Date("2026-11-10T00:00:00Z"),
    });
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20261116T050000Z");
    expect(ics).toContain("DTEND:20261116T060000Z");
    expect(ics).toContain("LOCATION:Bunyodkor\\, 12\\; Chilonzor");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
  it("escapes text", () => {
    expect(icsEscape("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });
});
