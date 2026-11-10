// Prisma client singleton (Prisma 7 + node-postgres driver adapter).
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { requireEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: requireEnv("DATABASE_URL"),
    // Small pool: serverless functions run many instances; Supabase's pooler multiplexes.
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    // The adapter sends timestamps without an offset; Postgres reads them in the session
    // time zone. Forcing UTC keeps stored instants correct on any server (see DECISIONS.md).
    options: "-c TimeZone=UTC",
  });
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}

/**
 * Lazily created client: importing this module never touches the database or env,
 * so pages that do not need the database still build and render without it.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Postgres exclusion violation (Booking_no_overlap) → the slot was just taken. */
export function isOverlapError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const text = `${(error as { message?: unknown }).message ?? ""} ${JSON.stringify(
    (error as { meta?: unknown }).meta ?? {},
  )} ${(error as { code?: unknown }).code ?? ""}`;
  return text.includes("23P01") || text.includes("Booking_no_overlap");
}

/** Unique constraint violation (P2002). */
export function isUniqueError(error: unknown): boolean {
  return !!error && typeof error === "object" && (error as { code?: unknown }).code === "P2002";
}
