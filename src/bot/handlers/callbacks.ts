// Inline button callbacks (spec 8.4). Every handler checks permissions, always answers the
// callback query and edits the message so stale buttons do not stay behind.
import type { Bot } from "grammy";
import { isLocale } from "@/config/locales";
import {
  cardData,
  clientBookingText,
  loadBookingForMessages,
  ownerData,
  type BookingForMessages,
} from "@/bot/booking-messages";
import type { BotContext } from "@/bot/context";
import {
  EMPTY_KEYBOARD,
  cancelConfirmKeyboard,
  clientBookingKeyboard,
  rebookKeyboard,
} from "@/bot/keyboards";
import { botTexts } from "@/bot/texts";
import { mainMenu } from "@/bot/keyboards";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { visitDayWord } from "@/lib/reminders";
import { confirmLoginToken, rejectLoginToken } from "@/server/login";
import { transitionBooking, transitionErrorCode } from "@/server/booking-status";
import { isOwner } from "@/bot/handlers/start";

const ID = "([A-Za-z0-9_-]{1,40})";

async function edit(ctx: BotContext, text: string, markup = EMPTY_KEYBOARD): Promise<void> {
  try {
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: markup });
  } catch (error) {
    // "message is not modified" and similar are harmless.
    console.warn("[bot] edit failed", error instanceof Error ? error.message : error);
  }
}

/** Client-owned booking or null (spec 8.4: from.id must equal client.telegramId). */
async function clientBooking(
  ctx: BotContext,
  bookingId: string,
): Promise<BookingForMessages | null> {
  const booking = await loadBookingForMessages(bookingId);
  if (!booking || !ctx.from || booking.client.telegramId !== BigInt(ctx.from.id)) {
    await ctx.answerCallbackQuery({ text: ctx.t.notAllowed, show_alert: true });
    return null;
  }
  return booking;
}

/** Booking that belongs to a business the user is a member of. */
async function ownerBooking(ctx: BotContext, bookingId: string) {
  const booking = await loadBookingForMessages(bookingId);
  if (!booking || !ctx.from) return null;
  const membership = await db.membership.findFirst({
    where: { businessId: booking.businessId, user: { telegramId: BigInt(ctx.from.id) } },
    include: { user: { select: { locale: true } } },
  });
  if (!membership) {
    await ctx.answerCallbackQuery({ text: ctx.t.notAllowed, show_alert: true });
    return null;
  }
  return booking;
}

function restoreClientMessage(ctx: BotContext, booking: BookingForMessages) {
  return edit(
    ctx,
    clientBookingText(booking, ctx.locale),
    clientBookingKeyboard(ctx.t, booking.id, booking.manageToken),
  );
}

