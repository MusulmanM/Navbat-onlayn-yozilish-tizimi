"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { InitialAvatar } from "@/components/common/initial-avatar";
import { BookingDetails } from "@/components/panel/calendar/booking-details";
import { usePanel } from "@/components/panel/panel-context";
import { Link, useRouter } from "@/i18n/navigation";
import { formatMinutes } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { BookingRowData } from "@/server/panel/serialize";

export type CalendarColumn = {
  key: string;
  staffId: string;
  date: string;
  title: string;
  subtitle?: string;
  isToday: boolean;
  /** Working intervals in minutes since midnight. */
  working: Array<[number, number]>;
  /** Time off ranges (minutes) with an optional reason. */
  off: Array<{ start: number; end: number; reason: string | null }>;
};

const HOUR_PX = 64;
const SNAP_MIN = 15;

const BLOCK_STYLE: Record<BookingRowData["status"], string> = {
  CONFIRMED: "bg-primary text-primary-foreground border-primary",
  PENDING: "bg-pending text-pending-foreground border-pending",
  COMPLETED: "bg-success/20 text-success border-success/40",
  NO_SHOW: "bg-destructive/15 text-destructive border-destructive/40",
  CANCELLED_BY_CLIENT: "bg-muted text-muted-foreground border-border line-through opacity-70",
  CANCELLED_BY_BUSINESS: "bg-muted text-muted-foreground border-border line-through opacity-70",
};

