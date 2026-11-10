-- Database-level guarantee that one staff member never gets two overlapping active bookings
-- (spec 5.2). Violations raise SQLSTATE 23P01, which the app maps to SLOT_TAKEN.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_time_check"
  CHECK ("endsAt" > "startsAt" AND "blockedUntil" >= "endsAt");

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startsAt", "blockedUntil", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));
