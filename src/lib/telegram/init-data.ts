// Telegram Mini App initData verification (spec 8.5).
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
import { createHmac, timingSafeEqual } from "node:crypto";

export const INIT_DATA_MAX_AGE_SEC = 24 * 60 * 60;

export type TelegramInitUser = {
  id: bigint;
  firstName: string;
  username: string | null;
  languageCode: string | null;
};

export type InitDataResult =
  | { ok: true; user: TelegramInitUser; authDate: Date }
  | { ok: false; error: "MALFORMED" | "BAD_SIGNATURE" | "EXPIRED" | "NO_USER" };

/** Builds the sorted "key=value\n…" string without the hash field. */
export function dataCheckString(params: URLSearchParams): string {
  return [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function signInitData(params: URLSearchParams, botToken: string): string {
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  return createHmac("sha256", secretKey).update(dataCheckString(params)).digest("hex");
}

export function verifyInitData(
  initData: string,
  botToken: string,
  now: Date = new Date(),
  maxAgeSec = INIT_DATA_MAX_AGE_SEC,
): InitDataResult {
  if (!initData || !botToken) return { ok: false, error: "MALFORMED" };
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return { ok: false, error: "MALFORMED" };

  const expected = Buffer.from(signInitData(params, botToken), "hex");
  const actual = Buffer.from(hash, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, error: "BAD_SIGNATURE" };
  }

  const authDateSec = Number(params.get("auth_date"));
  if (!Number.isFinite(authDateSec) || authDateSec <= 0) return { ok: false, error: "MALFORMED" };
  if (now.getTime() / 1000 - authDateSec > maxAgeSec) return { ok: false, error: "EXPIRED" };

  const rawUser = params.get("user");
  if (!rawUser) return { ok: false, error: "NO_USER" };
  try {
    const parsed = JSON.parse(rawUser) as {
      id?: unknown;
      first_name?: unknown;
      username?: unknown;
      language_code?: unknown;
    };
    if (typeof parsed.id !== "number" && typeof parsed.id !== "string") {
      return { ok: false, error: "NO_USER" };
    }
    return {
      ok: true,
      authDate: new Date(authDateSec * 1000),
      user: {
        id: BigInt(parsed.id),
        firstName: typeof parsed.first_name === "string" ? parsed.first_name : "",
        username: typeof parsed.username === "string" ? parsed.username : null,
        languageCode: typeof parsed.language_code === "string" ? parsed.language_code : null,
      },
    };
  } catch {
    return { ok: false, error: "MALFORMED" };
  }
}
