import { describe, expect, it } from "vitest";
import { computeReminderTimes, isQuietTime, visitDayWord } from "@/lib/reminders";
import { localDateTimeToUtc } from "@/lib/time";

const TZ = "Asia/Tashkent";
// 2026-11-16 is Monday (Du), 17 Tuesday (Se), 18 Wednesday (Ch), 19 Thursday (Pa), 20 Friday (Ju).
const DAYS = {
  Du: "2026-11-16",
  Se: "2026-11-17",
  Ch: "2026-11-18",
  Pa: "2026-11-19",
  Ju: "2026-11-20",
};
type Day = keyof typeof DAYS;
const at = (day: Day, time: string) => localDateTimeToUtc(DAYS[day], time, TZ);

function reminders(now: Date, startsAt: Date) {
  return computeReminderTimes({ now, startsAt, timezone: TZ, reminder24h: true, reminder2h: true });
}

describe("computeReminderTimes (spec 6.5 table)", () => {
  const cases: Array<[Day, string, Day, string, [Day, string] | null, [Day, string] | null]> = [
    ["Se", "10:00", "Ch", "15:00", ["Se", "15:00"], ["Ch", "13:00"]],
    ["Se", "18:00", "Ch", "09:00", ["Se", "20:00"], ["Ch", "07:00"]],
    ["Se", "21:00", "Ch", "10:00", null, ["Ch", "08:00"]],
    ["Se", "10:00", "Se", "15:00", null, ["Se", "13:00"]],
    ["Se", "14:00", "Se", "15:00", null, null],
    ["Du", "12:00", "Ju", "23:30", ["Pa", "20:00"], ["Ju", "21:30"]],
    ["Du", "12:00", "Ch", "08:00", ["Se", "08:00"], null],
    ["Du", "12:00", "Ch", "06:30", ["Se", "20:00"], null],
  ];

  it.each(cases)(
    "booked %s %s, visit %s %s",
    (nowDay, nowTime, visitDay, visitTime, expected24, expected2) => {
      const result = reminders(at(nowDay, nowTime), at(visitDay, visitTime));
      expect(result.REMINDER_24H?.toISOString()).toBe(
        expected24 ? at(...expected24).toISOString() : undefined,
      );
      expect(result.REMINDER_2H?.toISOString()).toBe(
        expected2 ? at(...expected2).toISOString() : undefined,
      );
    },
  );

  it("respects disabled reminders", () => {
    const result = computeReminderTimes({
      now: at("Se", "10:00"),
      startsAt: at("Ch", "15:00"),
      timezone: TZ,
      reminder24h: false,
      reminder2h: true,
    });
    expect(result.REMINDER_24H).toBeUndefined();
    expect(result.REMINDER_2H).toBeDefined();
  });

  it("test mode: 1 and 2 minutes from now", () => {
    const now = at("Se", "10:00");
    const result = computeReminderTimes({
      now,
      startsAt: at("Ch", "15:00"),
      timezone: TZ,
      reminder24h: true,
      reminder2h: true,
      testMode: true,
    });
    expect(result.REMINDER_24H?.getTime()).toBe(now.getTime() + 60_000);
    expect(result.REMINDER_2H?.getTime()).toBe(now.getTime() + 120_000);
  });
});

describe("quiet hours [22:00, 07:00)", () => {
  it("22:00 is quiet, 07:00 is not", () => {
    expect(isQuietTime(at("Se", "22:00"), TZ)).toBe(true);
    expect(isQuietTime(at("Se", "06:59"), TZ)).toBe(true);
    expect(isQuietTime(at("Se", "07:00"), TZ)).toBe(false);
    expect(isQuietTime(at("Se", "21:59"), TZ)).toBe(false);
  });
});

describe("visitDayWord", () => {
  it("today / tomorrow / date", () => {
    expect(visitDayWord(at("Se", "15:00"), at("Se", "10:00"), TZ)).toBe("today");
    expect(visitDayWord(at("Ch", "09:00"), at("Se", "20:00"), TZ)).toBe("tomorrow");
    expect(visitDayWord(at("Ju", "09:00"), at("Se", "20:00"), TZ)).toBeNull();
  });
});
