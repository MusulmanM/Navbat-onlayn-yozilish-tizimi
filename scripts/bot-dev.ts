// Local Telegram bot runner: removes the webhook and starts long polling with the same
// handlers as production. Use a separate TEST bot for this (spec 3).
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("❌ TELEGRAM_BOT_TOKEN topilmadi — .env.local faylini tekshiring.");
    process.exit(1);
  }
  // Imported after the env is loaded: some modules read settings at import time.
  const { createBot } = await import("@/bot/bot");
  const { configureBotProfile } = await import("@/bot/setup");
  const bot = createBot(token);

  await bot.api.deleteWebhook();
  await configureBotProfile(bot.api);
  const stop = () => {
    console.log("\nBot toʻxtatildi.");
    void bot.stop();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  await bot.start({
    onStart: (info) =>
      console.log(`✅ @${info.username} ishlayapti (long polling). Toʻxtatish: Ctrl + C`),
  });
}

main().catch((error: unknown) => {
  console.error("❌ Botni ishga tushirib boʻlmadi:", error instanceof Error ? error.message : error);
  process.exit(1);
});
