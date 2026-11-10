// Sending messages with error handling (spec 8.7): 403 → chat marked blocked, 429 → retry later.
import { GrammyError, HttpError } from "grammy";
import type { InlineKeyboardMarkup } from "grammy/types";
import { telegramApi } from "@/bot/api";
import { db } from "@/lib/db";

export type SendResult =
  | { ok: true; messageId: number }
  | {
      ok: false;
      reason: "BLOCKED" | "RATE_LIMITED" | "ERROR";
      retryAfter?: number;
      error?: string;
    };

export async function sendMessage(
  chatId: bigint,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<SendResult> {
  const chat = await db.telegramChat.findUnique({
    where: { telegramId: chatId },
    select: { isBlocked: true },
  });
  if (chat?.isBlocked) return { ok: false, reason: "BLOCKED" };
  try {
    const message = await telegramApi().sendMessage(chatId.toString(), text, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: replyMarkup && replyMarkup.inline_keyboard.length > 0 ? replyMarkup : undefined,
    });
    return { ok: true, messageId: message.message_id };
  } catch (error) {
    return handleSendError(chatId, error);
  }
}

export async function handleSendError(chatId: bigint, error: unknown): Promise<SendResult> {
  if (error instanceof GrammyError) {
    if (error.error_code === 403) {
      await db.telegramChat.upsert({
        where: { telegramId: chatId },
        update: { isBlocked: true },
        create: { telegramId: chatId, isBlocked: true },
      });
      return { ok: false, reason: "BLOCKED", error: error.description };
    }
    if (error.error_code === 429) {
      return {
        ok: false,
        reason: "RATE_LIMITED",
        retryAfter: error.parameters.retry_after,
        error: error.description,
      };
    }
    return { ok: false, reason: "ERROR", error: `${error.error_code} ${error.description}` };
  }
  if (error instanceof HttpError) return { ok: false, reason: "ERROR", error: "network" };
  return { ok: false, reason: "ERROR", error: error instanceof Error ? error.message : "unknown" };
}

/** Sends to many chats, never throws; used for owners and admins. */
export async function sendToMany(
  chatIds: bigint[],
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<void> {
  for (const chatId of chatIds) {
    const result = await sendMessage(chatId, text, replyMarkup);
    if (!result.ok && result.reason === "ERROR")
      console.warn(`[bot] send to ${chatId} failed: ${result.error}`);
  }
}
