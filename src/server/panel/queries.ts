// Read models for panel pages. Every query is scoped by businessId from the session.
import { PAGE_SIZE } from "@/config/site";
import type { BookingSource, BookingStatus, Business, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseOptionalSchedule, parseWeeklySchedule } from "@/lib/schedule";
import {
  addDays,
  dateInZone,
  dayRangeUtc,
  isValidDateStr,
  weekdayOf,
  type DateStr,
} from "@/lib/time";
import { findClientIds } from "@/server/panel/bookings";

export function mondayOf(date: DateStr): DateStr {
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}

export async function pendingCount(businessId: string, now: Date = new Date()) {
  return db.booking.count({ where: { businessId, status: "PENDING", startsAt: { gt: now } } });
}

const listInclude = {
  client: { select: { id: true, name: true, phone: true, telegramId: true } },
  staff: { select: { id: true, name: true } },
  service: { select: { nameUz: true, nameRu: true } },
} satisfies Prisma.BookingInclude;

export type PanelBooking = Prisma.BookingGetPayload<{ include: typeof listInclude }>;

export async function getTodayData(business: Business, now: Date = new Date()) {
  const tz = business.timezone;
  const today = dateInZone(now, tz);
  const day = dayRangeUtc(today, tz);
  const monday = mondayOf(today);
  const weekStart = dayRangeUtc(monday, tz).start;
  const weekEnd = dayRangeUtc(addDays(monday, 6), tz).end;
  const monthStart = dayRangeUtc(`${today.slice(0, 8)}01`, tz).start;

  const [todayBookings, pending, weekCompleted, todayConfirmed, monthOnline] = await Promise.all([
    db.booking.findMany({
      where: {
        businessId: business.id,
        startsAt: { gte: day.start, lt: day.end },
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"] },
      },
      orderBy: { startsAt: "asc" },
      include: listInclude,
    }),
    db.booking.findMany({
      where: { businessId: business.id, status: "PENDING", startsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      take: 20,
      include: listInclude,
    }),
    db.booking.aggregate({
      where: {
        businessId: business.id,
        status: "COMPLETED",
        startsAt: { gte: weekStart, lt: weekEnd },
      },
      _sum: { priceSnapshot: true },
    }),
    db.booking.aggregate({
      where: {
        businessId: business.id,
        status: "CONFIRMED",
        startsAt: { gte: day.start, lt: day.end },
      },
      _sum: { priceSnapshot: true },
    }),
    db.booking.count({
      where: {
        businessId: business.id,
        source: { in: ["WEB", "TELEGRAM"] },
        createdAt: { gte: monthStart },
      },
    }),
  ]);

  return {
    today,
    todayBookings,
    pending,
    stats: {
      todayCount: todayBookings.filter((b) => b.status !== "NO_SHOW").length,
      pendingCount: pending.length,
      weekRevenue:
        (weekCompleted._sum.priceSnapshot ?? 0) + (todayConfirmed._sum.priceSnapshot ?? 0),
      monthOnline,
    },
  };
}

/** Calendar data for a range of days (day view: 1 day, week view: 7 days). */
export async function getCalendarData(business: Business, from: DateStr, days: number) {
  const tz = business.timezone;
  const start = dayRangeUtc(from, tz).start;
  const end = dayRangeUtc(addDays(from, days - 1), tz).end;
  const [staff, bookings, timeOffs] = await Promise.all([
    db.staff.findMany({
      where: {
        businessId: business.id,
        OR: [{ isActive: true }, { bookings: { some: { startsAt: { gte: start, lt: end } } } }],
      },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        position: true,
        weeklySchedule: true,
        isActive: true,
        services: { select: { serviceId: true } },
      },
    }),
    db.booking.findMany({
      where: { businessId: business.id, startsAt: { gte: start, lt: end } },
      orderBy: { startsAt: "asc" },
      include: listInclude,
    }),
    db.timeOff.findMany({
      where: { businessId: business.id, startsAt: { lt: end }, endsAt: { gt: start } },
      select: { id: true, staffId: true, startsAt: true, endsAt: true, reason: true },
    }),
  ]);
  return {
    schedule: parseWeeklySchedule(business.weeklySchedule),
    staff: staff.map((s) => ({ ...s, weeklySchedule: parseOptionalSchedule(s.weeklySchedule) })),
    bookings,
    timeOffs,
  };
}

