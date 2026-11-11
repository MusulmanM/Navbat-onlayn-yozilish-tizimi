// Scheduled jobs (spec 9): reminders every 5 minutes, daily report / billing / cleanup at 08:00.
import { AUTO_COMPLETE_AFTER_HOURS, REMINDER_MAX_ATTEMPTS } from "@/config/site";
import { absoluteUrl } from "@/config/public-env";
import type { Locale } from "@/config/locales";
import {
  cardData,
  chatLocale,
  loadBookingForMessages,
  ownerRecipients,
} from "@/bot/booking-messages";
import { escapeHtml } from "@/bot/html";
import {
  clientBookingKeyboard,
  keyboard,
  reminder24Keyboard,
  urlButton,
  callbackButton,
} from "@/bot/keyboards";
import { sendMessage } from "@/bot/send";
import { botTexts } from "@/bot/texts";
import { getAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { visitDayWord } from "@/lib/reminders";
import { dayKeyOf, parseWeeklySchedule } from "@/lib/schedule";
import {
  DAY_MS,
  HOUR_MS,
  MINUTE_MS,
  dateInZone,
  dayRangeUtc,
  formatDateFull,
  formatDateLong,
  timeInZone,
} from "@/lib/time";

const CLAIM_LIMIT = 50;
const STUCK_AFTER_MS = 10 * MINUTE_MS;
const DAILY_REPORT_LINES = 30;

type ClaimedRow = {
  id: string;
  bookingId: string;
  chatId: bigint;
  type: "REMINDER_24H" | "REMINDER_2H";
  attempts: number;
};

/** Builds the reminder text and buttons at send time (the day word is "today/tomorrow" now). */
async function renderReminder(row: ClaimedRow, now: Date) {
  const booking = await loadBookingForMessages(row.bookingId);
  if (!booking) return null;
  const locale: Locale = await chatLocale(row.chatId);
  const t = botTexts(locale);
  const data = cardData(booking, locale);
  if (row.type === "REMINDER_24H") {
    const word = visitDayWord(booking.startsAt, now, booking.business.timezone);
    return {
      booking,
      text: t.reminder24({
        dayWord: word ? t.dayWords[word] : data.date,
        time: data.time,
        business: data.business,
        service: data.service,
        staff: data.staff,
        address: booking.business.address,
      }),
      markup: booking.clientConfirmedAt
        ? clientBookingKeyboard(t, booking.id, booking.manageToken)
        : reminder24Keyboard(t, booking.id),
    };
  }
  return {
    booking,
    text: t.reminder2({
      time: data.time,
      business: data.business,
      service: data.service,
      staff: data.staff,
      address: booking.business.address,
      landmark: booking.business.landmark,
    }),
    markup: keyboard(
      [urlButton(t.buttons.map, booking.business.mapUrl)],
      [callbackButton(t.buttons.cancel, `c:${booking.id}`)],
    ),
  };
}

export async function processReminders(now: Date = new Date()) {
  const stats = {
    claimed: 0,
    sent: 0,
    cancelled: 0,
    retried: 0,
    failed: 0,
    reset: 0,
    completed: 0,
    expired: 0,
  };

  // Messages stuck in SENDING (a crashed run) go back to the queue.
  stats.reset = (
    await db.scheduledMessage.updateMany({
      where: { status: "SENDING", updatedAt: { lt: new Date(now.getTime() - STUCK_AFTER_MS) } },
      data: { status: "PENDING" },
    })
  ).count;

  // Without a bot token nothing can be sent: leave reminders queued instead of failing them.
  const botReady = Boolean(process.env.TELEGRAM_BOT_TOKEN);

  // Atomic claim: two cron runs never take the same row (FOR UPDATE SKIP LOCKED).
  const claimed = !botReady
    ? []
    : await db.$queryRaw<ClaimedRow[]>`
    UPDATE "ScheduledMessage" SET "status" = 'SENDING', "attempts" = "attempts" + 1, "updatedAt" = now()
    WHERE "id" IN (
      SELECT "id" FROM "ScheduledMessage"
      WHERE "status" = 'PENDING' AND "sendAt" <= ${now}
      ORDER BY "sendAt"
      LIMIT ${CLAIM_LIMIT}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id", "bookingId", "chatId", "type", "attempts"`;
  stats.claimed = claimed.length;

  for (const row of claimed) {
    const rendered = await renderReminder(row, now);
    const chat = await db.telegramChat.findUnique({
      where: { telegramId: row.chatId },
      select: { isBlocked: true },
    });
    if (!rendered || rendered.booking.status !== "CONFIRMED" || chat?.isBlocked) {
      await db.scheduledMessage.update({ where: { id: row.id }, data: { status: "CANCELLED" } });
      stats.cancelled++;
      continue;
    }
    const result = await sendMessage(row.chatId, rendered.text, rendered.markup);
    if (result.ok) {
      await db.scheduledMessage.update({
        where: { id: row.id },
        data: { status: "SENT", sentAt: now, lastError: null },
      });
      stats.sent++;
    } else if (result.reason === "BLOCKED") {
      await db.scheduledMessage.update({
        where: { id: row.id },
        data: { status: "CANCELLED", lastError: "blocked" },
      });
      stats.cancelled++;
    } else if (result.reason === "RATE_LIMITED") {
      // Telegram asked us to wait: try again after retry_after, without spending an attempt.
      await db.scheduledMessage.update({
        where: { id: row.id },
        data: {
          status: "PENDING",
          attempts: { decrement: 1 },
          sendAt: new Date(now.getTime() + (result.retryAfter ?? 60) * 1000),
          lastError: result.error ?? "429",
        },
      });
      stats.retried++;
    } else if (row.attempts < REMINDER_MAX_ATTEMPTS) {
      await db.scheduledMessage.update({
        where: { id: row.id },
        data: { status: "PENDING", lastError: result.error ?? "error" },
      });
      stats.retried++;
    } else {
      await db.scheduledMessage.update({
        where: { id: row.id },
        data: { status: "FAILED", lastError: result.error ?? "error" },
      });
      stats.failed++;
    }
  }

  // Visits that ended long ago become COMPLETED (spec 6.4, system actor).
  stats.completed = (
    await db.booking.updateMany({
      where: {
        status: "CONFIRMED",
        endsAt: { lt: new Date(now.getTime() - AUTO_COMPLETE_AFTER_HOURS * HOUR_MS) },
      },
      data: { status: "COMPLETED" },
    })
  ).count;

  // Requests nobody confirmed before the visit expire silently.
  const expired = await db.booking.findMany({
    where: { status: "PENDING", startsAt: { lt: now } },
    select: { id: true },
  });
  if (expired.length) {
    const ids = expired.map((b) => b.id);
    stats.expired = (
      await db.booking.updateMany({
        where: { id: { in: ids }, status: "PENDING" },
        data: { status: "CANCELLED_BY_BUSINESS", cancelReason: "AUTO_EXPIRED", cancelledAt: now },
      })
    ).count;
    await db.scheduledMessage.updateMany({
      where: { bookingId: { in: ids }, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }
  return stats;
}

// ---------------------------------------------------------------------------

/** "Once per key per day" guard so a repeated cron call does not send twice. */
async function once(key: string): Promise<boolean> {
  return (await rateLimit(key, 1, 36 * 3600)).ok;
}

async function sendDailyReports(now: Date) {
  let sent = 0;
  const businesses = await db.business.findMany({ where: { isDemo: false, onboardingStep: null } });
  for (const business of businesses) {
    const state = getAccess(business, now).state;
    if (state === "EXPIRED" || state === "BLOCKED") continue;
    const tz = business.timezone;
    const today = dateInZone(now, tz);
    if (!parseWeeklySchedule(business.weeklySchedule)[dayKeyOf(today)].open) continue;
    if (!(await once(`daily:${business.id}:${today}`))) continue;

    const { start, end } = dayRangeUtc(today, tz);
    const bookings = await db.booking.findMany({
      where: {
        businessId: business.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { gte: start, lt: end },
      },
      orderBy: { startsAt: "asc" },
      include: {
        client: { select: { name: true } },
        staff: { select: { name: true } },
        service: { select: { nameRu: true } },
      },
    });
    for (const owner of await ownerRecipients(business.id)) {
      const t = botTexts(owner.locale);
      const date = formatDateLong(today, owner.locale);
      const text =
        bookings.length === 0
          ? t.dailyReportEmpty({ date, link: absoluteUrl(`/b/${business.slug}`) })
          : t.dailyReport({
              date,
              count: bookings.length,
              lines: bookings.slice(0, DAILY_REPORT_LINES).map((b) => {
                const service =
                  owner.locale === "ru"
                    ? (b.service.nameRu ?? b.serviceNameSnapshot)
                    : b.serviceNameSnapshot;
                const mark = b.status === "PENDING" ? " ⏳" : "";
                return `${timeInZone(b.startsAt, tz)} — ${escapeHtml(b.client.name)} · ${escapeHtml(service)} · ${escapeHtml(b.staff.name)}${mark}`;
              }),
              more: Math.max(0, bookings.length - DAILY_REPORT_LINES),
            });
      if ((await sendMessage(owner.chatId, text)).ok) sent++;
    }
  }
  return sent;
}

/** 3 and 1 days before the end, and when online booking switches off (spec 8.6, 9). */
async function sendBillingNotices(now: Date) {
  let sent = 0;
  const businesses = await db.business.findMany({ where: { isDemo: false, isBlocked: false } });
  for (const business of businesses) {
    const access = getAccess(business, now);
    const endDate = dateInZone(access.endsAt, business.timezone);
    let kind: "3d" | "1d" | "0d" | null = null;
    if (access.state === "TRIAL" || access.state === "ACTIVE") {
      const days = Math.ceil((access.endsAt.getTime() - now.getTime()) / DAY_MS);
      if (days === 3) kind = "3d";
      if (days === 1) kind = "1d";
    } else if (access.state === "EXPIRED") kind = "0d";
    if (!kind) continue;
    const marker = `${kind}:${endDate}`;
    if (business.lastBillingNotice === marker) continue; // already sent for this period
    await db.business.update({ where: { id: business.id }, data: { lastBillingNotice: marker } });

    const billingUrl = absoluteUrl("/panel/obuna");
    for (const owner of await ownerRecipients(business.id)) {
      const t = botTexts(owner.locale);
      const text =
        kind === "0d"
          ? t.billingExpired({ billingUrl })
          : t.billingWarning({
              date: formatDateFull(endDate, owner.locale),
              days: kind === "3d" ? 3 : 1,
              billingUrl,
            });
      if ((await sendMessage(owner.chatId, text)).ok) sent++;
    }
  }
  return sent;
}

export async function processDaily(now: Date = new Date()) {
  // Markers ("sent today") are only written when messages can actually be delivered.
  const botReady = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const reports = botReady ? await sendDailyReports(now) : 0;
  const billing = botReady ? await sendBillingNotices(now) : 0;
  const dayAgo = new Date(now.getTime() - DAY_MS);
  const loginTokens = (await db.loginToken.deleteMany({ where: { createdAt: { lt: dayAgo } } }))
    .count;
  const rateLimits = (
    await db.rateLimit.deleteMany({
      where: { windowStart: { lt: new Date(now.getTime() - 2 * DAY_MS) } },
    })
  ).count;
  return { reports, billing, cleaned: { loginTokens, rateLimits } };
}
