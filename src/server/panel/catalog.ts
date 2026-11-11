// Services, staff, time off, clients and business settings. Always scoped by businessId.
import { z } from "zod";
import { CATEGORY_CODES } from "@/config/categories";
import { REGION_CODES } from "@/config/regions";
import { MAX_STAFF_LIMIT } from "@/config/site";
import { Prisma, type Business } from "@/generated/prisma/client";
import { getAccess } from "@/lib/access";
import { db, isUniqueError } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { weeklyScheduleSchema } from "@/lib/schedule";
import { validateSlug } from "@/lib/slug";
import { addDays, dayRangeUtc, isValidDateStr } from "@/lib/time";
import { parseOrThrow } from "@/server/api";
import { PanelError } from "@/server/panel/result";

const id = z.string().trim().min(1).max(64);
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null);

// ---------------------------------------------------------------------------
// Services

export const serviceSchema = z.object({
  id: id.optional(),
  nameUz: z.string().trim().min(2, "nameUz").max(80, "nameUz"),
  nameRu: optionalText(80),
  descriptionUz: optionalText(500),
  descriptionRu: optionalText(500),
  durationMinutes: z
    .number()
    .int()
    .min(5, "duration")
    .max(480, "duration")
    .refine((v) => v % 5 === 0, "duration"),
  bufferMinutes: z.number().int().min(0).max(120).default(0),
  price: z.number().int().min(0, "price").max(100_000_000, "price"),
  priceIsFrom: z.boolean().default(false),
  isActive: z.boolean().default(true),
  staffIds: z.array(id).max(50).default([]),
});

export async function saveService(businessId: string, raw: unknown) {
  const input = parseOrThrow(serviceSchema, raw);
  const staff = await db.staff.findMany({
    where: { businessId, id: { in: input.staffIds } },
    select: { id: true },
  });
  const staffIds = staff.map((s) => s.id);
  const data = {
    nameUz: input.nameUz,
    nameRu: input.nameRu,
    descriptionUz: input.descriptionUz,
    descriptionRu: input.descriptionRu,
    durationMinutes: input.durationMinutes,
    bufferMinutes: input.bufferMinutes,
    price: input.price,
    priceIsFrom: input.priceIsFrom,
    isActive: input.isActive,
  };
  return db.$transaction(async (tx) => {
    let serviceId: string;
    if (input.id) {
      const updated = await tx.service.updateMany({ where: { id: input.id, businessId }, data });
      if (updated.count === 0) throw new PanelError("SERVICE_NOT_FOUND");
      serviceId = input.id;
    } else {
      const last = await tx.service.aggregate({ where: { businessId }, _max: { sortOrder: true } });
      const created = await tx.service.create({
        data: { ...data, businessId, sortOrder: (last._max.sortOrder ?? -1) + 1 },
      });
      serviceId = created.id;
    }
    await tx.staffService.deleteMany({ where: { serviceId } });
    if (staffIds.length) {
      await tx.staffService.createMany({
        data: staffIds.map((staffId) => ({ staffId, serviceId })),
      });
    }
    return { id: serviceId };
  });
}

export async function setServiceActive(businessId: string, serviceId: string, isActive: boolean) {
  const updated = await db.service.updateMany({
    where: { id: serviceId, businessId },
    data: { isActive },
  });
  if (updated.count === 0) throw new PanelError("SERVICE_NOT_FOUND");
}

/** Spec 5.5: a service with bookings is archived, never deleted. */
export async function deleteService(businessId: string, serviceId: string) {
  const service = await db.service.findFirst({
    where: { id: serviceId, businessId },
    select: { _count: { select: { bookings: true } } },
  });
  if (!service) throw new PanelError("SERVICE_NOT_FOUND");
  if (service._count.bookings > 0) throw new PanelError("HAS_BOOKINGS");
  await db.service.delete({ where: { id: serviceId } });
}

