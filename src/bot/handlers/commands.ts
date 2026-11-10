// Commands and main-menu buttons (spec 8.3).
import type { Bot } from "grammy";
import type { Locale } from "@/config/locales";
import { publicEnv } from "@/config/public-env";
import { serviceNameFor, whenFor, loadBookingForMessages } from "@/bot/booking-messages";
import type { BotContext } from "@/bot/context";
import { escapeHtml } from "@/bot/html";
import { clientBookingKeyboard, languageKeyboard, panelKeyboard } from "@/bot/keyboards";
import { ru } from "@/bot/texts/ru";
import { uz } from "@/bot/texts/uz";
import { db } from "@/lib/db";
import { dateInZone, dayRangeUtc, formatDateLong, timeInZone } from "@/lib/time";
import { sendWelcome } from "@/bot/handlers/start";

const MY_BOOKINGS_LIMIT = 10;

async function myBookings(ctx: BotContext): Promise<void> {
  if (!ctx.from) return;
  const bookings = await db.booking.findMany({
    where: {
      client: { telegramId: BigInt(ctx.from.id) },
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { gt: new Date() },
    },
    orderBy: { startsAt: "asc" },
    take: MY_BOOKINGS_LIMIT,
    select: { id: true },
  });
  if (bookings.length === 0) {
    await ctx.reply(ctx.t.noActiveBookings);
    return;
  }
  await ctx.reply(ctx.t.myBookingsHeader, { parse_mode: "HTML" });
  for (const { id } of bookings) {
    const b = await loadBookingForMessages(id);
    if (!b) continue;
    const { date, time } = whenFor(b, ctx.locale);
    await ctx.reply(
      ctx.t.myBookingLine({
        business: b.business.name,
        date,
        time,
        service: serviceNameFor(b, ctx.locale),
        status: ctx.t.statusLabels[b.status],
      }),
      { parse_mode: "HTML", reply_markup: clientBookingKeyboard(ctx.t, b.id, b.manageToken) },
    );
  }
}

/** Today's schedule for every business the user belongs to. */
export async function todaySchedule(ctx: BotContext): Promise<void> {
  if (!ctx.from) return;
  const user = await db.user.findUnique({
    where: { telegramId: BigInt(ctx.from.id) },
    include: { memberships: { include: { business: true } } },
  });
  if (!user || user.memberships.length === 0) {
    await ctx.reply(ctx.t.unknown);
    return;
  }
  for (const { business } of user.memberships) {
    const today = dateInZone(new Date(), business.timezone);
    const { start, end } = dayRangeUtc(today, business.timezone);
    const bookings = await db.booking.findMany({
      where: {
        businessId: business.id,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"] },
        startsAt: { gte: start, lt: end },
      },
      orderBy: { startsAt: "asc" },
      include: {
        client: { select: { name: true } },
        staff: { select: { name: true } },
        service: { select: { nameRu: true } },
      },
    });
    const header = ctx.t.todayHeader({
      business: business.name,
      date: formatDateLong(today, ctx.locale),
      count: bookings.length,
    });
    const lines = bookings.map((b) => {
      const service =
        ctx.locale === "ru" ? (b.service.nameRu ?? b.serviceNameSnapshot) : b.serviceNameSnapshot;
      const mark = b.status === "PENDING" ? " ⏳" : "";
      return `${timeInZone(b.startsAt, business.timezone)} — ${escapeHtml(b.client.name)} · ${escapeHtml(service)} · ${escapeHtml(b.staff.name)}${mark}`;
    });
    await ctx.reply(`${header}\n\n${lines.length ? lines.join("\n") : ctx.t.todayEmpty}`, {
      parse_mode: "HTML",
      reply_markup: panelKeyboard(ctx.t),
    });
  }
}

const buttonTexts = (key: "myBookings" | "language" | "today") => [
  uz.buttons[key],
  ru.buttons[key],
];

export function registerCommands(bot: Bot<BotContext>): void {
  bot.command("yozilishlarim", myBookings);
  bot.hears(buttonTexts("myBookings"), myBookings);

  bot.command("bugun", todaySchedule);
  bot.hears(buttonTexts("today"), todaySchedule);

  const chooseLanguage = (ctx: BotContext) =>
    ctx.reply(ctx.t.chooseLanguage, { reply_markup: languageKeyboard(ctx.t) });
  bot.command("til", chooseLanguage);
  bot.hears(buttonTexts("language"), chooseLanguage);

  bot.command("yordam", (ctx) =>
    ctx.reply(
      publicEnv.supportTelegram
        ? ctx.t.help({ support: publicEnv.supportTelegram })
        : ctx.t.unknown,
      { parse_mode: "HTML" },
    ),
  );
  bot.command("id", (ctx) =>
    ctx.reply(ctx.t.yourId({ id: String(ctx.from?.id ?? "") }), { parse_mode: "HTML" }),
  );
}

export async function sendMenu(ctx: BotContext): Promise<void> {
  await sendWelcome(ctx);
}

export type { Locale };
