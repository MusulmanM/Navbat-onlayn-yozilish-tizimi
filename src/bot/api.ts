// Shared Telegram Bot API client for sending messages outside of update handlers.
import { Api } from "grammy";
import { requireEnv } from "@/lib/env";

const globalForApi = globalThis as unknown as { telegramApi?: Api };

export function telegramApi(): Api {
  if (!globalForApi.telegramApi)
    globalForApi.telegramApi = new Api(requireEnv("TELEGRAM_BOT_TOKEN"));
  return globalForApi.telegramApi;
}

export function botConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}
