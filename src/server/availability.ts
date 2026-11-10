// Loads bookings, time off and staff from the database and runs the pure slot calculation.
import { DAYS_API_RANGE } from "@/config/site";
import type { Business } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseOptionalSchedule, parseWeeklySchedule } from "@/lib/schedule";
import { computeSlots, rankStaff, toBusyIntervals, type Slot, type SlotQuery } from "@/lib/slots";
import { addDays, dateInZone, dayRangeUtc, type DateStr } from "@/lib/time";
import { ApiError } from "@/server/api";

export type AvailabilityBusiness = Pick<
  Business,
  "id" | "timezone" | "weeklySchedule" | "slotStepMinutes" | "minLeadMinutes" | "maxDaysAhead"
>;

export type AvailabilityArgs = {
  business: AvailabilityBusiness;
  serviceId: string;
  /** "any" or a staff id. */
  staffId: string;
  dates: DateStr[];
  now: Date;
  /** Reschedule: the booking being moved must not block itself. */
  excludeBookingId?: string;
  options?: SlotQuery["options"];
};

export async function loadAvailability(args: AvailabilityArgs) {
  const { business, serviceId, staffId, now } = args;

  const service = await db.service.findFirst({
    where: { id: serviceId, businessId: business.id, isActive: true },
    select: {
      id: true,
      nameUz: true,
      nameRu: true,
      durationMinutes: true,
      bufferMinutes: true,
      price: true,
      priceIsFrom: true,
    },
  });
  if (!service) throw new ApiError(404, "SERVICE_NOT_FOUND");

  const staff = await db.staff.findMany({
    where: {
      businessId: business.id,
      isActive: true,
      services: { some: { serviceId } },
      ...(staffId === "any" ? {} : { id: staffId }),
    },
    select: { id: true, name: true, weeklySchedule: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (staffId !== "any" && staff.length === 0) throw new ApiError(404, "STAFF_NOT_FOUND");

  const slotsByDate = new Map<DateStr, Slot[]>();
  const dates = [...new Set(args.dates)].sort();
  if (dates.length === 0 || staff.length === 0) return { service, staff, slotsByDate };

  const tz = business.timezone;
  const rangeStart = dayRangeUtc(dates[0], tz).start;
  const rangeEnd = dayRangeUtc(dates[dates.length - 1], tz).end;
  const staffIds = staff.map((s) => s.id);

  const [bookings, timeOffs] = await Promise.all([
    db.booking.findMany({
      where: {
        staffId: { in: staffIds },
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { lt: rangeEnd },
        blockedUntil: { gt: rangeStart },
        ...(args.excludeBookingId ? { id: { not: args.excludeBookingId } } : {}),
      },
      select: { staffId: true, startsAt: true, blockedUntil: true, status: true },
    }),
    db.timeOff.findMany({
      where: {
        businessId: business.id,
        OR: [{ staffId: null }, { staffId: { in: staffIds } }],
        startsAt: { lt: rangeEnd },
        endsAt: { gt: rangeStart },
      },
      select: { staffId: true, startsAt: true, endsAt: true },
    }),
  ]);

  const busy = toBusyIntervals(bookings, timeOffs);
  const weeklySchedule = parseWeeklySchedule(business.weeklySchedule);
  const slotStaff = staff.map((s) => ({
    id: s.id,
    sortOrder: s.sortOrder,
    weeklySchedule: parseOptionalSchedule(s.weeklySchedule),
  }));

  for (const date of dates) {
    slotsByDate.set(
      date,
      computeSlots({
        business: {
          timezone: tz,
          weeklySchedule,
          slotStepMinutes: business.slotStepMinutes,
          minLeadMinutes: business.minLeadMinutes,
          maxDaysAhead: business.maxDaysAhead,
        },
        service: { durationMinutes: service.durationMinutes, bufferMinutes: service.bufferMinutes },
        staff: slotStaff,
        date,
        busy,
        now,
        options: args.options,
      }),
    );
  }
  return { service, staff, slotsByDate };
}

/** Dates shown in the booking strip: today … today + min(DAYS_API_RANGE, maxDaysAhead + 1). */
export function stripDates(business: AvailabilityBusiness, now: Date): DateStr[] {
  const today = dateInZone(now, business.timezone);
  const count = Math.min(DAYS_API_RANGE, business.maxDaysAhead + 1);
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

/** Staff ids ordered for "any staff": fewest active bookings that day, then sortOrder. */
export async function orderStaffForDay(
  business: AvailabilityBusiness,
  candidates: Array<{ id: string; sortOrder: number }>,
  date: DateStr,
): Promise<string[]> {
  if (candidates.length <= 1) return candidates.map((c) => c.id);
  const { start, end } = dayRangeUtc(date, business.timezone);
  const counts = await db.booking.groupBy({
    by: ["staffId"],
    where: {
      staffId: { in: candidates.map((c) => c.id) },
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { gte: start, lt: end },
    },
    _count: { _all: true },
  });
  const load = Object.fromEntries(counts.map((c) => [c.staffId, c._count._all]));
  return rankStaff(candidates, load);
}
