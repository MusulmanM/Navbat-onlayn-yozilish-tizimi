import type { Locale } from "@/config/locales";
import { ru } from "@/bot/texts/ru";
import type { BotTexts } from "@/bot/texts/types";
import { uz } from "@/bot/texts/uz";

export function botTexts(locale: Locale): BotTexts {
  return locale === "ru" ? ru : uz;
}

export type { BotTexts };
