// Runs a command with PRODUCTION settings taken ONLY from .env.production.local (cross-platform).
// Used by `npm run db:deploy:prod`, `npm run db:seed:prod` and `npm run bot:set-webhook`.
// .env.local is ignored on purpose: a value missing in the production file must be an error,
// not a silent fallback to the local database or the test bot.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { checkProductionEnv } from "../src/lib/env";

const FILE = ".env.production.local";
const command = process.argv.slice(2);
if (command.length === 0) {
  console.error("Foydalanish: tsx scripts/with-prod-env.ts <buyruq>");
  process.exit(1);
}
if (!existsSync(FILE)) {
  console.error(
    `❌ ${FILE} topilmadi. docs/SETUP_UZ.md dagi yoʻriqnoma boʻyicha production sozlamalarini shu faylga yozing.`,
  );
  process.exit(1);
}

for (const [key, value] of Object.entries(parseEnv(readFileSync(FILE, "utf8")))) {
  if (value !== undefined) process.env[key] = value;
}
process.env.NAVBAT_ENV = "production"; // child scripts skip their own .env loading

const problems = checkProductionEnv();
if (problems.length > 0) {
  console.error(`❌ ${FILE} da xato:\n${problems.map((p) => `  • ${p}`).join("\n")}`);
  process.exit(1);
}

const host = (() => {
  try {
    return new URL(process.env.DIRECT_URL || process.env.DATABASE_URL || "").host;
  } catch {
    return "?";
  }
})();
console.log(`▶ Production sozlamalari (${FILE}), baza: ${host}`);

const result = spawnSync(command[0], command.slice(1), {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});
process.exit(result.status ?? 1);
