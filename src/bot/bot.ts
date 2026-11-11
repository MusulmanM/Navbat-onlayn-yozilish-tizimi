// grammY bot: the same handlers run in webhook mode (production) and long polling (local).
import { Bot, type BotConfig } from "grammy";
import type { BotContext } from "@/bot/context";
import { registerCallbacks } from "@/bot/handlers/callbacks";
import { registerCommands } from "@/bot/handlers/commands";
import { registerStart, sendWelcome } from "@/bot/handlers/start";
import { botTexts } from "@/bot/texts";
import { localeFromTelegram, type Locale } from "@/config/locales";
import { db } from "@/lib/db";
import { requireEnv } from "@/lib/env";

/** `config` lets tests pass botInfo so no getMe call is needed. */
export function createBot(token: string, config?: BotConfig<BotContext>): Bot<BotContext> {
  const bot = new Bot<BotContext>(token, config);

  // Remember every chat (spec 8.1); a message from a user un-blocks them.
  bot.use(async (ctx, next) => {
    let locale: Locale = "uz";
    if (ctx.from && !ctx.from.is_bot) {
      const chat = await db.telegramChat.upsert({
        where: { telegramId: BigInt(ctx.from.id) },
        update: {
          firstName: ctx.from.first_name,
          username: ctx.from.username ?? null,
          isBlocked: false,
        },
        create: {
          telegramId: BigInt(ctx.from.id),
          firstName: ctx.from.first_name,
          username: ctx.from.username ?? null,
          locale: localeFromTelegram(ctx.from.language_code),
        },
      });
      locale = chat.locale;
    }
    ctx.locale = locale;
    ctx.t = botTexts(locale);
    await next();
  });

  // Only private chats are supported.
  bot.chatType(["group", "supergroup", "channel"]).use(() => undefined);

  registerStart(bot);
  registerCommands(bot);
  registerCallbacks(bot);

  bot.on("message", async (ctx) => {
    await ctx.reply(ctx.t.unknown);
    await sendWelcome(ctx);
  });

  bot.catch((error) => {
    console.error("[bot] update failed", error.error);
  });
  return bot;
}

const globalForBot = globalThis as unknown as { navbatBot?: Bot<BotContext> };

export function getBot(): Bot<BotContext> {
  if (!globalForBot.navbatBot) globalForBot.navbatBot = createBot(requireEnv("TELEGRAM_BOT_TOKEN"));
  return globalForBot.navbatBot;
}
