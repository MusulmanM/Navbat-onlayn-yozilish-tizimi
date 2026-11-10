// Booking status rules (spec 6.4). Pure: all status changes go through checkTransition().
import { STATUS_EDIT_WINDOW_DAYS } from "@/config/site";
import { DAY_MS, HOUR_MS, MINUTE_MS } from "@/lib/time";

export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_BUSINESS",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type Actor = "client" | "business" | "system";

export const CANCELLED_STATUSES: readonly BookingStatus[] = [
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_BUSINESS",
];
export const ACTIVE_STATUSES: readonly BookingStatus[] = ["PENDING", "CONFIRMED"];

/** Owners may mark "came / did not come" from this long before the start. */
export const OUTCOME_EARLY_MS = 60 * MINUTE_MS;

export type TransitionError =
  "NOT_ALLOWED" | "TOO_LATE_TO_CANCEL" | "EDIT_WINDOW_CLOSED" | "TOO_EARLY";

export type TransitionContext = {
  startsAt: Date;
  now: Date;
  /** Business setting: client may cancel until this many hours before the visit. */
  cancelUntilHours: number;
};

const RULES: Record<BookingStatus, Partial<Record<BookingStatus, readonly Actor[]>>> = {
  PENDING: {
    CONFIRMED: ["business"],
    CANCELLED_BY_BUSINESS: ["business", "system"],
    CANCELLED_BY_CLIENT: ["client"],
  },
  CONFIRMED: {
    COMPLETED: ["business", "system"],
    NO_SHOW: ["business"],
    CANCELLED_BY_CLIENT: ["client"],
    CANCELLED_BY_BUSINESS: ["business"],
  },
  COMPLETED: { NO_SHOW: ["business"] },
  NO_SHOW: { COMPLETED: ["business"] },
  CANCELLED_BY_CLIENT: {},
  CANCELLED_BY_BUSINESS: {},
};

/** Returns null when the transition is allowed, otherwise an error code. */
export function checkTransition(
  from: BookingStatus,
  to: BookingStatus,
  actor: Actor,
  ctx: TransitionContext,
): TransitionError | null {
  const actors = RULES[from][to];
  if (!actors || !actors.includes(actor)) return "NOT_ALLOWED";

  if (
    to === "CANCELLED_BY_CLIENT" &&
    !canClientCancel(ctx.startsAt, ctx.now, ctx.cancelUntilHours)
  ) {
    return "TOO_LATE_TO_CANCEL";
  }
  if ((to === "COMPLETED" || to === "NO_SHOW") && actor === "business") {
    if (from === "CONFIRMED" && ctx.now.getTime() < ctx.startsAt.getTime() - OUTCOME_EARLY_MS) {
      return "TOO_EARLY";
    }
    if (from !== "CONFIRMED" && !canEditOutcome(ctx.startsAt, ctx.now)) return "EDIT_WINDOW_CLOSED";
  }
  return null;
}

export class BookingTransitionError extends Error {
  constructor(public readonly code: TransitionError) {
    super(code);
    this.name = "BookingTransitionError";
  }
}

export function assertTransition(
  from: BookingStatus,
  to: BookingStatus,
  actor: Actor,
  ctx: TransitionContext,
): void {
  const error = checkTransition(from, to, actor, ctx);
  if (error) throw new BookingTransitionError(error);
}

/** Client self-cancel is allowed until startsAt − cancelUntilHours. */
export function canClientCancel(startsAt: Date, now: Date, cancelUntilHours: number): boolean {
  return now.getTime() <= startsAt.getTime() - cancelUntilHours * HOUR_MS;
}

/** COMPLETED ↔ NO_SHOW can be corrected within STATUS_EDIT_WINDOW_DAYS after the visit. */
export function canEditOutcome(startsAt: Date, now: Date): boolean {
  return now.getTime() <= startsAt.getTime() + STATUS_EDIT_WINDOW_DAYS * DAY_MS;
}

export function isCancelled(status: BookingStatus): boolean {
  return CANCELLED_STATUSES.includes(status);
}

export function isActive(status: BookingStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/** endsAt = start + duration; blockedUntil = endsAt + buffer. */
export function bookingTimes(startsAt: Date, durationMinutes: number, bufferMinutes: number) {
  const endsAt = new Date(startsAt.getTime() + durationMinutes * MINUTE_MS);
  const blockedUntil = new Date(endsAt.getTime() + bufferMinutes * MINUTE_MS);
  return { endsAt, blockedUntil };
}
