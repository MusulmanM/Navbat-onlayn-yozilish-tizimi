// Platform admin read models (spec 7.7).
import { PAGE_SIZE } from "@/config/site";
import type { CategoryCode } from "@/config/categories";
import type { RegionCode } from "@/config/regions";
import type { Prisma } from "@/generated/prisma/client";
import { getAccess, type AccessState } from "@/lib/access";
import { db } from "@/lib/db";
import { DAY_MS, dateInZone, dayRangeUtc } from "@/lib/time";
import { monthlyRevenue } from "@/server/billing";
import { mondayOf } from "@/server/panel/queries";

const accessFields = {
  id: true,
  isBlocked: true,
  plan: true,
  trialEndsAt: true,
  paidUntil: true,
  isPublished: true,
} as const;

export async function getAdminStats(now: Date = new Date()) {
  const monday = mondayOf(dateInZone(now, "Asia/Tashkent"));
  const weekStart = dayRangeUtc(monday, "Asia/Tashkent").start;
  const [businesses, bookings30, newWeek, claims] = await Promise.all([
    db.business.findMany({ where: { isDemo: false }, select: accessFields }),
    db.booking.count({ where: { createdAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } } }),
    db.business.count({ where: { isDemo: false, createdAt: { gte: weekStart } } }),
    db.business.findMany({
      where: { paymentClaimedAt: { not: null } },
      orderBy: { paymentClaimedAt: "desc" },
      take: 20,
      select: { id: true, name: true, slug: true, paymentClaimedAt: true, plan: true },
    }),
  ]);
  const states = businesses.map((b) => getAccess(b, now).state);
  const count = (s: AccessState[]) => states.filter((x) => s.includes(x)).length;
  return {
    total: businesses.length,
    published: businesses.filter((b) => b.isPublished).length,
    trial: count(["TRIAL"]),
    paying: count(["ACTIVE"]),
    expired: count(["GRACE", "EXPIRED"]),
    mrr: monthlyRevenue(businesses, now),
    bookings30,
    newWeek,
    claims,
  };
}

export type AdminFilters = {
  q?: string;
  state?: AccessState;
  category?: CategoryCode;
  region?: RegionCode;
  page: number;
};

export async function listBusinessesAdmin(filters: AdminFilters, now: Date = new Date()) {
  const where: Prisma.BusinessWhereInput = {
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.region ? { region: filters.region } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { slug: { contains: filters.q.toLowerCase() } },
          ],
        }
      : {}),
  };
  const all = await db.business.findMany({ where, orderBy: { createdAt: "desc" } });
  const withState = all.map((b) => ({ ...b, access: getAccess(b, now) }));
  const filtered = filters.state
    ? withState.filter((b) => b.access.state === filters.state)
    : withState;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const items = filtered.slice((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE);
  const counts = await db.booking.groupBy({
    by: ["businessId"],
    where: {
      businessId: { in: items.map((b) => b.id) },
      createdAt: { gte: new Date(now.getTime() - 30 * DAY_MS) },
    },
    _count: { _all: true },
  });
  const bookings = new Map(counts.map((c) => [c.businessId, c._count._all]));
  return {
    items: items.map((b) => ({ ...b, bookings30: bookings.get(b.id) ?? 0 })),
    pages,
    total: filtered.length,
  };
}

export async function getBusinessAdmin(id: string) {
  return db.business.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          user: {
            select: { firstName: true, lastName: true, telegramUsername: true, telegramId: true },
          },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
      _count: { select: { bookings: true, clients: true, staff: true, services: true } },
    },
  });
}
