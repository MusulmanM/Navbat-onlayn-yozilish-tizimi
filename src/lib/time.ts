// Time zone aware date helpers (spec 6.1, 6.7, 11).
// The database stores UTC; schedules use local "HH:MM" in the business time zone.
import { TZDate } from "@date-fns/tz";
import type { Locale } from "@/config/locales";

/** Calendar date in the business time zone, "YYYY-MM-DD". */
export type DateStr = string;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

const pad = (n: number) => String(n).padStart(2, "0");

/** "09:30" → 570. "24:00" → 1440. */
export function parseTime(hhmm: string): number {
  const match = TIME_RE.exec(hhmm);
  if (!match) throw new Error(`Invalid time: ${hhmm}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** 570 → "09:30". */
export function formatMinutes(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function isValidDateStr(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function parseDateStr(value: DateStr): { y: number; m: number; d: number } {
  const match = DATE_RE.exec(value);
  if (!match || !isValidDateStr(value)) throw new Error(`Invalid date: ${value}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/** Local date + minutes since local midnight → UTC instant. */
export function zonedToUtc(date: DateStr, minutes: number, timeZone: string): Date {
  const { y, m, d } = parseDateStr(date);
  return new Date(new TZDate(y, m - 1, d, 0, minutes, 0, 0, timeZone).getTime());
}

/** "2026-11-10", "14:30" → UTC instant. */
export function localDateTimeToUtc(date: DateStr, time: string, timeZone: string): Date {
  return zonedToUtc(date, parseTime(time), timeZone);
}

export type ZonedParts = {
  date: DateStr;
  /** Minutes since local midnight. */
  minutes: number;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  year: number;
  month: number;
  day: number;
};

export function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const z = new TZDate(instant.getTime(), timeZone);
  const year = z.getFullYear();
  const month = z.getMonth() + 1;
  const day = z.getDate();
  return {
    date: `${year}-${pad(month)}-${pad(day)}`,
    minutes: z.getHours() * 60 + z.getMinutes(),
    weekday: z.getDay(),
    year,
    month,
    day,
  };
}

/** Local calendar date of an instant. */
export function dateInZone(instant: Date, timeZone: string): DateStr {
  return zonedParts(instant, timeZone).date;
}

/** Local "HH:MM" of an instant. */
export function timeInZone(instant: Date, timeZone: string): string {
  return formatMinutes(zonedParts(instant, timeZone).minutes);
}

/** Pure calendar arithmetic (no time zone involved). */
export function addDays(date: DateStr, days: number): DateStr {
  const { y, m, d } = parseDateStr(date);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

/** Whole days from a to b (b − a). */
export function diffDays(a: DateStr, b: DateStr): number {
  const pa = parseDateStr(a);
  const pb = parseDateStr(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / DAY_MS);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: DateStr): number {
  const { y, m, d } = parseDateStr(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Start and end (exclusive) of a local calendar day as UTC instants. */
export function dayRangeUtc(date: DateStr, timeZone: string): { start: Date; end: Date } {
  return { start: zonedToUtc(date, 0, timeZone), end: zonedToUtc(addDays(date, 1), 0, timeZone) };
}

// ---------------------------------------------------------------------------
// Localized formatting (own formatter: date-fns "uz" uses different month spellings).

const MONTHS: Record<Locale, readonly string[]> = {
  uz: [
    "yanvar",
    "fevral",
    "mart",
    "aprel",
    "may",
    "iyun",
    "iyul",
    "avgust",
    "sentyabr",
    "oktyabr",
    "noyabr",
    "dekabr",
  ],
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
};

/** Index 0 = Sunday. */
const WEEKDAYS: Record<Locale, readonly string[]> = {
  uz: ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"],
  ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
};

const WEEKDAYS_SHORT: Record<Locale, readonly string[]> = {
  uz: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
};

export function weekdayName(weekday: number, locale: Locale): string {
  return WEEKDAYS[locale][weekday] ?? "";
}

/** Form used after "в" in Russian ("в среду"); Uzbek uses the plain name. */
const WEEKDAYS_RU_ACC = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среду",
  "четверг",
  "пятницу",
  "субботу",
];

export function weekdayNameAcc(weekday: number, locale: Locale): string {
  return locale === "ru" ? (WEEKDAYS_RU_ACC[weekday] ?? "") : weekdayName(weekday, locale);
}

export function weekdayShort(weekday: number, locale: Locale): string {
  return WEEKDAYS_SHORT[locale][weekday] ?? "";
}

/** "21-oktyabr" / "21 октября". */
export function formatDayMonth(date: DateStr, locale: Locale): string {
  const { m, d } = parseDateStr(date);
  const month = MONTHS[locale][m - 1];
  return locale === "uz" ? `${d}-${month}` : `${d} ${month}`;
}

/** "21-oktyabr, seshanba" / "21 октября, вторник". */
export function formatDateLong(date: DateStr, locale: Locale): string {
  return `${formatDayMonth(date, locale)}, ${weekdayName(weekdayOf(date), locale)}`;
}

/** "2026-yil 21-oktyabr" / "21 октября 2026 г.". */
export function formatDateFull(date: DateStr, locale: Locale): string {
  const { y } = parseDateStr(date);
  return locale === "uz"
    ? `${y}-yil ${formatDayMonth(date, locale)}`
    : `${formatDayMonth(date, locale)} ${y} г.`;
}

/** "45 daqiqa", "1 soat", "1 soat 30 daqiqa" / "45 мин", "1 ч", "1 ч 30 мин". */
export function formatDuration(totalMinutes: number, locale: Locale): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const [hourWord, minuteWord] = locale === "uz" ? ["soat", "daqiqa"] : ["ч", "мин"];
  if (h === 0) return `${m} ${minuteWord}`;
  if (m === 0) return `${h} ${hourWord}`;
  return `${h} ${hourWord} ${m} ${minuteWord}`;
}
