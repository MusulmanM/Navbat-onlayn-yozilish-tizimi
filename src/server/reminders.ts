// Creates / updates / cancels ScheduledMessage rows for a booking (spec 6.5).
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { reminderTestMode } from "@/lib/env";
import { computeReminderTimes, type ReminderType } from "@/lib/reminders";

type Tx = Prisma.TransactionClient;

const TYPES: ReminderType[] = ["REMINDER_24H", "REMINDER_2H"];

/** Cancels reminders that were not sent yet. */
export async function cancelPendingReminders(bookingId: string, tx: Tx = db): Promise<void> {
  await tx.scheduledMessage.updateMany({
    where: { bookingId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

/**
 * (Re)plans reminders: only for CONFIRMED bookings whose client has a Telegram chat.
 * Safe to call repeatedly (upsert per booking + type).
 */
export async function scheduleReminders(
  bookingId: string,
  now: Date = new Date(),
  tx: Tx = db,
): Promise<void> {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      startsAt: true,
      client: { select: { telegramId: true } },
      business: { select: { timezone: true, reminder24h: true, reminder2h: true } },
    },
  });
  if (!booking) return;
  const chatId = booking.client.telegramId;
  if (booking.status !== "CONFIRMED" || chatId === null) {
    await cancelPendingReminders(bookingId, tx);
    return;
  }

  const times = computeReminderTimes({
    startsAt: booking.startsAt,
    now,
    timezone: booking.business.timezone,
    reminder24h: booking.business.reminder24h,
    reminder2h: booking.business.reminder2h,
    testMode: reminderTestMode(),
  });

  for (const type of TYPES) {
    const sendAt = times[type];
    if (sendAt) {
      await tx.scheduledMessage.upsert({
        where: { bookingId_type: { bookingId, type } },
        update: { sendAt, chatId, status: "PENDING", attempts: 0, lastError: null, sentAt: null },
        create: { bookingId, type, sendAt, chatId },
      });
    } else {
      await tx.scheduledMessage.updateMany({
        where: { bookingId, type, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    }
  }
}
