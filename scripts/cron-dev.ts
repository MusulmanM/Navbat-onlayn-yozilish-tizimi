// Local cron: calls both cron endpoints every minute (instead of cron-job.org).
// Start `npm run dev` first, then `npm run cron:dev` in another terminal.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

const appUrl = (process.env.CRON_TARGET_URL || "http://localhost:3000").replace(/\/+$/, "");
const secret = process.env.CRON_SECRET ?? "";
const INTERVAL_MS = 60_000;

if (secret.length < 32) {
  console.error("❌ CRON_SECRET topilmadi yoki 32 belgidan qisqa — .env.local faylini tekshiring (npm run secret).");
  process.exit(1);
}

async function call(path: string) {
  const started = Date.now();
  try {
    const response = await fetch(`${appUrl}${path}`, { headers: { Authorization: `Bearer ${secret}` } });
    const body = await response.text();
    const time = new Date().toLocaleTimeString("uz-UZ", { hour12: false });
    console.log(`[${time}] ${path} → ${response.status} (${Date.now() - started} ms) ${body.slice(0, 300)}`);
  } catch (error) {
    console.error(`❌ ${path}: sayt ishlamayapti? (${error instanceof Error ? error.message : error})`);
  }
}

async function tick() {
  await call("/api/cron/reminders");
  await call("/api/cron/daily");
}

console.log(`⏱  Har daqiqada ${appUrl}/api/cron/* chaqiriladi. To'xtatish: Ctrl + C`);
void tick();
setInterval(() => void tick(), INTERVAL_MS);
