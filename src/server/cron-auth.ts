// Cron endpoints require "Authorization: Bearer <CRON_SECRET>" (spec 9).
import { safeEqual } from "@/lib/tokens";

export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  const header = request.headers.get("authorization") ?? "";
  return secret.length >= 32 && safeEqual(header, `Bearer ${secret}`);
}
