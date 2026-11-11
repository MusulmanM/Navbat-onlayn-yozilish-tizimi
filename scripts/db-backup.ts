// Saves a copy of the production database (public schema) into backups/ with pg_dump.
// Run: npm run db:backup:prod  (needs the PostgreSQL client tools, see docs/SETUP_UZ.md).
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";

const url = process.env.DIRECT_URL ?? "";
if (process.env.NAVBAT_ENV !== "production" || !url) {
  console.error(
    "❌ Buni `npm run db:backup:prod` orqali ishga tushiring (.env.production.local da DIRECT_URL kerak).",
  );
  process.exit(1);
}

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
mkdirSync("backups", { recursive: true });
const file = path.join("backups", `navbat-${stamp}.dump`);

const result = spawnSync(
  "pg_dump",
  [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--schema=public",
    `--file=${file}`,
    `--dbname=${url}`,
  ],
  { stdio: "inherit" },
);
if (result.error) {
  console.error(
    "❌ pg_dump topilmadi. docs/SETUP_UZ.md → «Zaxira nusxa» boʻlimidagi dasturni oʻrnating.",
  );
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);

const sizeKb = Math.max(1, Math.round(statSync(file).size / 1024));
console.log(
  `✅ Zaxira nusxa saqlandi: ${file} (${sizeKb} KB). Uni xavfsiz joyga (masalan, Google Drive) koʻchiring.`,
);
