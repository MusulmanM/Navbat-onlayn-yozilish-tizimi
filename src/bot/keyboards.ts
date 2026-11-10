// Inline keyboards. Telegram rejects non-HTTPS URLs in buttons, so URL buttons are skipped
// when APP_URL is not https (spec 8.1). callback_data stays under 64 bytes.
import type { InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup } from "grammy/types";
import { absoluteUrl, appUrlIsHttps } from "@/config/public-env";
import type { BotTexts } from "@/bot/texts";

type Button = InlineKeyboardButton | null;

/** URL button, or null when the URL cannot be used in Telegram. */
export function urlButton(
  text: string,
  url: string | null | undefined,
): InlineKeyboardButton | null {
  if (!url) return null;
  if (url.startsWith(absoluteUrl("")) && !appUrlIsHttps) return null;
  if (!/^(https:\/\/|tg:\/\/)/.test(url)) return null;
  return { text, url };
}

export function webAppButton(text: string, url: string): InlineKeyboardButton | null {
  return appUrlIsHttps ? { text, web_app: { url } } : null;
}

export function callbackButton(text: string, data: string): InlineKeyboardButton {
  return { text, callback_data: data };
}

/** Builds a keyboard from rows, dropping null buttons and empty rows. */
export function keyboard(...rows: Button[][]): InlineKeyboardMarkup {
  return {
    inline_keyboard: rows
      .map((row) => row.filter((b): b is InlineKeyboardButton => b !== null))
      .filter((row) => row.length > 0),
  };
}

export const EMPTY_KEYBOARD: InlineKeyboardMarkup = { inline_keyboard: [] };

export function clientBookingKeyboard(t: BotTexts, bookingId: string, manageToken: string) {
  return keyboard(
    [callbackButton(t.buttons.cancel, `c:${bookingId}`)],
    [urlButton(t.buttons.details, absoluteUrl(`/y/${manageToken}`))],
  );
}

export function reminder24Keyboard(t: BotTexts, bookingId: string) {
  return keyboard([
    callbackButton(t.buttons.yesComing, `k:${bookingId}`),
    callbackButton(t.buttons.cancel, `c:${bookingId}`),
  ]);
}

export function cancelConfirmKeyboard(t: BotTexts, bookingId: string) {
  return keyboard([
    callbackButton(t.buttons.yesCancel, `cy:${bookingId}`),
    callbackButton(t.buttons.noKeep, `cn:${bookingId}`),
  ]);
}

export function rebookKeyboard(t: BotTexts, slug: string) {
  return keyboard([urlButton(t.buttons.rebook, absoluteUrl(`/b/${slug}`))]);
}

export function ownerBookingKeyboard(t: BotTexts, bookingId: string, pending: boolean) {
  return keyboard(
    pending
      ? [
          callbackButton(t.buttons.confirm, `oa:${bookingId}`),
          callbackButton(t.buttons.reject, `or:${bookingId}`),
        ]
      : [],
    [urlButton(t.buttons.openInPanel, absoluteUrl(`/panel/kalendar?booking=${bookingId}`))],
  );
}

export function languageKeyboard(t: BotTexts) {
  return keyboard([
    callbackButton(t.buttons.uz, "lang:uz"),
    callbackButton(t.buttons.ru, "lang:ru"),
  ]);
}

/** Persistent menu under the input field (spec 8.3). */
export function mainMenu(t: BotTexts, isOwner: boolean): ReplyKeyboardMarkup {
  return {
    keyboard: [
      [{ text: t.buttons.myBookings }, { text: t.buttons.language }],
      ...(isOwner ? [[{ text: t.buttons.today }]] : []),
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function panelKeyboard(t: BotTexts) {
  return keyboard([urlButton(t.buttons.openPanel, absoluteUrl("/panel"))]);
}
