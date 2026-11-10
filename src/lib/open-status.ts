// "Open now · until 20:00" / "Closed · opens tomorrow at 09:00" (spec 7.2). Pure.
import { dayKeyOf, workingIntervals, type WeeklySchedule } from "@/lib/schedule";
import { addDays, formatMinutes, weekdayOf, zonedParts, zonedToUtc } from "@/lib/time";

export type NextOpening =
  { day: "today" | "tomorrow"; time: string } | { day: number; time: string };

export type OpenStatus =
  | { kind: "open"; until: string }
  | { kind: "break"; until: string }
  | { kind: "closed"; next: NextOpening | null };

type Closure = { start: Date; end: Date };

const covered = (instant: Date, closures: Closure[]) =>
  closures.some((c) => instant >= c.start && instant < c.end);

export function getOpenStatus(
  schedule: WeeklySchedule,
  now: Date,
  timeZone: string,
  closures: Closure[] = [],
): OpenStatus {
  const { date: today, minutes } = zonedParts(now, timeZone);

  if (!covered(now, closures)) {
    const day = schedule[dayKeyOf(today)];
    const intervals = workingIntervals(day);
    const current = intervals.find(([s, e]) => minutes >= s && minutes < e);
    if (current) return { kind: "open", until: formatMinutes(current[1]) };
    const inBreak =
      intervals.length > 0 && minutes >= intervals[0][0] && minutes < intervals.at(-1)![1];
    if (inBreak) {
      const next = intervals.find(([s]) => s > minutes);
      if (next) return { kind: "break", until: formatMinutes(next[0]) };
    }
  }

  for (let offset = 0; offset <= 7; offset++) {
    const date = addDays(today, offset);
    for (const [start] of workingIntervals(schedule[dayKeyOf(date)])) {
      if (offset === 0 && start <= minutes) continue;
      if (covered(zonedToUtc(date, start, timeZone), closures)) continue;
      const time = formatMinutes(start);
      if (offset === 0) return { kind: "closed", next: { day: "today", time } };
      if (offset === 1) return { kind: "closed", next: { day: "tomorrow", time } };
      return { kind: "closed", next: { day: weekdayOf(date), time } };
    }
  }
  return { kind: "closed", next: null };
}