export type BookingFilters = {
  from?: string;
  to?: string;
  staffId?: string;
  status?: BookingStatus;
  source?: BookingSource;
  q?: string;
  page: number;
};

export async function listBookings(business: Business, filters: BookingFilters) {
  const tz = business.timezone;
  const where: Prisma.BookingWhereInput = { businessId: business.id };
  const startsAt: Prisma.DateTimeFilter = {};
  if (filters.from && isValidDateStr(filters.from))
    startsAt.gte = dayRangeUtc(filters.from, tz).start;
  if (filters.to && isValidDateStr(filters.to)) startsAt.lt = dayRangeUtc(filters.to, tz).end;
  if (startsAt.gte || startsAt.lt) where.startsAt = startsAt;
  if (filters.staffId) where.staffId = filters.staffId;
  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.q && filters.q.trim().length >= 2) {
    const ids = await findClientIds(business.id, filters.q, 500, 0);
    where.clientId = { in: ids };
  }
  const [total, items] = await Promise.all([
    db.booking.count({ where }),
    db.booking.findMany({
      where,
      orderBy: { startsAt: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: listInclude,
    }),
  ]);
  return { total, items, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Visits, no-shows, total paid and last visit are computed, never stored (spec 5.4). */
async function clientStats(businessId: string, clientIds: string[]) {
  if (clientIds.length === 0) return new Map<string, ClientStats>();
  const rows = await db.booking.groupBy({
    by: ["clientId", "status"],
    where: { businessId, clientId: { in: clientIds }, status: { in: ["COMPLETED", "NO_SHOW"] } },
    _count: { _all: true },
    _sum: { priceSnapshot: true },
    _max: { startsAt: true },
  });
  const stats = new Map<string, ClientStats>();
  for (const id of clientIds)
    stats.set(id, { visits: 0, noShows: 0, totalPaid: 0, lastVisit: null });
  for (const row of rows) {
    const s = stats.get(row.clientId)!;
    if (row.status === "COMPLETED") {
      s.visits = row._count._all;
      s.totalPaid = row._sum.priceSnapshot ?? 0;
      s.lastVisit = row._max.startsAt;
    } else s.noShows = row._count._all;
  }
  return stats;
}

export type ClientStats = {
  visits: number;
  noShows: number;
  totalPaid: number;
  lastVisit: Date | null;
};

export async function listClients(businessId: string, q: string, page: number) {
  const searching = q.trim().length >= 2;
  const ids = searching
    ? await findClientIds(businessId, q, PAGE_SIZE, (page - 1) * PAGE_SIZE)
    : null;
  const where: Prisma.ClientWhereInput = { businessId, ...(ids ? { id: { in: ids } } : {}) };
  const [total, clients] = await Promise.all([
    searching ? Promise.resolve(null) : db.client.count({ where: { businessId } }),
    db.client.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      ...(searching ? {} : { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    }),
  ]);
  const stats = await clientStats(
    businessId,
    clients.map((c) => c.id),
  );
  return {
    clients: clients.map((c) => ({ ...c, stats: stats.get(c.id)! })),
    pages: total === null ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getClientDetails(businessId: string, clientId: string) {
  const client = await db.client.findFirst({ where: { id: clientId, businessId } });
  if (!client) return null;
  const [bookings, stats] = await Promise.all([
    db.booking.findMany({
      where: { businessId, clientId },
      orderBy: { startsAt: "desc" },
      take: 100,
      include: listInclude,
    }),
    clientStats(businessId, [clientId]),
  ]);
  return { client, bookings, stats: stats.get(clientId)! };
}

/** Services, staff and settings needed by the "add booking" dialog and editors. */
export async function getBookingOptions(businessId: string) {
  const [services, staff] = await Promise.all([
    db.service.findMany({
      where: { businessId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        nameUz: true,
        nameRu: true,
        durationMinutes: true,
        price: true,
        priceIsFrom: true,
        staff: { select: { staffId: true } },
      },
    }),
    db.staff.findMany({
      where: { businessId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  return { services, staff };
}
