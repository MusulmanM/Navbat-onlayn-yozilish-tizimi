import { describe, expect, it } from "vitest";
import { defaultWeeklySchedule, type WeeklySchedule } from "@/lib/schedule";
import { computeSlots, pickStaff, toBusyIntervals, type SlotQuery } from "@/lib/slots";
import { localDateTimeToUtc } from "@/lib/time";

const TZ = "Asia/Tashkent";
const MONDAY = "2026-11-16";
const SUNDAY = "2026-11-15";
const at = (date: string, time: string) => localDateTimeToUtc(date, time, TZ);

function schedule(start = "09:00", end = "18:00", breaks: WeeklySchedule["mon"]["breaks"] = []) {
  const s = defaultWeeklySchedule();
  for (const key of ["mon", "tue", "wed", "thu", "fri", "sat"] as const) {
    s[key] = { open: true, start, end, breaks };
  }
  return s;
}

function query(overrides: Partial<SlotQuery> = {}): SlotQuery {
  return {
    business: {
      timezone: TZ,
      weeklySchedule: schedule(),
      slotStepMinutes: 30,
      minLeadMinutes: 60,
      maxDaysAhead: 30,
    },
    service: { durationMinutes: 60, bufferMinutes: 0 },
    staff: [{ id: "ali", weeklySchedule: null, sortOrder: 0 }],
    date: MONDAY,
    busy: [],
    now: at("2026-11-10", "12:00"),
    ...overrides,
  };
}

const times = (q: SlotQuery) => computeSlots(q).map((s) => s.time);

