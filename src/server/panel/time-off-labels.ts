import type { Locale } from "@/config/locales";
import { addDays, dateInZone, formatDayMonth } from "@/lib/time";

/** "16-noyabr" or "16-noyabr – 20-noyabr" for a whole-day TimeOff [start, end). */
export function timeOffLabel(
  startsAt: Date,
  endsAt: Date,
  timezone: string,
  locale: Locale,
): string {
  const from = dateInZone(startsAt, timezone);
  const to = addDays(dateInZone(new Date(endsAt.getTime() - 1), timezone), 0);
  return from === to
    ? formatDayMonth(from, locale)
    : `${formatDayMonth(from, locale)} – ${formatDayMonth(to, locale)}`;
}
