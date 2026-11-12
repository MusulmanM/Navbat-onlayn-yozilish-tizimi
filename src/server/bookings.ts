// Public booking flow (spec 6.3) and client-side actions on a booking (spec 7.3).
import { z } from "zod";
import { botStartLink } from "@/config/public-env";
import { MAX_ACTIVE_BOOKINGS_PER_PHONE } from "@/config/site";
import type { BookingSource, BookingStatus } from "@/generated/prisma/client";
import { canAcceptOnlineBookings, getAccess } from "@/lib/access";
import { bookingTimes, checkTransition } from "@/lib/bookings";
import { db, isOverlapError, withTxRetry } from "@/lib/db";
import { notifyLater } from "@/lib/notify";
import { normalizePhone } from "@/lib/phone";
import { rateLimitIp } from "@/lib/rate-limit";
import { verifyInitData } from "@/lib/telegram/init-data";
import { dateInZone } from "@/lib/time";
import { isTokenShape, randomToken } from "@/lib/tokens";
import { ApiError, parseOrThrow } from "@/server/api";
import { loadAvailability, orderStaffForDay } from "@/server/availability";
import { cancelPendingReminders, scheduleReminders } from "@/server/reminders";

const MAX_STAFF_ATTEMPTS = 3;

export const publicBookingSchema = z.object({
  serviceId: z.string().trim().min(1).max(64),
  staffId: z.string().trim().min(1).max(64),
  startsAt: z.iso.datetime({ offset: true }),
  name: z
    .string()
    .transform((v) => v.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(2, "name").max(60, "name")),
  phone: z
    .string()
    .max(40)
    .transform((v) => normalizePhone(v) ?? "")
    .pipe(z.string().min(1, "phone")),
  comment: z
    .string()
    .max(300, "comment")
    .optional()
    .transform((v) => v?.trim() || undefined),
  consent: z.literal(true, "consent"),
  website: z.string().max(200).optional(),
  tgInitData: z.string().max(4096).optional(),
});

export type PublicBookingResult = {
  bookingId: string;
  manageToken: string;
  status: BookingStatus;
  startsAt: string;
  telegramLink: string | null;
  telegramLinked: boolean;
  staffName: string;
};

