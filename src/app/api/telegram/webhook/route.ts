// POST /api/telegram/webhook — Telegram updates in production (spec 8.1).
import { webhookCallback } from "grammy";
import { getBot } from "@/bot/bot";
import { safeEqual } from "@/lib/tokens";

let handler: ((request: Request) => Promise<Response>) | null = null;

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  const header = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!secret || !safeEqual(header, secret)) {
    return new Response("unauthorized", { status: 401 });
  }
  try {
    handler ??= webhookCallback(getBot(), "std/http", { secretToken: secret, onTimeout: "return" });
    await handler(request);
  } catch (error) {
    // Always 200: otherwise Telegram re-sends the same update again and again (spec 8.7).
    console.error("[webhook] update failed", error);
  }
  return new Response("ok", { status: 200 });
}
