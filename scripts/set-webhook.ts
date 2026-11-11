// Production setup for the MAIN bot: webhook, commands and descriptions (spec 8.1, 8.3).
// `npm run bot:set-webhook` runs this through scripts/with-prod-env.ts (.env.production.local).
// Running it directly (tsx scripts/set-webhook.ts) uses .env.local, e.g. a test bot + https tunnel.
import { loadEnvConfig } from "@next/env";

if (process.env.NAVBAT_ENV !== "production") loadEnvConfig(process.cwd());

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  const problems: string[] = [];
  if (!token) problems.push("TELEGRAM_BOT_TOKEN topilmadi");
  if (secret.length < 32)
    problems.push("TELEGRAM_WEBHOOK_SECRET kamida 32 belgi boʻlishi kerak (npm run secret)");
  if (!appUrl.startsWith("https://"))
    problems.push(
      "NEXT_PUBLIC_APP_URL https:// bilan boshlanishi kerak (masalan https://navbat.vercel.app)",
    );
  if (problems.length) {
    console.error(`❌ Sozlamalarda xato:\n  • ${problems.join("\n  • ")}`);
    process.exit(1);
  }

  const { Api } = await import("grammy");
  const { configureBotProfile } = await import("@/bot/setup");
  const api = new Api(token!);
  const url = `${appUrl}/api/telegram/webhook`;

  await api.setWebhook(url, {
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
  });
  await configureBotProfile(api);
  const me = await api.getMe();
  const info = await api.getWebhookInfo();
  console.log(`✅ @${me.username}: webhook ulandi → ${info.url}`);
  console.log(`   Kutilayotgan yangilanishlar: ${info.pending_update_count}`);
  if (info.last_error_message) console.log(`   Oxirgi xato: ${info.last_error_message}`);
}

main().catch((error: unknown) => {
  console.error("❌ Webhook oʻrnatilmadi:", error instanceof Error ? error.message : error);
  process.exit(1);
});
