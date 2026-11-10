// Loads a booking with everything needed to render Telegram messages about it.
import { staffLabel } from "@/config/categories";
import type { Locale } from "@/config/locales";
import { botTexts } from "@/bot/texts";
import type { BookingCardData, OwnerBookingData } from "@/bot/texts/types";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { dateInZone, formatDateLong, timeInZone } from "@/lib/time";

export async function loadBookingForMessages(bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId },
    include: {
      business: true,
      staff: { select: { name: true } },
      service: { select: { nameUz: true, nameRu: true } },
      client: { select: { name: true, phone: true, telegramId: true } },
    },
  });
}

export type BookingForMessages = NonNullable<Awaited<ReturnType<typeof loadBookingForMessages>>>;

export function serviceNameFor(b: BookingForMessages, locale: Locale): string {
  return locale === "ru" ? (b.service.nameRu ?? b.serviceNameSnapshot) : b.serviceNameSnapshot;
}

export function whenFor(b: BookingForMessages, locale: Locale) {
  const tz = b.business.timezone;
  return {
    date: formatDateLong(dateInZone(b.startsAt, tz), locale),
    time: timeInZone(b.startsAt, tz),
  };
}

export function cardData(b: BookingForMessages, locale: Locale): BookingCardData {
  const { date, time } = whenFor(b, locale);
  return {
    business: b.business.name,
    service: serviceNameFor(b, locale),
    staffLabel: staffLabel(b.business.category, locale),
    staff: b.staff.name,
    date,
    time,
    price: formatMoney(b.priceSnapshot, locale),
    address: [b.business.address, b.business.landmark].filter(Boolean).join(", "),
  };
}

export function ownerData(b: BookingForMessages, locale: Locale): OwnerBookingData {
  const { date, time } = whenFor(b, locale);
  return {
    client: b.client.name,
    clientPhone: formatPhone(b.client.phone),
    service: serviceNameFor(b, locale),
    staff: b.staff.name,
    date,
    time,
    price: formatMoney(b.priceSnapshot, locale),
    source: b.source,
    comment: b.clientComment,
    pending: b.status === "PENDING",
  };
}

/** Client confirmation text matching the booking status. */
export function clientBookingText(b: BookingForMessages, locale: Locale): string {
  const t = botTexts(locale);
  const data = cardData(b, locale);
  return b.status === "PENDING" ? t.bookingPending(data) : t.bookingConfirmed(data);
}

/** Owners (and managers) of the business who want Telegram notifications. */
export async function ownerRecipients(businessId: string) {
  const members = await db.membership.findMany({
    where: { businessId, notify: true },
    select: { user: { select: { telegramId: true, locale: true } } },
  });
  return members.map((m) => ({ chatId: m.user.telegramId, locale: m.user.locale as Locale }));
}

export async function chatLocale(chatId: bigint): Promise<Locale> {
  const chat = await db.telegramChat.findUnique({
    where: { telegramId: chatId },
    select: { locale: true },
  });
  return (chat?.locale as Locale | undefined) ?? "uz";
}
