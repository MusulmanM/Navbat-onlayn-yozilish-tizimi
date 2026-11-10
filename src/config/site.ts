// Core business constants (spec 1.6). Change values here only.

/** Free trial length for every new business. */
export const TRIAL_DAYS = 14;
/** Days the business keeps working after the subscription ends. */
export const GRACE_DAYS = 3;
/** No client reminders in this half-open local interval: [22:00, 07:00). */
export const QUIET_HOURS = { start: "22:00", end: "07:00" } as const;
/** Future active bookings allowed from one phone number at one business. */
export const MAX_ACTIVE_BOOKINGS_PER_PHONE = 3;
/** Login link lifetime. */
export const LOGIN_TOKEN_TTL_MIN = 10;
/** Website session lifetime. */
export const SESSION_TTL_DAYS = 30;
/** CONFIRMED bookings become COMPLETED this long after they end. */
export const AUTO_COMPLETE_AFTER_HOURS = 6;
/** COMPLETED ↔ NO_SHOW can be corrected within this window. */
export const STATUS_EDIT_WINDOW_DAYS = 7;
/** Attempts to deliver one reminder. */
export const REMINDER_MAX_ATTEMPTS = 3;
/** Days shown in the booking date strip. */
export const DAYS_API_RANGE = 14;

export const DEFAULT_TIMEZONE = "Asia/Tashkent";
export const SLOT_STEP_OPTIONS = [15, 30, 60] as const;
/** Reminder lead: a reminder must be at least this far in the future to be scheduled. */
export const REMINDER_MIN_LEAD_MIN = 10;
/** Evening reminder time used when the 24h reminder falls into quiet hours. */
export const EVENING_REMINDER_TIME = "20:00";
/** Panel list page size. */
export const PAGE_SIZE = 30;
/** Max staff for any plan; beyond this the business should contact us. */
export const MAX_STAFF_LIMIT = 5;

export const SESSION_COOKIE = "nv_session";
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Rate limits (spec 6.10). */
export const RATE_LIMITS = {
  book: { limit: 10, windowSeconds: 3600 },
  login: { limit: 10, windowSeconds: 3600 },
  cancel: { limit: 20, windowSeconds: 3600 },
} as const;

/** Slug words that collide with app routes (spec 6.8). */
export const RESERVED_SLUGS = [
  "admin",
  "api",
  "panel",
  "login",
  "onboarding",
  "katalog",
  "uz",
  "ru",
  "b",
  "y",
] as const;
