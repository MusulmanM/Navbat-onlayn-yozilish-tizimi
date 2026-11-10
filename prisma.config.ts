// Prisma CLI configuration (Prisma 7 moved connection settings here from schema.prisma).
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env, .env.local etc. the same way Next.js does.
loadEnvConfig(process.cwd());

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
