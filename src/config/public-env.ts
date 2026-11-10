// Public (browser-visible) settings. NEXT_PUBLIC_* values are inlined at build time,
// so they must be read with literal `process.env.NEXT_PUBLIC_X` expressions.
const trimSlash = (value: string) => value.replace(/\/+$/, "");
const stripAt = (value: string) => value.trim().replace(/^@/, "");

export const publicEnv = {
  appUrl: trimSlash(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME ?? "",
  supportTelegram: stripAt(process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM ?? ""),
  botUsername: stripAt(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? ""),
} as const;

/** Telegram refuses non-HTTPS URLs in buttons (spec 8.1). */
export const appUrlIsHttps = publicEnv.appUrl.startsWith("https://");

export function absoluteUrl(path: string): string {
  return `${publicEnv.appUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** https://t.me/<bot>?start=<payload>, or null when the bot username is not configured. */
export function botStartLink(payload: string): string | null {
  return publicEnv.botUsername ? `https://t.me/${publicEnv.botUsername}?start=${payload}` : null;
}

export function supportLink(): string | null {
  return publicEnv.supportTelegram ? `https://t.me/${publicEnv.supportTelegram}` : null;
}
