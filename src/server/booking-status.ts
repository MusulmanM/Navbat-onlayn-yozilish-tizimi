// The single place where booking statuses change (spec 6.4), used by the panel, bot and cron.
import type { BookingStatus } from "@/generated/prisma/client";
import { BookingTransitionError, checkTransition, type Actor } from "@/lib/bookings";
import { db } from "@/lib/db";
import { notifyLater } from "@/lib/notify";
import { ApiError } from "@/server/api";
import { cancelPendingReminders, scheduleReminders } from "@/server/reminders";

export type TransitionArgs = {
  bookingId: string;
  /** Scope: the booking must belong to this business (never trust ids from the client). */
  businessId: string;
  to: BookingStatus;
  actor: Actor;
  reason?: string | null;
  now?: Date;
  /** Skip notifications (e.g. AUTO_EXPIRED or when the caller sends its own). */
  silent?: boolean;
};

export async function transitionBooking(args: TransitionArgs) {
  const now = args.now ?? new Date();
  const booking = await db.booking.findFirst({
    where: { id: args.bookingId, businessId: args.businessId },
    include: { business: { select: { cancelUntilHours: true } } },
  });
  if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND");

  const error = checkTransition(booking.status, args.to, args.actor, {
    startsAt: booking.startsAt,
    now,
    cancelUntilHours: booking.business.cancelUntilHours,
  });
  if (error) throw new BookingTransitionError(error);

  const cancelled = args.to === "CANCELLED_BY_CLIENT" || args.to === "CANCELLED_BY_BUSINESS";
  const updated = await db.$transaction(async (tx) => {
    const result = await tx.booking.updateMany({
      where: { id: booking.id, status: booking.status },
      data: {
        status: args.to,
        ...(cancelled ? { cancelledAt: now, cancelReason: args.reason?.trim() || null } : {}),
      },
    });
    if (result.count === 0) throw new BookingTransitionError("NOT_ALLOWED");
    if (cancelled || args.to === "COMPLETED" || args.to === "NO_SHOW") {
      await cancelPendingReminders(booking.id, tx);
    }
    return tx.booking.findUniqueOrThrow({ where: { id: booking.id } });
  });

  if (args.to === "CONFIRMED") await scheduleReminders(booking.id, now);

  if (!args.silent) {
    const id = booking.id;
    if (args.to === "CONFIRMED" && booking.status === "PENDING")
      notifyLater((n) => n.bookingConfirmed(id));
    if (args.to === "CANCELLED_BY_CLIENT") notifyLater((n) => n.bookingCancelled(id, "client"));
    if (args.to === "CANCELLED_BY_BUSINESS") notifyLater((n) => n.bookingCancelled(id, "business"));
  }
  return updated;
}

export function transitionErrorCode(error: unknown): string | null {
  if (error instanceof BookingTransitionError) return error.code;
  if (error instanceof ApiError) return error.code;
  return null;
}
