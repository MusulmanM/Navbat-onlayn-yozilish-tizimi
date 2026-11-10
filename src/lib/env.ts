// Server environment variables, validated with zod (spec 4).
import { z } from "zod";

const optional = z.string().trim().optional().default("");
const secret = z.string().trim().min(32, "kamida 32 belgi boʻlishi kerak");

const schema = z.object({
  DATABASE_URL: z.string().trim().min(1, "topilmadi"),
  DIRECT_URL: optional,
  NEXT_PUBLIC_APP_URL: z.url("toʻliq manzil boʻlishi kerak, masalan https://navbat.uz"),
  NEXT_PUBLIC_BRAND_NAME: z.string().trim().min(1, "topilmadi"),
  NEXT_PUBLIC_SUPPORT_TELEGRAM: optional,
  TELEGRAM_BOT_TOKEN: optional,
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: optional,
  TELEGRAM_WEBHOOK_SECRET: optional,
  SESSION_SECRET: secret,
  CRON_SECRET: optional,
  ADMIN_TELEGRAM_IDS: optional,
  PAYMENT_INSTRUCTIONS_UZ: optional,
  PAYMENT_INSTRUCTIONS_RU: optional,
  REMINDER_TEST_MODE: optional,
});

/** In production everything the bot and cron need must be present as well. */
const productionSchema = schema.extend({
  TELEGRAM_BOT_TOKEN: z.string().trim().min(1, "topilmadi"),
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().trim().min(1, "topilmadi"),
  TELEGRAM_WEBHOOK_SECRET: secret,
  CRON_SECRET: secret,
});

export type Env = z.infer<typeof schema>;

export class EnvError extends Error {
  constructor(issues: string[]) {
    super(
      `Sozlamalarda xato (.env.local faylini yoki hosting sozlamalarini tekshiring):\n${issues
        .map((line) => `  • ${line}`)
        .join("\n")}`,
    );
    this.name = "EnvError";
  }
}

function describe(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".")} — ${issue.message}`);
}

let cached: Env | null = null;

/** Validated env. Throws EnvError with a readable Uzbek message when something is wrong. */
export function getEnv(): Env {
  if (cached) return cached;
  const result = schema.safeParse(process.env);
  if (!result.success) throw new EnvError(describe(result.error));
  cached = result.data;
  return cached;
}

/** Strict check used at server start in production. Returns problems instead of throwing. */
export function checkProductionEnv(): string[] {
  const result = productionSchema.safeParse(process.env);
  return result.success ? [] : describe(result.error);
}

/** A single variable that a feature cannot work without. */
export function requireEnv(name: keyof Env): string {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new EnvError([`${name} — topilmadi`]);
  return value;
}

/** Telegram IDs of platform admins (spec 7.7). */
export function adminTelegramIds(): bigint[] {
  return (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map((s) => BigInt(s));
}

export function isAdminTelegramId(id: bigint | null | undefined): boolean {
  return id != null && adminTelegramIds().some((adminId) => adminId === id);
}

export function reminderTestMode(): boolean {
  return process.env.REMINDER_TEST_MODE === "true" && process.env.NODE_ENV !== "production";
}