export async function createPublicBooking(
  slug: string,
  raw: unknown,
  ctx: { ip: string; now?: Date },
): Promise<PublicBookingResult> {
  const now = ctx.now ?? new Date();
  const input = parseOrThrow(publicBookingSchema, raw);
  // Honeypot: bots fill every field. Do not reveal why the request failed.
  if (input.website) throw new ApiError(400, "VALIDATION_ERROR");

  const business = await db.business.findUnique({ where: { slug } });
  if (!business || !business.isPublished) throw new ApiError(404, "BUSINESS_NOT_FOUND");
  if (!canAcceptOnlineBookings(getAccess(business, now).state)) {
    throw new ApiError(403, "BOOKING_DISABLED", undefined, { phone: business.phone });
  }

  const limit = await rateLimitIp("book", ctx.ip);
  if (!limit.ok) throw new ApiError(429, "TOO_MANY_REQUESTS");

  // Never trust the client: the chosen time must be a real free slot right now.
  const startsAt = new Date(input.startsAt);
  const date = dateInZone(startsAt, business.timezone);
  const { service, staff, slotsByDate } = await loadAvailability({
    business,
    serviceId: input.serviceId,
    staffId: input.staffId,
    dates: [date],
    now,
  });
  const slot = slotsByDate.get(date)?.find((s) => s.startsAt.getTime() === startsAt.getTime());
  if (!slot) throw new ApiError(409, "SLOT_TAKEN");

  const candidates =
    input.staffId === "any"
      ? await orderStaffForDay(
          business,
          staff.filter((s) => slot.staffIds.includes(s.id)),
          date,
        )
      : slot.staffIds.filter((id) => id === input.staffId);
  if (candidates.length === 0) throw new ApiError(409, "SLOT_TAKEN");

  // Telegram Mini App: identify the client by the signed initData.
  let telegramId: bigint | null = null;
  let source: BookingSource = "WEB";
  if (input.tgInitData) {
    const verified = verifyInitData(input.tgInitData, process.env.TELEGRAM_BOT_TOKEN ?? "", now);
    if (verified.ok) {
      telegramId = verified.user.id;
      source = "TELEGRAM";
    } else {
      console.warn(`[booking] ignored invalid Telegram initData: ${verified.error}`);
    }
  }

  const activeForPhone = await db.booking.count({
    where: {
      businessId: business.id,
      client: { phone: input.phone },
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { gt: now },
    },
  });
  if (activeForPhone >= MAX_ACTIVE_BOOKINGS_PER_PHONE) {
    throw new ApiError(422, "TOO_MANY_ACTIVE_BOOKINGS", undefined, {
      max: MAX_ACTIVE_BOOKINGS_PER_PHONE,
    });
  }

  const status: BookingStatus = business.autoConfirm ? "CONFIRMED" : "PENDING";
  const { endsAt, blockedUntil } = bookingTimes(
    startsAt,
    service.durationMinutes,
    service.bufferMinutes,
  );

  let created: {
    id: string;
    manageToken: string;
    staffId: string;
    clientTelegramId: bigint | null;
  } | null = null;
  for (const staffId of candidates.slice(0, MAX_STAFF_ATTEMPTS)) {
    try {
      created = await withTxRetry(() =>
        db.$transaction(async (tx) => {
          const client = await tx.client.upsert({
            where: { businessId_phone: { businessId: business.id, phone: input.phone } },
            update: telegramId ? { telegramId } : {},
            create: { businessId: business.id, name: input.name, phone: input.phone, telegramId },
          });
          const booking = await tx.booking.create({
            data: {
              businessId: business.id,
              staffId,
              serviceId: service.id,
              clientId: client.id,
              startsAt,
              endsAt,
              blockedUntil,
              status,
              source,
              serviceNameSnapshot: service.nameUz,
              priceSnapshot: service.price,
              durationSnapshot: service.durationMinutes,
              clientComment: input.comment,
              manageToken: randomToken(),
            },
            select: { id: true, manageToken: true, staffId: true },
          });
          return { ...booking, clientTelegramId: client.telegramId };
        }),
      );
      break;
    } catch (error) {
      if (isOverlapError(error)) continue; // someone took this staff member a moment ago
      throw error;
    }
  }
  if (!created) throw new ApiError(409, "SLOT_TAKEN");

  if (status === "CONFIRMED" && created.clientTelegramId !== null) {
    await scheduleReminders(created.id, now);
  }
  const bookingId = created.id;
  notifyLater((n) => n.bookingCreated(bookingId));

  return {
    bookingId,
    manageToken: created.manageToken,
    status,
    startsAt: startsAt.toISOString(),
    telegramLink: botStartLink(`bk_${created.manageToken}`),
    telegramLinked: created.clientTelegramId !== null,
    staffName: staff.find((s) => s.id === created.staffId)?.name ?? "",
  };
}

/** Booking for the client's manage page; looked up only by the secret token. */
export async function getBookingByToken(token: string) {
  if (!isTokenShape(token)) return null;
  return db.booking.findUnique({
    where: { manageToken: token },
    include: {
      business: true,
      staff: { select: { id: true, name: true } },
      service: { select: { nameUz: true, nameRu: true } },
      client: { select: { name: true, telegramId: true } },
    },
  });
}

export const cancelSchema = z.object({
  reason: z
    .string()
    .max(300)
    .optional()
    .transform((v) => v?.trim() || undefined),
});

export async function cancelByClient(
  token: string,
  raw: unknown,
  ctx: { ip: string; now?: Date },
): Promise<{ status: BookingStatus }> {
  const now = ctx.now ?? new Date();
  const { reason } = parseOrThrow(cancelSchema, raw ?? {});
  const limit = await rateLimitIp("cancel", ctx.ip);
  if (!limit.ok) throw new ApiError(429, "TOO_MANY_REQUESTS");

  const booking = await getBookingByToken(token);
  if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND");
  const error = checkTransition(booking.status, "CANCELLED_BY_CLIENT", "client", {
    startsAt: booking.startsAt,
    now,
    cancelUntilHours: booking.business.cancelUntilHours,
  });
  if (error) {
    throw new ApiError(409, error, undefined, {
      phone: booking.business.phone,
      hours: booking.business.cancelUntilHours,
    });
  }

  await db.$transaction(async (tx) => {
    // Guard against a concurrent status change: only update if the status is unchanged.
    const updated = await tx.booking.updateMany({
      where: { id: booking.id, status: booking.status },
      data: { status: "CANCELLED_BY_CLIENT", cancelledAt: now, cancelReason: reason ?? null },
    });
    if (updated.count === 0) throw new ApiError(409, "NOT_ALLOWED");
    await cancelPendingReminders(booking.id, tx);
  });
  notifyLater((n) => n.bookingCancelled(booking.id, "client"));
  return { status: "CANCELLED_BY_CLIENT" };
}
