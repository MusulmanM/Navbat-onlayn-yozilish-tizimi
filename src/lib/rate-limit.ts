// Simple fixed-window rate limiting stored in Postgres (spec 6.10).
import { RATE_LIMITS } from "@/config/site";
import { db } from "@/lib/db";

export type RateLimitKind = keyof typeof RATE_LIMITS;

/**
 * Atomically counts a hit for `key`. One SQL statement, so concurrent requests cannot
 * both read a stale counter: an expired window restarts at 1, otherwise count + 1.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; count: number }> {
  const rows = await db.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" <= now() - make_interval(secs => ${windowSeconds}::int)
        THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" <= now() - make_interval(secs => ${windowSeconds}::int)
        THEN now() ELSE "RateLimit"."windowStart" END
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 0);
  return { ok: count <= limit, count };
}

/** Rate limit by client IP for one of the configured actions. */
export async function rateLimitIp(kind: RateLimitKind, ip: string) {
  const { limit, windowSeconds } = RATE_LIMITS[kind];
  return rateLimit(`${kind}:ip:${ip}`, limit, windowSeconds);
}

/** First value of x-forwarded-for (spec 6.10). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || "unknown";
}
