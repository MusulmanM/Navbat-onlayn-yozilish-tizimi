// /start and its deep links (spec 8.2): biz_<slug>, bk_<token>, login_<token>.
import type { Bot } from "grammy";
import { categoryName } from "@/config/categories";
import { absoluteUrl, publicEnv } from "@/config/public-env";
import { clientBookingText, loadBookingForMessages } from "@/bot/booking-messages";
import type { BotContext } from "@/bot/context";
import {
  callbackButton,
  clientBookingKeyboard,
  keyboard,
  mainMenu,
  panelKeyboard,
  urlButton,
  webAppButton,
} from "@/bot/keyboards";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { dayKeyOf, parseWeeklySchedule } from "@/lib/schedule";
import { dateInZone } from "@/lib/time";
import { isTokenShape } from "@/lib/tokens";
import { getLoginTokenState } from "@/server/login";
import { scheduleReminders } from "@/server/reminders";

export async function isOwner(telegramId: bigint): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { telegramId },
    select: { memberships: { select: { id: true }, take: 1 } },
  });
  return (user?.memberships.length ?? 0) > 0;
}

export async function sendWelcome(ctx: BotContext): Promise<void> {
  const from = ctx.from;
  if (!from) return;
  const owner = await isOwner(BigInt(from.id));
  await ctx.reply(
    ctx.t.welcome({
      firstName: from.first_name,
      brand: publicEnv.brandName,
      appUrl: publicEnv.appUrl,
    }),
    {
      parse_mode: "HTML",
      reply_markup: mainMenu(ctx.t, owner),
      link_preview_options: { is_disabled: true },
    },
  );
  if (owner) {
    const panel = panelKeyboard(ctx.t);
    if (panel.inline_keyboard.length > 0) {
      await ctx.reply(ctx.t.buttons.openPanel, { reply_markup: panel });
    }
  }
}

async function businessStart(ctx: BotContext, slug: string): Promise<void> {
  const business = await db.business.findUnique({ where: { slug } });
  if (!business || !business.isPublished) {
    await sendWelcome(ctx);
    return;
  }
  const schedule = parseWeeklySchedule(business.weeklySchedule);
  const today = schedule[dayKeyOf(dateInZone(new Date(), business.timezone))];
  const text = ctx.t.businessCard({
    name: business.name,
    category: categoryName(business.category, ctx.locale),
    address: business.address,
    landmark: business.landmark,
    todayHours: today.open ? `${today.start}–${today.end}` : null,
    phone: formatPhone(business.phone),
  });
  const pageUrl = absoluteUrl(`${ctx.locale === "ru" ? "/ru" : ""}/b/${business.slug}`);
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: keyboard(
      [
        webAppButton(ctx.t.buttons.book, `${pageUrl}?src=tg`) ??
          urlButton(ctx.t.buttons.book, pageUrl),
      ],
      [urlButton(ctx.t.buttons.map, business.mapUrl)],
    ),
  });
}

/** bk_<token>: connect this chat to the client and plan reminders. */
export async function linkBooking(ctx: BotContext, token: string): Promise<void> {
  const from = ctx.from;
  if (!from || !isTokenShape(token)) {
    await ctx.reply(ctx.t.bookingNotFound);
    return;
  }
  const booking = await db.booking.findUnique({
    where: { manageToken: token },
    select: { id: true, clientId: true },
  });
  if (!booking) {
    await ctx.reply(ctx.t.bookingNotFound);
    return;
  }
  const telegramId = BigInt(from.id);
  await db.client.update({ where: { id: booking.clientId }, data: { telegramId } });

  const full = await loadBookingForMessages(booking.id);
  if (!full) return;
  const active = full.status === "PENDING" || full.status === "CONFIRMED";
  if (!active || full.startsAt < new Date()) {
    await ctx.reply(ctx.t.bookingNotFound);
    return;
  }
  await ctx.reply(clientBookingText(full, ctx.locale), {
    parse_mode: "HTML",
    reply_markup: clientBookingKeyboard(ctx.t, full.id, full.manageToken),
  });

  // Reminders for this and every other upcoming confirmed booking of the same client.
  const upcoming = await db.booking.findMany({
    where: { clientId: booking.clientId, status: "CONFIRMED", startsAt: { gt: new Date() } },
    select: { id: true },
  });
  for (const b of upcoming) await scheduleReminders(b.id);
}

async function loginStart(ctx: BotContext, token: string): Promise<void> {
  const state = await getLoginTokenState(token);
  if (!state || state.state !== "PENDING") {
    await ctx.reply(ctx.t.loginExpired);
    return;
  }
  await ctx.reply(ctx.t.loginRequest({ brand: publicEnv.brandName }), {
    parse_mode: "HTML",
    reply_markup: keyboard([
      callbackButton(ctx.t.buttons.loginConfirm, `la:${token}`),
      callbackButton(ctx.t.buttons.loginReject, `lr:${token}`),
    ]),
  });
}

export function registerStart(bot: Bot<BotContext>): void {
  bot.command("start", async (ctx) => {
    const payload = (typeof ctx.match === "string" ? ctx.match : "").trim();
    if (payload.startsWith("login_")) return loginStart(ctx, payload.slice("login_".length));
    if (payload.startsWith("biz_")) return businessStart(ctx, payload.slice("biz_".length));
    if (payload.startsWith("bk_")) return linkBooking(ctx, payload.slice("bk_".length));
    return sendWelcome(ctx);
  });
}
