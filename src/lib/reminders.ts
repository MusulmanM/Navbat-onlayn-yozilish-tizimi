// Reminder timing (spec 6.5). Pure functions.
import { EVENING_REMINDER_TIME, QUIET_HOURS, REMINDER_MIN_LEAD_MIN } from "@/config/site";
import { HOUR_MS, MINUTE_MS, addDays, parseTime, zonedParts, zonedToUtc } from "@/lib/time";

export type ReminderType = "REMINDER_24H" | "REMINDER_2H";

const QUIET_START = parseTime(QUIET_HOURS.start);
const QUIET_END = parseTime(QUIET_HOURS.end);

/** Quiet hours are the half-open local interval [22:00, 07:00). */
export function isQuietTime(instant: Date, timeZone: string): boolean {
  const { minutes } = zonedParts(instant, timeZone);
  return QUIET_START > QUIET_END
    ? minutes >= QUIET_START || minutes < QUIET_END
    : minutes >= QUIET_START && minutes < QUIET_END;
}

/** 20:00 local time on the day before the visit. */
export function eveningBefore(visit: Date, timeZone: string): Date {
  const visitDate = zonedParts(visit, timeZone).date;
  return zonedToUtc(addDays(visitDate, -1), parseTime(EVENING_REMINDER_TIME), timeZone);
}

export type ReminderInput = {
  startsAt: Date;
  now: Date;
  timezone: string;
  reminder24h: boolean;
  reminder2h: boolean;
  /** Local testing: reminders 1 and 2 minutes from now. */
  testMode?: boolean;
};

export function computeReminderTimes(input: ReminderInput): Partial<Record<ReminderType, Date>> {
  const { startsAt, now, timezone } = input;
  const result: Partial<Record<ReminderType, Date>> = {};

  if (input.testMode) {
    if (input.reminder24h) result.REMINDER_24H = new Date(now.getTime() + 1 * MINUTE_MS);
    if (input.reminder2h) result.REMINDER_2H = new Date(now.getTime() + 2 * MINUTE_MS);
    return result;
  }

  const threshold = now.getTime() + REMINDER_MIN_LEAD_MIN * MINUTE_MS;

  if (input.reminder24h) {
    let t = new Date(startsAt.getTime() - 24 * HOUR_MS);
    if (isQuietTime(t, timezone)) t = eveningBefore(startsAt, timezone);
    if (t.getTime() <= threshold) {
      const alt = eveningBefore(startsAt, timezone);
      const latest = startsAt.getTime() - 3 * HOUR_MS;
      t = alt.getTime() > threshold && alt.getTime() < latest ? alt : new Date(Number.NaN);
    }
    if (!Number.isNaN(t.getTime())) result.REMINDER_24H = t;
  }

  if (input.reminder2h) {
    const t = new Date(startsAt.getTime() - 2 * HOUR_MS);
    if (!isQuietTime(t, timezone) && t.getTime() > threshold) result.REMINDER_2H = t;
  }

  return result;
}

/** Word for the visit day at send time: "today", "tomorrow" or null (show the date). */
export function visitDayWord(
  startsAt: Date,
  now: Date,
  timeZone: string,
): "today" | "tomorrow" | null {
  const visit = zonedParts(startsAt, timeZone).date;
  const today = zonedParts(now, timeZone).date;
  if (visit === today) return "today";
  if (visit === addDays(today, 1)) return "tomorrow";
  return null;
}
