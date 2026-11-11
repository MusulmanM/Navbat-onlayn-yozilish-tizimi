// GET /api/cron/daily — every day at 03:00 UTC (08:00 Tashkent).
import { errorResponse, json } from "@/server/api";
import { isCronAuthorized } from "@/server/cron-auth";
import { processDaily } from "@/server/cron";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  try {
    return json({ ok: true, ...(await processDaily()) });
  } catch (error) {
    return errorResponse(error);
  }
}
