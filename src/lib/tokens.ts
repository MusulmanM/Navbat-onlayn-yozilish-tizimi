// Secret tokens for manage links and login (spec 6.11).
import { randomBytes, timingSafeEqual } from "node:crypto";

/** 24 random bytes as base64url: 32 chars of [A-Za-z0-9_-]. Fits Telegram deep links. */
export function randomToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Shape check before hitting the database. */
export function isTokenShape(value: string): boolean {
  return /^[A-Za-z0-9_-]{32}$/.test(value);
}

/** Short unique code for referrals, e.g. "K7Q2MX9A". */
export function referralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

/** Constant-time string comparison (for secrets from headers). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
