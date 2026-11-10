import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { CalendarView, type CalendarColumn } from "@/components/panel/calendar/calendar-view";
import { EmptyState, PageHeader } from "@/components/panel/page-header";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth/guards";
import { dayKeyOf, workingIntervals } from "@/lib/schedule";
import {
  addDays,
  dateInZone,
  dayRangeUtc,
  formatDateLong,
  formatDayMonth,
  isValidDateStr,
  weekdayOf,
  weekdayShort,
  zonedParts,
} from "@/lib/time";
import { getCalendarData, mondayOf } from "@/server/panel/queries";
import { toRow } from "@/server/panel/serialize";

export default async function CalendarPage({
  params,
  searchParams,
}: PageProps<"/[locale]/panel/kalendar">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const query = await searchParams;
  const { business } = await requireBusiness();
  const t = await getTranslations("Calendar");
  const tz = business.timezone;
  const now = new Date();
  const today = dateInZone(now, tz);

  const view = query.view === "week" ? "week" : "day";
  const date = typeof query.date === "string" && isValidDateStr(query.date) ? query.date : today;
  const showCancelled = query.cancelled === "1";
  const from = view === "week" ? mondayOf(date) : date;
  const days = view === "week" ? 7 : 1;
  const data = await getCalendarData(business, from, days);
  const activeStaff = data.staff.filter((s) => s.isActive);
  const staffParam = typeof query.staff === "string" ? query.staff : null;
  const selectedStaff =
    data.staff.find((s) => s.id === staffParam) ?? activeStaff[0] ?? data.staff[0] ?? null;

  if (data.staff.length === 0) {
    return (
      <div>
        <PageHeader title={t("title")} />
        <EmptyState
          icon="🗓"
          title={t("noStaff")}
          action={
            <Link
              href="/panel/ustalar"
              className="inline-flex h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
            >
              {t("addStaff")}
            </Link>
          }
        />
      </div>
    );
  }

  const rows = data.bookings
    .filter(
      (b) =>
        showCancelled ||
        (b.status !== "CANCELLED_BY_CLIENT" && b.status !== "CANCELLED_BY_BUSINESS"),
    )
    .map((b) => toRow(b, locale, tz, now));

  // Time off as local minute ranges per date and staff.
  const offFor = (staffId: string, day: string) => {
    const { start, end } = dayRangeUtc(day, tz);
    return data.timeOffs
      .filter(
        (o) =>
          (o.staffId === null || o.staffId === staffId) && o.startsAt < end && o.endsAt > start,
      )
      .map((o) => ({
        start: o.startsAt <= start ? 0 : zonedParts(o.startsAt, tz).minutes,
        end: o.endsAt >= end ? 24 * 60 : zonedParts(o.endsAt, tz).minutes,
        reason: o.reason,
      }));
  };
  const column = (
    staff: (typeof data.staff)[number],
    day: string,
    title: string,
    subtitle?: string,
  ): CalendarColumn => ({
    key: `${staff.id}-${day}`,
    staffId: staff.id,
    date: day,
    title,
    subtitle,
    isToday: day === today,
    working: workingIntervals((staff.weeklySchedule ?? data.schedule)[dayKeyOf(day)]),
    off: offFor(staff.id, day),
  });

  const columns: CalendarColumn[] =
    view === "day"
      ? data.staff.map((s) => column(s, date, s.name, s.position ?? undefined))
      : Array.from({ length: 7 }, (_, i) => {
          const day = addDays(from, i);
          return column(
            selectedStaff!,
            day,
            `${weekdayShort(weekdayOf(day), locale)} ${Number(day.slice(8))}`,
            undefined,
          );
        });

  // Visible hours: working time ± 1 h, widened for bookings outside it; default 08–21.
  const starts = columns
    .flatMap((c) => c.working.map(([s]) => s))
    .concat(rows.map((r) => r.startMin));
  const ends = columns
    .flatMap((c) => c.working.map(([, e]) => e))
    .concat(rows.map((r) => r.endMin));
  const startHour = Math.max(
    0,
    Math.floor((starts.length ? Math.min(...starts) : 9 * 60) / 60) - 1,
  );
  const endHour = Math.min(24, Math.ceil((ends.length ? Math.max(...ends) : 20 * 60) / 60) + 1);

  const base = `/panel/kalendar?view=${view}${view === "week" && selectedStaff ? `&staff=${selectedStaff.id}` : ""}${showCancelled ? "&cancelled=1" : ""}`;
  const step = view === "week" ? 7 : 1;
  const rangeLabel =
    view === "day"
      ? formatDateLong(date, locale)
      : `${formatDayMonth(from, locale)} – ${formatDayMonth(addDays(from, 6), locale)}`;
  const cancelledHref = `/panel/kalendar?view=${view}&date=${date}${selectedStaff && view === "week" ? `&staff=${selectedStaff.id}` : ""}${showCancelled ? "" : "&cancelled=1"}`;

  return (
    <div>
      <PageHeader title={t("title")} />
      <CalendarView
        view={view}
        date={date}
        rangeLabel={rangeLabel}
        columns={columns}
        bookings={rows}
        staff={(view === "week" ? data.staff : activeStaff.length ? activeStaff : data.staff).map(
          (s) => ({ id: s.id, name: s.name }),
        )}
        selectedStaffId={selectedStaff?.id ?? null}
        startHour={startHour}
        endHour={endHour}
        nowMinutes={columns.some((c) => c.isToday) ? zonedParts(now, tz).minutes : null}
        prevHref={`${base}&date=${addDays(date, -step)}`}
        nextHref={`${base}&date=${addDays(date, step)}`}
        todayHref={`${base}&date=${today}`}
        dayHref={`/panel/kalendar?view=day&date=${date}${showCancelled ? "&cancelled=1" : ""}`}
        weekHref={`/panel/kalendar?view=week&date=${date}${selectedStaff ? `&staff=${selectedStaff.id}` : ""}${showCancelled ? "&cancelled=1" : ""}`}
        cancelledHref={cancelledHref}
        showCancelled={showCancelled}
        openBookingId={typeof query.booking === "string" ? query.booking : null}
      />
    </div>
  );
}
