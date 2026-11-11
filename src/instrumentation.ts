// Runs once when the server starts: checks the environment (spec 4, src/lib/env.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkProductionEnv, getEnv, EnvError } = await import("@/lib/env");

  if (process.env.NODE_ENV === "production") {
    const problems = checkProductionEnv();
    if (problems.length > 0) {
      // Stop with a readable message instead of failing later in random places.
      throw new EnvError(problems);
    }
    return;
  }

  // Development: warn, but keep running (the landing page works without a database).
  try {
    getEnv();
  } catch (error) {
    console.warn(`\n⚠️  ${error instanceof Error ? error.message : String(error)}\n`);
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn(
      "⚠️  TELEGRAM_BOT_TOKEN yoʻq — Telegram orqali kirish va eslatmalar ishlamaydi (docs/SETUP_UZ.md).",
    );
  }
}
