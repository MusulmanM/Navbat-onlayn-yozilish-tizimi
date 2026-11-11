// GET /api/health — for uptime monitors and the Docker HEALTHCHECK. No secrets in the answer.
// Also checks that database sessions run in UTC: stored times depend on it (see db.ts). Poolers
// such as Supabase's may ignore the connection `options`, so the database default must be UTC.
import { db } from "@/lib/db";
import { json } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = false;
  let utc = false;
  try {
    const rows = await db.$queryRaw<
      Array<{ tz: string }>
    >`SELECT current_setting('TimeZone') AS tz`;
    database = true;
    utc = ["UTC", "Etc/UTC", "GMT", "Etc/GMT"].includes(rows[0]?.tz ?? "");
  } catch {
    database = false;
  }
  const ok = database && utc;
  return json({ ok, database, utc, time: new Date().toISOString() }, ok ? 200 : 503);
}
