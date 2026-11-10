// POST /api/auth/logout — this device only. "All devices" is a panel action.
import { endSession } from "@/lib/auth/session";
import { json } from "@/server/api";

export async function POST() {
  await endSession();
  return json({ ok: true });
}
