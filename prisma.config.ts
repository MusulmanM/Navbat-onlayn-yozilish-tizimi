// Prisma CLI configuration (Prisma 7 moved connection settings here from schema.prisma).
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Local commands load .env.local etc. the same way `next dev` does (never .env.production.local).
// Production commands (`npm run db:deploy:prod`) go through scripts/with-prod-env.ts, which has
// already loaded only .env.production.local and set NAVBAT_ENV=production.
if (process.env.NAVBAT_ENV !== "production") loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection; the app itself uses DATABASE_URL.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
