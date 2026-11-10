"use client";

import { CheckCircle2, PhoneOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { BookingActions } from "@/components/panel/booking-actions";
import { StatusBadge } from "@/components/panel/status-badge";
import { Link } from "@/i18n/navigation";
import { formatPhone } from "@/lib/phone";
import type { BookingRowData } from "@/server/panel/serialize";

/** One booking line with quick actions (Today, client history, bookings list). */
export function BookingRow({ row, showDate = false }: { row: BookingRowData; showDate?: boolean }) {
  const t = useTranslations("Today");
  const ts = useTranslations("Source");
  const active = row.status === "PENDING" || row.status === "CONFIRMED";
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <Link
        href={`/panel/kalendar?date=${row.date}&booking=${row.id}`}
        className="flex min-w-0 flex-1 items-start gap-4 rounded-lg outline-offset-4"
        aria-label={`${row.time} ${row.clientName}`}
      >
        <div className="w-14 shrink-0 text-center">
          <p className="text-lg leading-tight font-bold tabular-nums">{row.time}</p>
          {showDate && (
            <p className="text-xs text-muted-foreground">
              {row.date.slice(8)}.{row.date.slice(5, 7)}
            </p>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
            <span className="truncate">{row.clientName}</span>
            {row.coming && active && (
              <span title={t("clientComing")} className="text-success">
                <CheckCircle2 className="size-4" aria-label={t("clientComing")} />
              </span>
            )}
            {!row.telegram && active && (
              <span title={t("noTelegram")} className="text-muted-foreground">
                <PhoneOff className="size-4" aria-label={t("noTelegram")} />
              </span>
            )}
            <StatusBadge status={row.status} />
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {row.service} · {row.staffName} · {row.priceLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatPhone(row.clientPhone)} · {ts(row.source)}
            {showDate && <> · {row.dateLabel}</>}
          </p>
        </div>
      </Link>
      <div className="sm:shrink-0">
        <BookingActions
          bookingId={row.id}
          status={row.status}
          canMarkOutcome={row.canMarkOutcome}
          canEditOutcome={row.canEditOutcome}
          compact
        />
      </div>
    </li>
  );
}
