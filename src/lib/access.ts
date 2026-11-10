// Subscription state and plan limits (spec 6.9). Pure.
import { PLANS, type PlanCode } from "@/config/plans";
import { GRACE_DAYS } from "@/config/site";
import { DAY_MS } from "@/lib/time";

export type AccessState = "TRIAL" | "ACTIVE" | "GRACE" | "EXPIRED" | "BLOCKED";

export type AccessInput = {
  isBlocked: boolean;
  plan: PlanCode;
  trialEndsAt: Date;
  paidUntil: Date | null;
};

export type Access = {
  state: AccessState;
  /** Whole days left in the current state (trial, paid period or grace); 0 otherwise. */
  daysLeft: number;
  maxStaff: number;
  /** End of the trial or paid period (whichever is later). */
  endsAt: Date;
};

const daysUntil = (from: Date, to: Date) =>
  Math.max(0, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));

export function getAccess(business: AccessInput, now: Date): Access {
  const { trialEndsAt, paidUntil } = business;
  const endsAt = paidUntil && paidUntil.getTime() > trialEndsAt.getTime() ? paidUntil : trialEndsAt;
  const paidPlan = business.plan === "TRIAL" ? "PRO" : business.plan;

  if (business.isBlocked) {
    return { state: "BLOCKED", daysLeft: 0, maxStaff: PLANS[business.plan].maxStaff, endsAt };
  }
  if (paidUntil && now < paidUntil) {
    return {
      state: "ACTIVE",
      daysLeft: daysUntil(now, paidUntil),
      maxStaff: PLANS[paidPlan].maxStaff,
      endsAt,
    };
  }
  if (now < trialEndsAt) {
    return {
      state: "TRIAL",
      daysLeft: daysUntil(now, trialEndsAt),
      maxStaff: PLANS.TRIAL.maxStaff,
      endsAt,
    };
  }
  const graceEnd = new Date(endsAt.getTime() + GRACE_DAYS * DAY_MS);
  const maxStaff = paidUntil ? PLANS[paidPlan].maxStaff : PLANS.TRIAL.maxStaff;
  if (now < graceEnd) {
    return { state: "GRACE", daysLeft: daysUntil(now, graceEnd), maxStaff, endsAt };
  }
  return { state: "EXPIRED", daysLeft: 0, maxStaff, endsAt };
}

/** New online bookings are disabled when the subscription is over or blocked. */
export function canAcceptOnlineBookings(state: AccessState): boolean {
  return state !== "EXPIRED" && state !== "BLOCKED";
}

/** New paid period: max(now, paidUntil) + days (spec 7.7). */
export function extendPaidUntil(paidUntil: Date | null, now: Date, days: number): Date {
  const base = paidUntil && paidUntil > now ? paidUntil : now;
  return new Date(base.getTime() + days * DAY_MS);
}
