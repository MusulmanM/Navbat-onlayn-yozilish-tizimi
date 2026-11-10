// Subscription plans (spec 1.4, 6.9). Prices in so'm per month.
export const PLAN_CODES = ["TRIAL", "START", "PRO"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const PLANS = {
  TRIAL: { priceSom: 0, maxStaff: 5 },
  START: { priceSom: 99_000, maxStaff: 1 },
  PRO: { priceSom: 199_000, maxStaff: 5 },
} as const satisfies Record<PlanCode, { priceSom: number; maxStaff: number }>;

/** Plans a business can pay for. */
export const PAID_PLANS = ["START", "PRO"] as const satisfies readonly PlanCode[];
export type PaidPlanCode = (typeof PAID_PLANS)[number];

export const PAYMENT_METHODS = ["click", "payme", "card", "cash", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