export function registerCallbacks(bot: Bot<BotContext>): void {
  // c: ask "really cancel?"
  bot.callbackQuery(new RegExp(`^c:${ID}$`), async (ctx) => {
    const booking = await clientBooking(ctx, ctx.match[1]);
    if (!booking) return;
    await ctx.answerCallbackQuery();
    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      await edit(ctx, ctx.t.bookingNotFound);
      return;
    }
    await edit(
      ctx,
      `${clientBookingText(booking, ctx.locale)}\n\n<b>${ctx.t.cancelAsk}</b>`,
      cancelConfirmKeyboard(ctx.t, booking.id),
    );
  });

  // cy: cancel for real
  bot.callbackQuery(new RegExp(`^cy:${ID}$`), async (ctx) => {
    const booking = await clientBooking(ctx, ctx.match[1]);
    if (!booking) return;
    try {
      await transitionBooking({
        bookingId: booking.id,
        businessId: booking.businessId,
        to: "CANCELLED_BY_CLIENT",
        actor: "client",
      });
      await ctx.answerCallbackQuery();
      await edit(ctx, ctx.t.cancelledByClient, rebookKeyboard(ctx.t, booking.business.slug));
    } catch (error) {
      const code = transitionErrorCode(error);
      if (code === "TOO_LATE_TO_CANCEL") {
        await ctx.answerCallbackQuery();
        await edit(
          ctx,
          ctx.t.tooLateToCancel({
            hours: booking.business.cancelUntilHours,
            phone: formatPhone(booking.business.phone),
          }),
        );
        return;
      }
      await ctx.answerCallbackQuery({ text: ctx.t.bookingNotFound, show_alert: true });
      if (!code) throw error;
    }
  });

  // cn: keep the booking, restore buttons
  bot.callbackQuery(new RegExp(`^cn:${ID}$`), async (ctx) => {
    const booking = await clientBooking(ctx, ctx.match[1]);
    if (!booking) return;
    await ctx.answerCallbackQuery();
    await restoreClientMessage(ctx, booking);
  });

  // k: "I'm coming"
  bot.callbackQuery(new RegExp(`^k:${ID}$`), async (ctx) => {
    const booking = await clientBooking(ctx, ctx.match[1]);
    if (!booking) return;
    await db.booking.update({ where: { id: booking.id }, data: { clientConfirmedAt: new Date() } });
    await ctx.answerCallbackQuery({ text: ctx.t.comingThanks });
    const data = cardData(booking, ctx.locale);
    const word = visitDayWord(booking.startsAt, new Date(), booking.business.timezone);
    const text = ctx.t.reminder24({
      dayWord: word ? ctx.t.dayWords[word] : data.date,
      time: data.time,
      business: data.business,
      service: data.service,
      staff: data.staff,
      address: data.address,
    });
    await edit(ctx, `${text}\n\n${ctx.t.comingThanks}`);
  });

  // oa: / or: owner approves or rejects a pending booking
  for (const [prefix, to] of [
    ["oa", "CONFIRMED"],
    ["or", "CANCELLED_BY_BUSINESS"],
  ] as const) {
    bot.callbackQuery(new RegExp(`^${prefix}:${ID}$`), async (ctx) => {
      const booking = await ownerBooking(ctx, ctx.match[1]);
      if (!booking) return;
      const owner = await db.user.findUnique({
        where: { telegramId: BigInt(ctx.from.id) },
        select: { locale: true },
      });
      const t = botTexts(owner?.locale ?? ctx.locale);
      const base = t.ownerNewBooking({
        ...ownerData(booking, owner?.locale ?? ctx.locale),
        pending: false,
      });
      try {
        await transitionBooking({
          bookingId: booking.id,
          businessId: booking.businessId,
          to,
          actor: "business",
        });
        await ctx.answerCallbackQuery();
        await edit(
          ctx,
          base + (to === "CONFIRMED" ? t.ownerConfirmedSuffix : t.ownerRejectedSuffix),
        );
      } catch (error) {
        const code = transitionErrorCode(error);
        await ctx.answerCallbackQuery({ text: t.statusLabels[booking.status], show_alert: true });
        await edit(ctx, `${base}\n\n· ${t.statusLabels[booking.status]}`);
        if (!code) throw error;
      }
    });
  }

  // la: / lr: confirm or reject a website login
  bot.callbackQuery(/^la:([A-Za-z0-9_-]{32})$/, async (ctx) => {
    const ok = await confirmLoginToken(ctx.match[1], {
      id: BigInt(ctx.from.id),
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
      username: ctx.from.username,
      languageCode: ctx.from.language_code,
    });
    await ctx.answerCallbackQuery();
    await edit(ctx, ok ? ctx.t.loginDone : ctx.t.loginExpired);
  });
  bot.callbackQuery(/^lr:([A-Za-z0-9_-]{32})$/, async (ctx) => {
    const ok = await rejectLoginToken(ctx.match[1]);
    await ctx.answerCallbackQuery();
    await edit(ctx, ok ? ctx.t.loginRejected : ctx.t.loginExpired);
  });

  // lang:uz / lang:ru
  bot.callbackQuery(/^lang:(uz|ru)$/, async (ctx) => {
    const locale = ctx.match[1];
    if (!isLocale(locale)) return;
    const telegramId = BigInt(ctx.from.id);
    await db.telegramChat.update({ where: { telegramId }, data: { locale } });
    await db.user.updateMany({ where: { telegramId }, data: { locale } });
    const t = botTexts(locale);
    await ctx.answerCallbackQuery();
    await edit(ctx, t.languageChanged);
    await ctx.reply(t.languageChanged, { reply_markup: mainMenu(t, await isOwner(telegramId)) });
  });

  // Unknown or outdated buttons.
  bot.on("callback_query:data", (ctx) => ctx.answerCallbackQuery({ text: ctx.t.bookingNotFound }));
}
