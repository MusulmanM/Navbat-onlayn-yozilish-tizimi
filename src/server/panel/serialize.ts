// Turns database bookings into plain, pre-formatted rows for client components.
import type { Locale } from "@/config/locales";
import { HOUR_MS } from "@/lib/time";
import { canEditOutcome, OUTCOME_EARLY_MS } from "@/lib/bookings";
import { formatMoney } from "@/lib/money";
import { dateInZone, formatDateLong, timeInZone, zonedParts } from "@/lib/time";
import type { PanelBooking } from "@/server/panel/queries";

export type BookingRowData = {
  id: string;
  status: PanelBooking["status"];
  source: PanelBooking["source"];
  date: string;
  dateLabel: string;
  time: string;
  endTime: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  telegram: boolean;
  coming: boolean;
  service: string;
  serviceId: string;
  /** Minutes since local midnight (for the calendar grid). */
  startMin: number;
  endMin: number;
  staffId: string;
  staffName: string;
  priceLabel: string;
  durationMinutes: number;
  clientComment: string | null;
  internalNote: string | null;
  cancelReason: string | null;
  manageToken: string;
  startsAt: string;
  canMarkOutcome: boolean;
  canEditOutcome: boolean;
};

export function toRow(
  b: PanelBooking,
  locale: Locale,
  timezone: string,
  now: Date,
): BookingRowData {
  const date = dateInZone(b.startsAt, timezone);
  return {
    id: b.id,
    status: b.status,
    source: b.source,
    date,
    dateLabel: formatDateLong(date, locale),
    time: timeInZone(b.startsAt, timezone),
    endTime: timeInZone(b.endsAt, timezone),
    clientId: b.client.id,
    clientName: b.client.name,
    clientPhone: b.client.phone,
    telegram: b.client.telegramId !== null,
    coming: b.clientConfirmedAt !== null,
    service: locale === "ru" ? (b.service.nameRu ?? b.serviceNameSnapshot) : b.serviceNameSnapshot,
    serviceId: b.serviceId,
    startMin: zonedParts(b.startsAt, timezone).minutes,
    endMin: Math.min(
      24 * 60,
      zonedParts(b.startsAt, timezone).minutes +
        Math.round((b.endsAt.getTime() - b.startsAt.getTime()) / 60000),
    ),
    staffId: b.staff.id,
    staffName: b.staff.name,
    priceLabel: formatMoney(b.priceSnapshot, locale),
    durationMinutes: b.durationSnapshot,
    clientComment: b.clientComment,
    internalNote: b.internalNote,
    cancelReason: b.cancelReason,
    manageToken: b.manageToken,
    startsAt: b.startsAt.toISOString(),
    canMarkOutcome: now.getTime() >= b.startsAt.getTime() - OUTCOME_EARLY_MS,
    canEditOutcome: canEditOutcome(b.startsAt, now),
  };
}

export { HOUR_MS };
