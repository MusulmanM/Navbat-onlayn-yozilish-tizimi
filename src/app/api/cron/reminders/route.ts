// GET /api/cron/reminders — every 5 minutes (cron-job.org / npm run cron:dev).
import { errorResponse, json } from "@/server/api";
import { isCronAuthorized } from "@/server/cron-auth";
import { processReminders } from "@/server/cron";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  try {
    return json({ ok: true, ...(await processReminders()) });
  } catch (error) {
    return errorResponse(error);
  }
}
