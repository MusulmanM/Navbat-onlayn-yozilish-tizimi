// Telegram login tokens (spec 7.4). Shared by the website APIs and the bot.
import { LOGIN_TOKEN_TTL_MIN } from "@/config/site";
import { db } from "@/lib/db";
import { localeFromTelegram } from "@/config/locales";
import { MINUTE_MS } from "@/lib/time";
import { isTokenShape, randomToken } from "@/lib/tokens";

export type LoginTokenState = "PENDING" | "CONFIRMED" | "REJECTED" | "USED" | "EXPIRED";

export async function createLoginToken(now: Date = new Date()) {
  const token = randomToken();
  const expiresAt = new Date(now.getTime() + LOGIN_TOKEN_TTL_MIN * MINUTE_MS);
  await db.loginToken.create({ data: { token, expiresAt } });
  return { token, expiresAt };
}

export async function getLoginTokenState(token: string, now: Date = new Date()) {
  if (!isTokenShape(token)) return null;
  const row = await db.loginToken.findUnique({ where: { token } });
  if (!row) return null;
  const expired = row.expiresAt <= now && (row.status === "PENDING" || row.status === "CONFIRMED");
  const state: LoginTokenState = expired ? "EXPIRED" : row.status;
  return { state, expiresAt: row.expiresAt };
}

export type TelegramUserInfo = {
  id: bigint;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  languageCode?: string | null;
};

/**
 * Bot side: the Telegram user pressed "Confirm". Creates/updates the User and marks the token.
 * Returns false if the token is unknown, expired or already used.
 */
export async function confirmLoginToken(
  token: string,
  tgUser: TelegramUserInfo,
  now: Date = new Date(),
): Promise<boolean> {
  const updated = await db.loginToken.updateMany({
    where: { token, status: "PENDING", expiresAt: { gt: now } },
    data: { status: "CONFIRMED", telegramId: tgUser.id, confirmedAt: now },
  });
  if (updated.count === 0) return false;
  await db.user.upsert({
    where: { telegramId: tgUser.id },
    update: {
      firstName: tgUser.firstName || "—",
      lastName: tgUser.lastName ?? null,
      telegramUsername: tgUser.username ?? null,
    },
    create: {
      telegramId: tgUser.id,
      firstName: tgUser.firstName || "—",
      lastName: tgUser.lastName ?? null,
      telegramUsername: tgUser.username ?? null,
      locale: localeFromTelegram(tgUser.languageCode ?? undefined),
    },
  });
  return true;
}

export async function rejectLoginToken(token: string, now: Date = new Date()): Promise<boolean> {
  const updated = await db.loginToken.updateMany({
    where: { token, status: "PENDING", expiresAt: { gt: now } },
    data: { status: "REJECTED" },
  });
  return updated.count > 0;
}

/**
 * Website side: exchange a CONFIRMED token for a session exactly once (atomic USED).
 * Returns the user or null.
 */
export async function consumeLoginToken(token: string, now: Date = new Date()) {
  if (!isTokenShape(token)) return null;
  const row = await db.loginToken.findUnique({ where: { token } });
  if (!row || row.status !== "CONFIRMED" || !row.telegramId || row.expiresAt <= now) return null;
  const used = await db.loginToken.updateMany({
    where: { id: row.id, status: "CONFIRMED" },
    data: { status: "USED" },
  });
  if (used.count === 0) return null;
  return db.user.findUnique({
    where: { telegramId: row.telegramId },
    include: { memberships: { select: { businessId: true } } },
  });
}
