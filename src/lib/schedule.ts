// Weekly working schedule format and validation (spec 5.3).
import { z } from "zod";
import { formatMinutes, parseTime, weekdayOf, type DateStr } from "@/lib/time";

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

/** JS weekday (0 = Sunday) → key. */
const WEEKDAY_TO_KEY: readonly DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const MAX_BREAKS = 3;

const TIME_STRING_RE = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

/** Minutes for a valid "HH:MM", NaN otherwise (zod may run refinements on bad input). */
function minutesOrNaN(value: string): number {
  return TIME_STRING_RE.test(value) ? parseTime(value) : Number.NaN;
}

/** "HH:MM", minutes divisible by 5, up to "24:00". */
export const timeStringSchema = z
  .string()
  .regex(TIME_STRING_RE, "TIME_FORMAT")
  .refine((value) => !TIME_STRING_RE.test(value) || parseTime(value) % 5 === 0, "TIME_STEP");

const intervalSchema = z.object({ start: timeStringSchema, end: timeStringSchema });

export const dayScheduleSchema = z
  .object({
    open: z.boolean(),
    start: timeStringSchema,
    end: timeStringSchema,
    breaks: z.array(intervalSchema).max(MAX_BREAKS, "TOO_MANY_BREAKS"),
  })
  .superRefine((day, ctx) => {
    const start = minutesOrNaN(day.start);
    const end = minutesOrNaN(day.end);
    const all = [
      start,
      end,
      ...day.breaks.flatMap((b) => [minutesOrNaN(b.start), minutesOrNaN(b.end)]),
    ];
    if (all.some(Number.isNaN)) return; // format errors are already reported
    if (start >= end) {
      ctx.addIssue({ code: "custom", message: "START_AFTER_END", path: ["end"] });
      return;
    }
    let previousEnd = start;
    day.breaks.forEach((item, index) => {
      const bStart = parseTime(item.start);
      const bEnd = parseTime(item.end);
      if (bStart >= bEnd) {
        ctx.addIssue({ code: "custom", message: "BREAK_START_AFTER_END", path: ["breaks", index] });
      } else if (bStart < start || bEnd > end) {
        ctx.addIssue({ code: "custom", message: "BREAK_OUTSIDE_HOURS", path: ["breaks", index] });
      } else if (bStart < previousEnd) {
        ctx.addIssue({ code: "custom", message: "BREAKS_OVERLAP", path: ["breaks", index] });
      }
      previousEnd = Math.max(previousEnd, bEnd);
    });
  });

export const weeklyScheduleSchema = z.object({
  mon: dayScheduleSchema,
  tue: dayScheduleSchema,
  wed: dayScheduleSchema,
  thu: dayScheduleSchema,
  fri: dayScheduleSchema,
  sat: dayScheduleSchema,
  sun: dayScheduleSchema,
});

export type DaySchedule = z.infer<typeof dayScheduleSchema>;
export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>;

const workday = (): DaySchedule => ({ open: true, start: "09:00", end: "20:00", breaks: [] });

/** Mon–Sat 09:00–20:00, Sunday off, no breaks. */
export function defaultWeeklySchedule(): WeeklySchedule {
  return {
    mon: workday(),
    tue: workday(),
    wed: workday(),
    thu: workday(),
    fri: workday(),
    sat: workday(),
    sun: { ...workday(), open: false },
  };
}

/** Parses JSON from the database; falls back to the default schedule if it is broken. */
export function parseWeeklySchedule(value: unknown): WeeklySchedule {
  const result = weeklyScheduleSchema.safeParse(value);
  return result.success ? result.data : defaultWeeklySchedule();
}

/** Same as above, but null stays null (staff without own schedule). */
export function parseOptionalSchedule(value: unknown): WeeklySchedule | null {
  if (value === null || value === undefined) return null;
  const result = weeklyScheduleSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function dayKeyOf(date: DateStr): DayKey {
  return WEEKDAY_TO_KEY[weekdayOf(date)];
}

export function dayKeyFromWeekday(weekday: number): DayKey {
  return WEEKDAY_TO_KEY[weekday];
}

/** Working intervals of a day in minutes, with breaks cut out: [[540, 780], [840, 1200]]. */
export function workingIntervals(day: DaySchedule): Array<[number, number]> {
  if (!day.open) return [];
  const intervals: Array<[number, number]> = [];
  let cursor = parseTime(day.start);
  const end = parseTime(day.end);
  const breaks = [...day.breaks]
    .map((b) => [parseTime(b.start), parseTime(b.end)] as const)
    .sort((a, b) => a[0] - b[0]);
  for (const [bStart, bEnd] of breaks) {
    if (bStart > cursor) intervals.push([cursor, Math.min(bStart, end)]);
    cursor = Math.max(cursor, bEnd);
  }
  if (cursor < end) intervals.push([cursor, end]);
  return intervals.filter(([s, e]) => e > s);
}

/** "09:00–20:00" or null when closed. */
export function dayHoursLabel(day: DaySchedule): string | null {
  return day.open ? `${day.start}–${day.end}` : null;
}

export { formatMinutes };