describe("computeSlots", () => {
  it("1. free day 09:00–18:00, step 30, 60 min → 09:00 … 17:00", () => {
    const result = times(query());
    expect(result[0]).toBe("09:00");
    expect(result.at(-1)).toBe("17:00");
    expect(result).toHaveLength(17);
  });

  it("2. break 13:00–14:00 cuts slots that would run into it", () => {
    const q = query();
    q.business.weeklySchedule = schedule("09:00", "18:00", [{ start: "13:00", end: "14:00" }]);
    const result = times(q);
    expect(result).toContain("12:00");
    expect(result).not.toContain("12:30");
    expect(result).not.toContain("13:00");
    expect(result).not.toContain("13:30");
    expect(result).toContain("14:00");
  });

  it("3. existing booking 10:00–11:00", () => {
    const q = query({
      busy: [{ staffId: "ali", start: at(MONDAY, "10:00"), end: at(MONDAY, "11:00") }],
    });
    const result = times(q);
    expect(result).toContain("09:00");
    expect(result).not.toContain("09:30");
    expect(result).not.toContain("10:00");
    expect(result).not.toContain("10:30");
    expect(result).toContain("11:00");
  });

  it("4. booking with 15 min buffer blocks until 11:15", () => {
    const q = query({
      busy: [{ staffId: "ali", start: at(MONDAY, "10:00"), end: at(MONDAY, "11:15") }],
    });
    const result = times(q);
    expect(result).not.toContain("11:00");
    expect(result).toContain("11:30");
  });

  it("5. the new service's buffer may not touch the next booking", () => {
    const q = query({
      service: { durationMinutes: 60, bufferMinutes: 15 },
      busy: [{ staffId: "ali", start: at(MONDAY, "12:00"), end: at(MONDAY, "13:00") }],
    });
    const result = times(q);
    // 10:30–11:30 + 15 min buffer = 11:45 < 12:00 → ok; 11:00–12:00 + buffer → hits 12:00.
    expect(result).toContain("10:30");
    expect(result).not.toContain("11:00");
  });

  it("5b. buffer may run past closing time", () => {
    const q = query({ service: { durationMinutes: 60, bufferMinutes: 30 } });
    expect(times(q).at(-1)).toBe("17:00");
  });

  it("6. closed day (Sunday) → no slots", () => {
    expect(times(query({ date: SUNDAY }))).toEqual([]);
  });

  it("7. staff's own schedule replaces the business schedule", () => {
    const own = schedule("12:00", "15:00");
    const q = query({ staff: [{ id: "ali", weeklySchedule: own, sortOrder: 0 }] });
    expect(times(q)).toEqual(["12:00", "12:30", "13:00", "13:30", "14:00"]);
  });

  it("8. business-wide time off → nothing; staff time off → only that staff is busy", () => {
    const staff = [
      { id: "ali", weeklySchedule: null, sortOrder: 0 },
      { id: "vali", weeklySchedule: null, sortOrder: 1 },
    ];
    const wholeDay = { start: at(MONDAY, "00:00"), end: at("2026-11-17", "00:00") };
    expect(times(query({ staff, busy: [{ staffId: null, ...wholeDay }] }))).toEqual([]);

    const slots = computeSlots(query({ staff, busy: [{ staffId: "ali", ...wholeDay }] }));
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.staffIds.length === 1 && s.staffIds[0] === "vali")).toBe(true);
  });

  it("9. today at 10:10 with 60 min lead → first slot 11:30", () => {
    const q = query({ date: MONDAY, now: at(MONDAY, "10:10") });
    expect(times(q)[0]).toBe("11:30");
  });

  it("10. date after maxDaysAhead or in the past → no slots", () => {
    expect(times(query({ date: "2026-12-11" }))).toEqual([]);
    expect(times(query({ date: "2026-12-10" })).length).toBeGreaterThan(0);
    expect(times(query({ date: "2026-11-09" }))).toEqual([]);
  });

  it("11. cancelled bookings do not block time", () => {
    const busy = toBusyIntervals(
      [
        {
          staffId: "ali",
          startsAt: at(MONDAY, "10:00"),
          blockedUntil: at(MONDAY, "11:00"),
          status: "CANCELLED_BY_CLIENT",
        },
        {
          staffId: "ali",
          startsAt: at(MONDAY, "14:00"),
          blockedUntil: at(MONDAY, "15:00"),
          status: "CONFIRMED",
        },
      ],
      [],
    );
    const result = times(query({ busy }));
    expect(result).toContain("10:00");
    expect(result).not.toContain("14:00");
  });

  it("12. any staff: times merge, staffIds are correct, pickStaff picks the least busy", () => {
    const staff = [
      { id: "ali", weeklySchedule: null, sortOrder: 0 },
      { id: "vali", weeklySchedule: null, sortOrder: 1 },
    ];
    const slots = computeSlots(
      query({
        staff,
        busy: [{ staffId: "ali", start: at(MONDAY, "09:00"), end: at(MONDAY, "10:00") }],
      }),
    );
    const nine = slots.find((s) => s.time === "09:00");
    const eleven = slots.find((s) => s.time === "11:00");
    expect(nine?.staffIds).toEqual(["vali"]);
    expect(eleven?.staffIds).toEqual(["ali", "vali"]);
    expect(new Set(slots.map((s) => s.time)).size).toBe(slots.length);

    expect(pickStaff(staff, { ali: 2, vali: 1 })).toBe("vali");
    expect(pickStaff(staff, { ali: 1, vali: 1 })).toBe("ali");
    expect(pickStaff([], {})).toBeNull();
  });

  it("13. step 15, service 45 min", () => {
    const q = query();
    q.business.slotStepMinutes = 15;
    q.service = { durationMinutes: 45, bufferMinutes: 0 };
    const result = times(q);
    expect(result.slice(0, 3)).toEqual(["09:00", "09:15", "09:30"]);
    expect(result.at(-1)).toBe("17:15");
  });

  it("14. startsAt is correct UTC (09:00 Tashkent = 04:00 UTC)", () => {
    const first = computeSlots(query())[0];
    expect(first.startsAt.toISOString()).toBe("2026-11-16T04:00:00.000Z");
  });

  it("aligns candidates to the step grid when work starts off-grid", () => {
    const q = query();
    q.business.weeklySchedule = schedule("09:15", "12:00");
    expect(times(q)[0]).toBe("09:30");
  });

  it("panel options: outside working hours and without lead time, overlaps still forbidden", () => {
    const q = query({
      date: SUNDAY,
      now: at(SUNDAY, "12:00"),
      busy: [{ staffId: "ali", start: at(SUNDAY, "08:00"), end: at(SUNDAY, "09:00") }],
      options: { ignoreWorkingHours: true, ignoreLeadTime: true },
    });
    const result = times(q);
    expect(result).toContain("06:00");
    expect(result).not.toContain("07:30");
    expect(result).not.toContain("08:00");
    expect(result).toContain("09:00");
  });
});
