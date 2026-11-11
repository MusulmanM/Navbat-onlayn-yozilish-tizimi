import { afterEach, describe, expect, it, vi } from "vitest";
import { checkProductionEnv } from "./env";

const FULL = {
  DATABASE_URL: "postgresql://u:p@db.example:6543/postgres",
  NEXT_PUBLIC_APP_URL: "https://navbat.example",
  NEXT_PUBLIC_BRAND_NAME: "Navbat",
  TELEGRAM_BOT_TOKEN: "123:abc",
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: "navbat_bot",
  TELEGRAM_WEBHOOK_SECRET: "w".repeat(32),
  SESSION_SECRET: "s".repeat(32),
  CRON_SECRET: "c".repeat(32),
};

function stubEnv(values: Record<string, string>) {
  for (const key of Object.keys(FULL)) vi.stubEnv(key, values[key]);
}

afterEach(() => vi.unstubAllEnvs());

describe("checkProductionEnv", () => {
  it("accepts a complete production env", () => {
    stubEnv(FULL);
    expect(checkProductionEnv()).toEqual([]);
  });

  it("lists every missing or weak value in Uzbek", () => {
    stubEnv({ ...FULL, TELEGRAM_BOT_TOKEN: "", CRON_SECRET: "short" });
    vi.stubEnv("DATABASE_URL", undefined);
    expect(checkProductionEnv()).toEqual([
      "DATABASE_URL — topilmadi",
      "TELEGRAM_BOT_TOKEN — topilmadi",
      "CRON_SECRET — kamida 32 belgi boʻlishi kerak",
    ]);
  });
});