/** Swaps sortOrder with the neighbour above or below. */
export async function moveItem(
  kind: "service" | "staff",
  businessId: string,
  itemId: string,
  direction: "up" | "down",
) {
  const items =
    kind === "service"
      ? await db.service.findMany({
          where: { businessId },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        })
      : await db.staff.findMany({
          where: { businessId },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        });
  const index = items.findIndex((i) => i.id === itemId);
  if (index < 0) throw new PanelError(kind === "service" ? "SERVICE_NOT_FOUND" : "STAFF_NOT_FOUND");
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) return;
  const ordered = [...items];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await db.$transaction(
    ordered.map((item, sortOrder) =>
      kind === "service"
        ? db.service.update({ where: { id: item.id }, data: { sortOrder } })
        : db.staff.update({ where: { id: item.id }, data: { sortOrder } }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Staff

export const staffSchema = z.object({
  id: id.optional(),
  name: z.string().trim().min(2, "name").max(60, "name"),
  position: optionalText(60),
  serviceIds: z.array(id).max(100).default([]),
  /** null → same as the business schedule */
  weeklySchedule: weeklyScheduleSchema.nullable().default(null),
  isActive: z.boolean().default(true),
});

async function assertStaffLimit(business: Business, excludeStaffId?: string) {
  const { maxStaff } = getAccess(business, new Date());
  const active = await db.staff.count({
    where: {
      businessId: business.id,
      isActive: true,
      ...(excludeStaffId ? { id: { not: excludeStaffId } } : {}),
    },
  });
  if (active >= Math.min(maxStaff, MAX_STAFF_LIMIT)) {
    throw new PanelError("STAFF_LIMIT", { max: String(Math.min(maxStaff, MAX_STAFF_LIMIT)) });
  }
}

export async function saveStaff(business: Business, raw: unknown) {
  const input = parseOrThrow(staffSchema, raw);
  if (input.isActive) {
    const existing = input.id
      ? await db.staff.findFirst({
          where: { id: input.id, businessId: business.id },
          select: { isActive: true },
        })
      : null;
    if (!existing?.isActive) await assertStaffLimit(business, input.id);
  }
  const services = await db.service.findMany({
    where: { businessId: business.id, id: { in: input.serviceIds } },
    select: { id: true },
  });
  const data = {
    name: input.name,
    position: input.position,
    isActive: input.isActive,
    weeklySchedule: input.weeklySchedule ?? undefined,
  };
  return db.$transaction(async (tx) => {
    let staffId: string;
    if (input.id) {
      const updated = await tx.staff.updateMany({
        where: { id: input.id, businessId: business.id },
        data: { ...data, weeklySchedule: input.weeklySchedule ?? Prisma.DbNull },
      });
      if (updated.count === 0) throw new PanelError("STAFF_NOT_FOUND");
      staffId = input.id;
    } else {
      const last = await tx.staff.aggregate({
        where: { businessId: business.id },
        _max: { sortOrder: true },
      });
      const created = await tx.staff.create({
        data: { ...data, businessId: business.id, sortOrder: (last._max.sortOrder ?? -1) + 1 },
      });
      staffId = created.id;
    }
    await tx.staffService.deleteMany({ where: { staffId } });
    if (services.length) {
      await tx.staffService.createMany({
        data: services.map((s) => ({ staffId, serviceId: s.id })),
      });
    }
    return { id: staffId };
  });
}

export async function setStaffActive(business: Business, staffId: string, isActive: boolean) {
  if (isActive) await assertStaffLimit(business, staffId);
  const updated = await db.staff.updateMany({
    where: { id: staffId, businessId: business.id },
    data: { isActive },
  });
  if (updated.count === 0) throw new PanelError("STAFF_NOT_FOUND");
}

export async function deleteStaff(businessId: string, staffId: string) {
  const staff = await db.staff.findFirst({
    where: { id: staffId, businessId },
    select: { _count: { select: { bookings: true } } },
  });
  if (!staff) throw new PanelError("STAFF_NOT_FOUND");
  if (staff._count.bookings > 0) throw new PanelError("HAS_BOOKINGS");
  await db.staff.delete({ where: { id: staffId } });
}

// ---------------------------------------------------------------------------
// Time off (staffId null = the whole business is closed, e.g. Navroʻz)

export const timeOffSchema = z
  .object({
    staffId: id.nullable(),
    from: z.string().refine(isValidDateStr, "from"),
    to: z.string().refine(isValidDateStr, "to"),
    reason: optionalText(100),
  })
  .refine((v) => v.to >= v.from, { message: "to", path: ["to"] })
  .refine((v) => v.to <= addDays(v.from, 366), { message: "to", path: ["to"] });

export async function addTimeOff(business: Business, raw: unknown) {
  const input = parseOrThrow(timeOffSchema, raw);
  if (input.staffId) {
    const staff = await db.staff.findFirst({
      where: { id: input.staffId, businessId: business.id },
    });
    if (!staff) throw new PanelError("STAFF_NOT_FOUND");
  }
  // Whole local days [from 00:00, to + 1 day 00:00).
  return db.timeOff.create({
    data: {
      businessId: business.id,
      staffId: input.staffId,
      startsAt: dayRangeUtc(input.from, business.timezone).start,
      endsAt: dayRangeUtc(input.to, business.timezone).end,
      reason: input.reason,
    },
  });
}

export async function deleteTimeOff(businessId: string, timeOffId: string) {
  const deleted = await db.timeOff.deleteMany({ where: { id: timeOffId, businessId } });
  if (deleted.count === 0) throw new PanelError("NOT_ALLOWED");
}

// ---------------------------------------------------------------------------
// Clients

export const clientSchema = z.object({
  id,
  name: z.string().trim().min(2, "name").max(60, "name"),
  notes: optionalText(1000),
});

export async function saveClient(businessId: string, raw: unknown) {
  const input = parseOrThrow(clientSchema, raw);
  const updated = await db.client.updateMany({
    where: { id: input.id, businessId },
    data: { name: input.name, notes: input.notes },
  });
  if (updated.count === 0) throw new PanelError("NOT_ALLOWED");
}

// ---------------------------------------------------------------------------
// Business settings

const urlOrNull = z
  .string()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => v?.trim() || null)
  .refine((v) => v === null || /^https?:\/\/\S+$/.test(v), "url");
const handle = z
  .string()
  .max(64)
  .optional()
  .nullable()
  .transform(
    (v) =>
      v
        ?.trim()
        .replace(/^@/, "")
        .replace(/^https?:\/\/(t\.me|instagram\.com)\//, "") || null,
  )
  .refine((v) => v === null || /^[A-Za-z0-9_.]{2,64}$/.test(v), "handle");

export const profileSchema = z.object({
  name: z.string().trim().min(2, "name").max(80, "name"),
  category: z.enum(CATEGORY_CODES),
  region: z.enum(REGION_CODES),
  district: z.string().trim().min(2, "district").max(80, "district"),
  address: z.string().trim().min(3, "address").max(160, "address"),
  landmark: optionalText(120),
  phone: z
    .string()
    .transform((v) => normalizePhone(v) ?? "")
    .pipe(z.string().min(1, "phone")),
  mapUrl: urlOrNull.optional(),
  instagram: handle.optional(),
  telegramUsername: handle.optional(),
  description: optionalText(1000).optional(),
});

export async function saveProfile(businessId: string, raw: unknown) {
  const input = parseOrThrow(profileSchema, raw);
  await db.business.update({ where: { id: businessId }, data: input });
}

export async function saveBusinessSchedule(businessId: string, raw: unknown) {
  const schedule = parseOrThrow(weeklyScheduleSchema, raw);
  await db.business.update({ where: { id: businessId }, data: { weeklySchedule: schedule } });
}

export const rulesSchema = z.object({
  slotStepMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  minLeadMinutes: z
    .number()
    .int()
    .min(0)
    .max(7 * 24 * 60),
  maxDaysAhead: z.number().int().min(1).max(365),
  autoConfirm: z.boolean(),
  cancelUntilHours: z.number().int().min(0).max(72),
});

export async function saveRules(businessId: string, raw: unknown) {
  await db.business.update({ where: { id: businessId }, data: parseOrThrow(rulesSchema, raw) });
}

export const notificationsSchema = z.object({
  reminder24h: z.boolean(),
  reminder2h: z.boolean(),
  ownerNotify: z.boolean(),
});

export async function saveNotifications(businessId: string, userId: string, raw: unknown) {
  const input = parseOrThrow(notificationsSchema, raw);
  await db.$transaction([
    db.business.update({
      where: { id: businessId },
      data: { reminder24h: input.reminder24h, reminder2h: input.reminder2h },
    }),
    db.membership.update({
      where: { userId_businessId: { userId, businessId } },
      data: { notify: input.ownerNotify },
    }),
  ]);
}

/** What is still missing before the page can be published (spec 7.6). */
export async function publishRequirements(businessId: string) {
  const [services, staff] = await Promise.all([
    db.service.count({ where: { businessId, isActive: true } }),
    db.staff.count({ where: { businessId, isActive: true } }),
  ]);
  return { hasService: services > 0, hasStaff: staff > 0 };
}

export async function setPublished(businessId: string, isPublished: boolean) {
  if (isPublished) {
    const req = await publishRequirements(businessId);
    if (!req.hasService || !req.hasStaff) throw new PanelError("PUBLISH_REQUIREMENTS");
  }
  await db.business.update({ where: { id: businessId }, data: { isPublished } });
}

export async function changeSlug(businessId: string, rawSlug: unknown) {
  const slug = z.string().trim().toLowerCase().max(60).parse(rawSlug);
  const problem = validateSlug(slug);
  if (problem) throw new PanelError(problem);
  try {
    await db.business.update({ where: { id: businessId }, data: { slug } });
  } catch (error) {
    if (isUniqueError(error)) throw new PanelError("SLUG_TAKEN");
    throw error;
  }
  return { slug };
}
