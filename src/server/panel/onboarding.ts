// Onboarding wizard (spec 7.5). Every step is saved, so a page reload never loses data.
import { z } from "zod";
import { categoryName } from "@/config/categories";
import { regionName } from "@/config/regions";
import { TRIAL_DAYS } from "@/config/site";
import type { Business } from "@/generated/prisma/client";
import { db, isUniqueError } from "@/lib/db";
import { runInBackground } from "@/lib/notify";
import { defaultWeeklySchedule } from "@/lib/schedule";
import { nextAvailableSlug, slugify } from "@/lib/slug";
import { DAY_MS } from "@/lib/time";
import { referralCode } from "@/lib/tokens";
import { parseOrThrow } from "@/server/api";
import { profileSchema, saveBusinessSchedule, setPublished } from "@/server/panel/catalog";
import { PanelError } from "@/server/panel/result";

export const ONBOARDING_STEPS = 5;

const businessStepSchema = profileSchema.pick({
  name: true,
  category: true,
  region: true,
  district: true,
  address: true,
  landmark: true,
  phone: true,
});

type OwnerUser = { id: string; firstName: string; telegramUsername: string | null };

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  const taken = await db.business.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  return nextAvailableSlug(base, new Set(taken.map((b) => b.slug)));
}

async function bumpStep(businessId: string, step: number) {
  const business = await db.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { onboardingStep: true },
  });
  if (business.onboardingStep !== null && business.onboardingStep < step) {
    await db.business.update({ where: { id: businessId }, data: { onboardingStep: step } });
  }
}

/** Step 1: creates the business on first save (trial, OWNER membership, admin message). */
export async function saveBusinessStep(user: OwnerUser, raw: unknown, now: Date = new Date()) {
  const input = parseOrThrow(businessStepSchema, raw);
  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (membership) {
    await db.business.update({ where: { id: membership.businessId }, data: input });
    await bumpStep(membership.businessId, 2);
    return { businessId: membership.businessId };
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const business = await db.business.create({
        data: {
          ...input,
          slug: await uniqueSlug(input.name),
          referralCode: referralCode(),
          weeklySchedule: defaultWeeklySchedule(),
          trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * DAY_MS),
          plan: "TRIAL",
          onboardingStep: 2,
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      });
      notifyAdminsAboutNewBusiness(business, user);
      return { businessId: business.id };
    } catch (error) {
      if (!isUniqueError(error)) throw error; // slug or referral code collided: try again
    }
  }
  throw new PanelError("INTERNAL");
}

function notifyAdminsAboutNewBusiness(business: Business, user: OwnerUser) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  runInBackground(async () => {
    const { notifyAdmins } = await import("@/bot/notifier");
    const { botTexts } = await import("@/bot/texts");
    await notifyAdmins((locale) =>
      botTexts(locale).adminNewBusiness({
        name: business.name,
        category: categoryName(business.category, locale),
        region: regionName(business.region, locale),
        owner: user.firstName,
        username: user.telegramUsername,
      }),
    );
  });
}

/** Step 2: working hours. */
export async function saveScheduleStep(businessId: string, raw: unknown) {
  await saveBusinessSchedule(businessId, raw);
  await bumpStep(businessId, 3);
}

const serviceRow = z.object({
  id: z.string().max(64).optional(),
  nameUz: z.string().trim().min(2, "nameUz").max(80, "nameUz"),
  nameRu: z
    .string()
    .max(80)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),
  durationMinutes: z
    .number()
    .int()
    .min(5)
    .max(480)
    .refine((v) => v % 5 === 0, "duration"),
  price: z.number().int().min(0).max(100_000_000),
  priceIsFrom: z.boolean().default(false),
});

/** Step 3: the list replaces the current services (removed ones are deleted or archived). */
export async function saveServicesStep(businessId: string, raw: unknown) {
  const { services } = parseOrThrow(
    z.object({ services: z.array(serviceRow).min(1, "services").max(50) }),
    raw,
  );
  await db.$transaction(async (tx) => {
    const existing = await tx.service.findMany({
      where: { businessId },
      select: { id: true, _count: { select: { bookings: true } } },
    });
    const keep = new Set(services.map((s) => s.id).filter(Boolean));
    for (const old of existing) {
      if (keep.has(old.id)) continue;
      if (old._count.bookings > 0)
        await tx.service.update({ where: { id: old.id }, data: { isActive: false } });
      else await tx.service.delete({ where: { id: old.id } });
    }
    const allStaff = await tx.staff.findMany({ where: { businessId }, select: { id: true } });
    for (const [sortOrder, s] of services.entries()) {
      const data = {
        nameUz: s.nameUz,
        nameRu: s.nameRu,
        durationMinutes: s.durationMinutes,
        price: s.price,
        priceIsFrom: s.priceIsFrom,
        isActive: true,
        sortOrder,
      };
      if (s.id && existing.some((e) => e.id === s.id)) {
        await tx.service.update({ where: { id: s.id }, data });
      } else {
        // New services are done by every existing staff member by default.
        await tx.service.create({
          data: {
            ...data,
            businessId,
            staff: { create: allStaff.map((st) => ({ staffId: st.id })) },
          },
        });
      }
    }
  });
  await bumpStep(businessId, 4);
}

const staffRow = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(2, "name").max(60, "name"),
  position: z
    .string()
    .max(60)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),
  serviceIds: z.array(z.string().max(64)).max(100),
});

/** Step 4: at least one staff member; each with the services they do. */
export async function saveStaffStep(business: Business, raw: unknown, maxStaff: number) {
  const { staff } = parseOrThrow(
    z.object({ staff: z.array(staffRow).min(1, "staff").max(50) }),
    raw,
  );
  if (staff.length > maxStaff) throw new PanelError("STAFF_LIMIT", { max: String(maxStaff) });
  await db.$transaction(async (tx) => {
    const services = await tx.service.findMany({
      where: { businessId: business.id },
      select: { id: true },
    });
    const validService = new Set(services.map((s) => s.id));
    const existing = await tx.staff.findMany({
      where: { businessId: business.id },
      select: { id: true, _count: { select: { bookings: true } } },
    });
    const keep = new Set(staff.map((s) => s.id).filter(Boolean));
    for (const old of existing) {
      if (keep.has(old.id)) continue;
      if (old._count.bookings > 0)
        await tx.staff.update({ where: { id: old.id }, data: { isActive: false } });
      else await tx.staff.delete({ where: { id: old.id } });
    }
    for (const [sortOrder, s] of staff.entries()) {
      const serviceIds = s.serviceIds.filter((sid) => validService.has(sid));
      let staffId = s.id && existing.some((e) => e.id === s.id) ? s.id : null;
      if (staffId) {
        await tx.staff.update({
          where: { id: staffId },
          data: { name: s.name, position: s.position, isActive: true, sortOrder },
        });
        await tx.staffService.deleteMany({ where: { staffId } });
      } else {
        staffId = (
          await tx.staff.create({
            data: { businessId: business.id, name: s.name, position: s.position, sortOrder },
          })
        ).id;
      }
      if (serviceIds.length) {
        await tx.staffService.createMany({
          data: serviceIds.map((serviceId) => ({ staffId: staffId!, serviceId })),
        });
      }
    }
  });
  await bumpStep(business.id, 5);
}

/** Step 5: publish (or not) and leave the wizard. */
export async function finishOnboarding(businessId: string, publish: boolean) {
  if (publish) await setPublished(businessId, true);
  await db.business.update({ where: { id: businessId }, data: { onboardingStep: null } });
}
