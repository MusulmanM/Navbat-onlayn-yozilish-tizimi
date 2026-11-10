import { describe, expect, it } from "vitest";
import { getOpenStatus } from "@/lib/open-status";
import { defaultWeeklySchedule } from "@/lib/schedule";
import { localDateTimeToUtc } from "@/lib/time";

const TZ = "Asia/Tashkent";
const at = (date: string, time: string) => localDateTimeToUtc(date, time, TZ);
const schedule = defaultWeeklySchedule();
schedule.mon.breaks = [{ start: "13:00", end: "14:00" }];
// 2026-11-14 Saturday, 2026-11-15 Sunday (closed), 2026-11-16 Monday.

describe("getOpenStatus", () => {
  it("open until the end of the current interval", () => {
    expect(getOpenStatus(schedule, at("2026-11-16", "10:00"), TZ)).toEqual({
      kind: "open",
      until: "13:00",
    });
    expect(getOpenStatus(schedule, at("2026-11-16", "15:00"), TZ)).toEqual({
      kind: "open",
      until: "20:00",
    });
  });

  it("break", () => {
    expect(getOpenStatus(schedule, at("2026-11-16", "13:30"), TZ)).toEqual({
      kind: "break",
      until: "14:00",
    });
  });

  it("before opening today", () => {
    expect(getOpenStatus(schedule, at("2026-11-16", "07:00"), TZ)).toEqual({
      kind: "closed",
      next: { day: "today", time: "09:00" },
    });
  });

  it("after closing → tomorrow", () => {
    expect(getOpenStatus(schedule, at("2026-11-16", "21:00"), TZ)).toEqual({
      kind: "closed",
      next: { day: "tomorrow", time: "09:00" },
    });
  });

  it("Saturday evening → Monday (Sunday is off)", () => {
    expect(getOpenStatus(schedule, at("2026-11-14", "21:00"), TZ)).toEqual({
      kind: "closed",
      next: { day: 1, time: "09:00" },
    });
  });

  it("business-wide closure", () => {
    const closure = { start: at("2026-11-16", "00:00"), end: at("2026-11-17", "00:00") };
    expect(getOpenStatus(schedule, at("2026-11-16", "10:00"), TZ, [closure])).toEqual({
      kind: "closed",
      next: { day: "tomorrow", time: "09:00" },
    });
  });
});