export function CalendarView({
  view,
  date,
  rangeLabel,
  columns,
  bookings,
  staff,
  selectedStaffId,
  startHour,
  endHour,
  nowMinutes,
  prevHref,
  nextHref,
  todayHref,
  dayHref,
  weekHref,
  cancelledHref,
  showCancelled,
  openBookingId,
}: {
  view: "day" | "week";
  date: string;
  rangeLabel: string;
  columns: CalendarColumn[];
  bookings: BookingRowData[];
  staff: Array<{ id: string; name: string }>;
  selectedStaffId: string | null;
  startHour: number;
  endHour: number;
  nowMinutes: number | null;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  dayHref: string;
  weekHref: string;
  cancelledHref: string;
  showCancelled: boolean;
  openBookingId: string | null;
}) {
  const t = useTranslations("Calendar");
  const panel = usePanel();
  const router = useRouter();
  const [mobileStaff, setMobileStaff] = useState(selectedStaffId ?? staff[0]?.id ?? null);
  const [detailsId, setDetailsId] = useState<string | null>(openBookingId);
  const details = bookings.find((b) => b.id === detailsId) ?? null;
  const height = (endHour - startHour) * HOUR_PX;
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour],
  );

  // Scroll to "now" (or the first booking) once on open.
  useEffect(() => {
    const target = nowMinutes ?? bookings[0]?.startMin ?? (startHour + 1) * 60;
    const el = document.getElementById("calendar-scroll");
    if (el) el.scrollTop = Math.max(0, ((target - startHour * 60) / 60) * HOUR_PX - 120);
  }, [nowMinutes, bookings, startHour]);

  const onEmptyClick = (column: CalendarColumn, event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const minutes = startHour * 60 + ((event.clientY - rect.top) / HOUR_PX) * 60;
    const snapped = Math.floor(minutes / SNAP_MIN) * SNAP_MIN;
    panel.openAddBooking({
      staffId: column.staffId,
      date: column.date,
      time: formatMinutes(snapped),
    });
  };

  const staffSwitch = (
    <div
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
      role="group"
      aria-label={panel.staffLabel}
    >
      {staff.map((s) => {
        const active = view === "week" ? s.id === selectedStaffId : s.id === mobileStaff;
        const className = cn(
          "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-semibold",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "bg-background hover:bg-muted",
        );
        return view === "week" ? (
          <Link
            key={s.id}
            href={`/panel/kalendar?view=week&date=${date}&staff=${s.id}${showCancelled ? "&cancelled=1" : ""}`}
            className={className}
            aria-current={active ? "true" : undefined}
          >
            {s.name}
          </Link>
        ) : (
          <button
            key={s.id}
            type="button"
            onClick={() => setMobileStaff(s.id)}
            className={cn(className, "lg:hidden")}
            aria-pressed={active}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-xl border bg-background">
          <Link
            href={prevHref}
            aria-label={t("prev")}
            className="inline-flex size-11 items-center justify-center rounded-l-xl hover:bg-muted"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <Link
            href={todayHref}
            className="inline-flex h-11 items-center border-x px-3 text-sm font-semibold hover:bg-muted"
          >
            {t("today")}
          </Link>
          <Link
            href={nextHref}
            aria-label={t("next")}
            className="inline-flex size-11 items-center justify-center rounded-r-xl hover:bg-muted"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        </div>
        <input
          type="date"
          value={date}
          aria-label={t("title")}
          onChange={(e) =>
            e.target.value &&
            router.push(
              `/panel/kalendar?view=${view}&date=${e.target.value}${selectedStaffId ? `&staff=${selectedStaffId}` : ""}`,
            )
          }
          className="h-11 rounded-xl border bg-background px-3 text-base"
        />
        <div className="inline-flex rounded-xl bg-muted p-1 text-sm font-semibold">
          <Link
            href={dayHref}
            aria-current={view === "day" ? "true" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-lg px-3",
              view === "day" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {t("day")}
          </Link>
          <Link
            href={weekHref}
            aria-current={view === "week" ? "true" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-lg px-3",
              view === "week" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {t("week")}
          </Link>
        </div>
        <Link
          href={cancelledHref}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <span
            aria-hidden
            className={cn(
              "inline-flex size-5 items-center justify-center rounded border",
              showCancelled && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {showCancelled ? "✓" : ""}
          </span>
          {t("showCancelled")}
        </Link>
      </div>
      <p className="text-lg font-bold first-letter:uppercase">{rangeLabel}</p>
      {staff.length > 1 &&
        (view === "week" ? staffSwitch : <div className="lg:hidden">{staffSwitch}</div>)}

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div id="calendar-scroll" className="max-h-[calc(100dvh-260px)] min-h-96 overflow-auto">
          <div className="flex min-w-full">
            {/* Time axis */}
            <div className="sticky left-0 z-20 w-14 shrink-0 border-r bg-card">
              <div className="sticky top-0 z-10 h-14 border-b bg-card" />
              <div className="relative" style={{ height }}>
                {hours.map((h) => (
                  <span
                    key={h}
                    className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums"
                    style={{ top: (h - startHour) * HOUR_PX }}
                  >
                    {h > startHour ? `${String(h).padStart(2, "0")}:00` : ""}
                  </span>
                ))}
              </div>
            </div>
            {columns.map((column) => {
              const hiddenOnMobile = view === "day" && column.staffId !== mobileStaff;
              const columnBookings = bookings.filter(
                (b) => b.staffId === column.staffId && b.date === column.date,
              );
              return (
                <div
                  key={column.key}
                  className={cn(
                    "min-w-[9.5rem] flex-1 border-r last:border-r-0",
                    hiddenOnMobile && "hidden lg:block",
                  )}
                >
                  <div
                    className={cn(
                      "sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-card px-2",
                      column.isToday && "bg-accent/60",
                    )}
                  >
                    {view === "day" && (
                      <InitialAvatar name={column.title} className="size-8 rounded-lg text-xs" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-semibold",
                          column.isToday && "text-primary",
                        )}
                      >
                        {column.title}
                      </p>
                      {column.subtitle && (
                        <p className="truncate text-xs text-muted-foreground">{column.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div
                    className="relative cursor-copy"
                    style={{
                      height,
                      backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${HOUR_PX / 4}px), repeating-linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 18%, transparent) 0 1px, transparent 1px ${HOUR_PX}px)`,
                    }}
                    onClick={(e) => onEmptyClick(column, e)}
                    title={t("freeSlotHint", { time: "" })}
                  >
                    <OffHours
                      column={column}
                      startHour={startHour}
                      endHour={endHour}
                      label={column.working.length === 0 ? t("dayOff") : null}
                    />
                    {column.isToday &&
                      nowMinutes !== null &&
                      nowMinutes >= startHour * 60 &&
                      nowMinutes <= endHour * 60 && (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-destructive"
                          style={{ top: ((nowMinutes - startHour * 60) / 60) * HOUR_PX }}
                        >
                          <span className="absolute -top-1.5 -left-1 size-3 rounded-full bg-destructive" />
                        </div>
                      )}
                    {columnBookings.map((b) => {
                      const top = ((b.startMin - startHour * 60) / 60) * HOUR_PX;
                      const blockHeight = Math.max(
                        26,
                        ((b.endMin - b.startMin) / 60) * HOUR_PX - 2,
                      );
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setDetailsId(b.id)}
                          className={cn(
                            "absolute inset-x-1 z-[5] overflow-hidden rounded-lg border px-2 py-1 text-left text-xs shadow-sm transition-transform hover:z-20 hover:scale-[1.02]",
                            BLOCK_STYLE[b.status],
                          )}
                          style={{ top: top + 1, height: blockHeight }}
                        >
                          <span className="block font-bold tabular-nums">
                            {b.time}–{b.endTime} {b.coming && "✅"}
                          </span>
                          <span className="block truncate font-semibold">{b.clientName}</span>
                          {blockHeight > 50 && (
                            <span className="block truncate opacity-90">{b.service}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {details && (
        <BookingDetails
          key={details.id}
          row={details}
          open={!!details}
          onOpenChange={(open) => !open && setDetailsId(null)}
        />
      )}
    </div>
  );
}

/** Shades everything outside working hours, breaks and time off. */
function OffHours({
  column,
  startHour,
  endHour,
  label,
}: {
  column: CalendarColumn;
  startHour: number;
  endHour: number;
  label: string | null;
}) {
  const from = startHour * 60;
  const to = endHour * 60;
  const gaps: Array<[number, number]> = [];
  let cursor = from;
  for (const [s, e] of [...column.working].sort((a, b) => a[0] - b[0])) {
    if (s > cursor) gaps.push([cursor, Math.min(s, to)]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < to) gaps.push([cursor, to]);
  const px = (m: number) => ((m - from) / 60) * HOUR_PX;
  return (
    <>
      {gaps.map(([s, e]) => (
        <div
          key={`gap-${s}`}
          className="pointer-events-none absolute inset-x-0 bg-[repeating-linear-gradient(135deg,var(--muted)_0_6px,transparent_6px_12px)] opacity-90"
          style={{ top: px(s), height: px(e) - px(s) }}
        />
      ))}
      {column.off.map((o) => (
        <div
          key={`off-${o.start}`}
          className="pointer-events-none absolute inset-x-0 flex items-start justify-center bg-muted/80 pt-2 text-xs font-medium text-muted-foreground"
          style={{
            top: px(Math.max(from, o.start)),
            height: px(Math.min(to, o.end)) - px(Math.max(from, o.start)),
          }}
        >
          {o.reason}
        </div>
      ))}
      {label && (
        <p className="pointer-events-none absolute inset-x-0 top-4 text-center text-sm font-medium text-muted-foreground">
          {label}
        </p>
      )}
    </>
  );
}
