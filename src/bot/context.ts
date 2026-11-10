import type { Context } from "grammy";
import type { Locale } from "@/config/locales";
import type { BotTexts } from "@/bot/texts";

/** grammY context with the chat language and texts resolved by the middleware. */
export type BotContext = Context & { locale: Locale; t: BotTexts };
