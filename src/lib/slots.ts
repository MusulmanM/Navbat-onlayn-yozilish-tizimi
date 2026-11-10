// Free slot calculation (spec 6.2). Pure: no database access.
import { dayKeyOf, workingIntervals, type WeeklySchedule } from "@/lib/schedule";
import {
  MINUTE_MS,
  addDays,
  dateInZone,
  formatMinutes,
  zonedToUtc,
  type DateStr,
} from "@/lib/time";

export type BusyInterval = {
  /** null → applies to every staff member (business-wide time off). */
  staffId: string | null;
  start: Date;
  end: Date;
};

export type SlotStaff = { id: string; weeklySchedule: WeeklySchedule | null; sortOrder: number };

export type SlotQuery = {
  business: {
    timezone: string;
    weeklySchedule: WeeklySchedule;
    slotStepMinutes: number;
    minLeadMinutes: number;
    maxDaysAhead: number;
  };
  service: { durationMinutes: number; bufferMinutes: number };
  /** Active staff who perform this service. */
  staff: SlotStaff[];
  date: DateStr;
  /** Bookings as [startsAt, blockedUntil) plus time off. */
  busy: BusyInterval[];
  now: Date;
  options?: {
    /** Owner in the panel may book outside working hours (still no overlaps). */
    ignoreWorkingHours?: boolean;
    /** Owner in the panel may book without lead time / date range limits. */
    ignoreLeadTime?: boolean;
  };
};

export type Slot = { time: string; startsAt: Date; staffIds: string[] };

const WHOLE_DAY: Array<[number, number]> = [[0, 24 * 60]];

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Is the date inside the bookable window [today, today + maxDaysAhead]? */
export function isDateBookable(
  date: DateStr,
  now: Date,
  timezone: string,
  maxDaysAhead: number,
): boolean {
  const today = dateInZone(now, timezone);
  return date >= today && date <= addDays(today, maxDaysAhead);
}

export function computeSlots(q: SlotQuery): Slot[] {
  const { business, service, date, now } = q;
  const options = q.options ?? {};
  const tz = business.timezone;

  if (!options.ignoreLeadTime && !isDateBookable(date, now, tz, business.maxDaysAhead)) {
    return [];
  }

  const step = business.slotStepMinutes;
  const duration = service.durationMinutes;
  const blockMs = (duration + service.bufferMinutes) * MINUTE_MS;
  const earliest = options.ignoreLeadTime
    ? Number.NEGATIVE_INFINITY
    : now.getTime() + business.minLeadMinutes * MINUTE_MS;
  const dayKey = dayKeyOf(date);
  const sharedBusy = q.busy.filter((b) => b.staffId === null);

  const byTime = new Map<number, Slot>();
  const sortOrder = new Map(q.staff.map((s) => [s.id, s.sortOrder]));

  for (const member of q.staff) {
    const schedule = member.weeklySchedule ?? business.weeklySchedule;
    const intervals = options.ignoreWorkingHours ? WHOLE_DAY : workingIntervals(schedule[dayKey]);
    if (intervals.length === 0) continue;

    const busy = [...sharedBusy, ...q.busy.filter((b) => b.staffId === member.id)].map(
      (b) => [b.start.getTime(), b.end.getTime()] as const,
    );

    for (const [intervalStart, intervalEnd] of intervals) {
      // Candidates are aligned to the step grid counted from local midnight.
      const first = Math.ceil(intervalStart / step) * step;
      for (let t = first; t + duration <= intervalEnd; t += step) {
        const startsAt = zonedToUtc(date, t, tz);
        const start = startsAt.getTime();
        if (start < earliest) continue;
        // The buffer may run past closing time but must not hit other bookings.
        if (busy.some(([bs, be]) => overlaps(start, start + blockMs, bs, be))) continue;

        const existing = byTime.get(start);
        if (existing) existing.staffIds.push(member.id);
        else byTime.set(start, { time: formatMinutes(t), startsAt, staffIds: [member.id] });
      }
    }
  }

  const slots = [...byTime.values()].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  for (const slot of slots) {
    slot.staffIds.sort((a, b) => (sortOrder.get(a) ?? 0) - (sortOrder.get(b) ?? 0));
  }
  return slots;
}

/** Only these statuses occupy time (same as the DB exclusion constraint). */
export const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const;

export function isActiveStatus(status: string): boolean {
  return (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(status);
}

/** Bookings + time off → busy intervals. Cancelled/finished bookings never block time. */
export function toBusyIntervals(
  bookings: Array<{ staffId: string; startsAt: Date; blockedUntil: Date; status: string }>,
  timeOffs: Array<{ staffId: string | null; startsAt: Date; endsAt: Date }>,
): BusyInterval[] {
  return [
    ...bookings
      .filter((b) => isActiveStatus(b.status))
      .map((b) => ({ staffId: b.staffId, start: b.startsAt, end: b.blockedUntil })),
    ...timeOffs.map((t) => ({ staffId: t.staffId, start: t.startsAt, end: t.endsAt })),
  ];
}

/**
 * "Any staff": pick the free staff member with the fewest active bookings that day;
 * ties go to the lowest sortOrder (spec 6.2, step 7).
 */
export function pickStaff(
  candidates: Array<{ id: string; sortOrder: number }>,
  bookingsPerStaff: Record<string, number>,
): string | null {
  return rankStaff(candidates, bookingsPerStaff)[0] ?? null;
}

/** All candidates in pickStaff order (used to retry with the next one on a conflict). */
export function rankStaff(
  candidates: Array<{ id: string; sortOrder: number }>,
  bookingsPerStaff: Record<string, number>,
): string[] {
  return [...candidates]
    .sort((a, b) => {
      const load = (bookingsPerStaff[a.id] ?? 0) - (bookingsPerStaff[b.id] ?? 0);
      if (load !== 0) return load;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.id.localeCompare(b.id);
    })
    .map((c) => c.id);
}
