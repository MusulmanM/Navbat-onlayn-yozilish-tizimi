// Panel booking operations. Every function is scoped by businessId taken from the session.
import { z } from "zod";
import { botStartLink } from "@/config/public-env";
import { bookingTimes } from "@/lib/bookings";
import { db, isOverlapError } from "@/lib/db";
import { notifyLater } from "@/lib/notify";
import { normalizePhone } from "@/lib/phone";
import { APOSTROPHE_CHARS, digitsOnly, likePattern, normalizeSearch } from "@/lib/search";
import { dateInZone } from "@/lib/time";
import { randomToken } from "@/lib/tokens";
import { ApiError, parseOrThrow } from "@/server/api";
import { loadAvailability, type AvailabilityBusiness } from "@/server/availability";
import { scheduleReminders } from "@/server/reminders";
import { PanelError } from "@/server/panel/result";

const id = z.string().trim().min(1).max(64);

export const panelBookingSchema = z
  .object({
    clientId: id.optional(),
    newClient: z
      .object({
        name: z
          .string()
          .transform((v) => v.replace(/\s+/g, " ").trim())
          .pipe(z.string().min(2, "name").max(60, "name")),
        phone: z
          .string()
          .transform((v) => normalizePhone(v) ?? "")
          .pipe(z.string().min(1, "phone")),
      })
      .optional(),
    serviceId: id,
    staffId: id,
    startsAt: z.iso.datetime({ offset: true }),
    outsideHours: z.boolean().default(false),
    internalNote: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.clientId || v.newClient, { message: "client", path: ["clientId"] });

/** Slots for the panel dialog: owner may ignore working hours and lead time. */
export async function panelSlots(
  business: AvailabilityBusiness,
  args: {
    serviceId: string;
    staffId: string;
    date: string;
    outsideHours: boolean;
    excludeBookingId?: string;
  },
  now: Date = new Date(),
) {
  const { slotsByDate } = await loadAvailability({
    business,
    serviceId: args.serviceId,
    staffId: args.staffId,
    dates: [args.date],
    now,
    excludeBookingId: args.excludeBookingId,
    options: { ignoreWorkingHours: args.outsideHours, ignoreLeadTime: true },
  });
  return (slotsByDate.get(args.date) ?? []).map((s) => ({
    time: s.time,
    startsAt: s.startsAt.toISOString(),
  }));
}

async function assertFreeSlot(
  business: AvailabilityBusiness,
  serviceId: string,
  staffId: string,
  startsAt: Date,
  outsideHours: boolean,
  now: Date,
  excludeBookingId?: string,
) {
  const date = dateInZone(startsAt, business.timezone);
  const slots = await panelSlots(
    business,
    { serviceId, staffId, date, outsideHours, excludeBookingId },
    now,
  );
  if (!slots.some((s) => s.startsAt === startsAt.toISOString()))
    throw new ApiError(409, "SLOT_TAKEN");
}

export async function createPanelBooking(
  business: AvailabilityBusiness & { slug: string },
  raw: unknown,
  now: Date = new Date(),
) {
  const input = parseOrThrow(panelBookingSchema, raw);
  const startsAt = new Date(input.startsAt);
  await assertFreeSlot(business, input.serviceId, input.staffId, startsAt, input.outsideHours, now);

  const service = await db.service.findFirstOrThrow({
    where: { id: input.serviceId, businessId: business.id },
  });
  const { endsAt, blockedUntil } = bookingTimes(
    startsAt,
    service.durationMinutes,
    service.bufferMinutes,
  );

  try {
    const booking = await db.$transaction(async (tx) => {
      let clientId: string;
      if (input.clientId) {
        const client = await tx.client.findFirst({
          where: { id: input.clientId, businessId: business.id },
        });
        if (!client) throw new PanelError("VALIDATION_ERROR", { clientId: "client" });
        clientId = client.id;
      } else {
        const created = await tx.client.upsert({
          where: { businessId_phone: { businessId: business.id, phone: input.newClient!.phone } },
          update: {},
          create: {
            businessId: business.id,
            name: input.newClient!.name,
            phone: input.newClient!.phone,
          },
        });
        clientId = created.id;
      }
      return tx.booking.create({
        data: {
          businessId: business.id,
          staffId: input.staffId,
          serviceId: service.id,
          clientId,
          startsAt,
          endsAt,
          blockedUntil,
          status: "CONFIRMED",
          source: "PANEL",
          serviceNameSnapshot: service.nameUz,
          priceSnapshot: service.price,
          durationSnapshot: service.durationMinutes,
          internalNote: input.internalNote || null,
          manageToken: randomToken(),
        },
        include: { client: { select: { telegramId: true } } },
      });
    });
    if (booking.client.telegramId !== null) await scheduleReminders(booking.id, now);
    const bookingId = booking.id;
    notifyLater((n) => n.bookingCreated(bookingId));
    return {
      id: booking.id,
      manageToken: booking.manageToken,
      startsAt: booking.startsAt.toISOString(),
      telegramLink: botStartLink(`bk_${booking.manageToken}`),
      telegramLinked: booking.client.telegramId !== null,
    };
  } catch (error) {
    if (isOverlapError(error)) throw new ApiError(409, "SLOT_TAKEN");
    throw error;
  }
}

export const rescheduleSchema = z.object({
  bookingId: id,
  staffId: id,
  startsAt: z.iso.datetime({ offset: true }),
  outsideHours: z.boolean().default(false),
});

export async function rescheduleBooking(
  business: AvailabilityBusiness,
  raw: unknown,
  now: Date = new Date(),
) {
  const input = parseOrThrow(rescheduleSchema, raw);
  const booking = await db.booking.findFirst({
    where: { id: input.bookingId, businessId: business.id },
    include: { service: { select: { bufferMinutes: true } } },
  });
  if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND");
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED")
    throw new PanelError("NOT_ALLOWED");

  const startsAt = new Date(input.startsAt);
  await assertFreeSlot(
    business,
    booking.serviceId,
    input.staffId,
    startsAt,
    input.outsideHours,
    now,
    booking.id,
  );
  const { endsAt, blockedUntil } = bookingTimes(
    startsAt,
    booking.durationSnapshot,
    booking.service.bufferMinutes,
  );

  try {
    await db.booking.update({
      where: { id: booking.id },
      data: { startsAt, endsAt, blockedUntil, staffId: input.staffId },
    });
  } catch (error) {
    if (isOverlapError(error)) throw new ApiError(409, "SLOT_TAKEN");
    throw error;
  }
  await scheduleReminders(booking.id, now);
  const bookingId = booking.id;
  notifyLater((n) => n.bookingRescheduled(bookingId));
  return { id: booking.id };
}

export async function updateInternalNote(businessId: string, bookingId: string, note: string) {
  const text = z.string().trim().max(500).parse(note);
  const updated = await db.booking.updateMany({
    where: { id: bookingId, businessId },
    data: { internalNote: text || null },
  });
  if (updated.count === 0) throw new ApiError(404, "BOOKING_NOT_FOUND");
}

/** Client search for the "add booking" dialog (name or phone, apostrophes normalized). */
export async function searchClients(businessId: string, query: string) {
  const ids = await findClientIds(businessId, query, 8, 0);
  if (ids.length === 0) return [];
  const clients = await db.client.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, phone: true, telegramId: true },
  });
  const order = new Map(ids.map((cid, i) => [cid, i]));
  return clients
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((c) => ({ id: c.id, name: c.name, phone: c.phone, telegram: c.telegramId !== null }));
}

/**
 * Ids of clients matching a name (apostrophe-insensitive, case-insensitive) or phone digits.
 * Raw SQL because both sides must be normalized with translate().
 */
export async function findClientIds(
  businessId: string,
  query: string,
  limit: number,
  offset: number,
): Promise<string[]> {
  const q = normalizeSearch(query);
  if (q.length < 2) return [];
  const digits = digitsOnly(query);
  const namePattern = likePattern(q);
  const phonePattern = digits.length >= 3 ? likePattern(digits) : null;
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Client"
    WHERE "businessId" = ${businessId}
      AND (
        translate(lower("name"), ${APOSTROPHE_CHARS}, '') LIKE ${namePattern}
        OR (${phonePattern}::text IS NOT NULL AND "phone" LIKE ${phonePattern})
      )
    ORDER BY "updatedAt" DESC
    LIMIT ${limit} OFFSET ${offset}`;
  return rows.map((r) => r.id);
}
