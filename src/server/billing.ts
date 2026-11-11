// Subscription: "I have paid" claims (owner) and manual payments (admin) — spec 7.6, 7.7.
import { z } from "zod";
import { absoluteUrl } from "@/config/public-env";
import { PAID_PLANS, PAYMENT_METHODS, PLANS } from "@/config/plans";
import type { Locale } from "@/config/locales";
import { getAccess, extendPaidUntil } from "@/lib/access";
import { db } from "@/lib/db";
import { runInBackground } from "@/lib/notify";
import { dateInZone, dayRangeUtc, formatDateFull, isValidDateStr } from "@/lib/time";
import { parseOrThrow } from "@/server/api";
import { PanelError } from "@/server/panel/result";

export async function claimPayment(businessId: string, rawPlan: unknown, now: Date = new Date()) {
  const plan = z.enum(PAID_PLANS).parse(rawPlan);
  const business = await db.business.update({
    where: { id: businessId },
    data: { paymentClaimedAt: now },
  });
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  runInBackground(async () => {
    const { notifyAdmins } = await import("@/bot/notifier");
    const { botTexts } = await import("@/bot/texts");
    await notifyAdmins((locale: Locale) =>
      botTexts(locale).adminPaymentClaim({
        business: business.name,
        plan,
        adminUrl: absoluteUrl(`/admin/bizneslar/${business.id}`),
      }),
    );
  });
}

export const paymentSchema = z.object({
  amount: z.number().int().min(0).max(100_000_000),
  plan: z.enum(PAID_PLANS),
  periodDays: z.number().int().min(1).max(366).default(30),
  method: z.enum(PAYMENT_METHODS),
  note: z
    .string()
    .max(300)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),
});

/** Admin records a payment: paidUntil = max(now, paidUntil) + days, owners get a message. */
export async function addPayment(
  adminUserId: string,
  businessId: string,
  raw: unknown,
  now: Date = new Date(),
) {
  const input = parseOrThrow(paymentSchema, raw);
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) throw new PanelError("NOT_ALLOWED");
  const paidUntil = extendPaidUntil(business.paidUntil, now, input.periodDays);
  await db.$transaction([
    db.payment.create({
      data: {
        businessId,
        amount: input.amount,
        plan: input.plan,
        periodDays: input.periodDays,
        method: input.method,
        note: input.note,
        recordedByUserId: adminUserId,
      },
    }),
    db.business.update({
      where: { id: businessId },
      data: { paidUntil, plan: input.plan, paymentClaimedAt: null, lastBillingNotice: null },
    }),
  ]);

  if (process.env.TELEGRAM_BOT_TOKEN) {
    runInBackground(async () => {
      const { ownerRecipients } = await import("@/bot/booking-messages");
      const { sendMessage } = await import("@/bot/send");
      const { botTexts } = await import("@/bot/texts");
      for (const owner of await ownerRecipients(businessId)) {
        const date = formatDateFull(dateInZone(paidUntil, business.timezone), owner.locale);
        await sendMessage(owner.chatId, botTexts(owner.locale).paymentReceived({ date }));
      }
    });
  }
  return { paidUntil: paidUntil.toISOString() };
}

export async function setBlocked(businessId: string, isBlocked: boolean) {
  await db.business.update({ where: { id: businessId }, data: { isBlocked } });
}

/** Admin can move the trial end (e.g. to test what happens when it expires). */
export async function setTrialEnds(businessId: string, rawDate: unknown) {
  const date = z.string().refine(isValidDateStr, "date").parse(rawDate);
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { timezone: true },
  });
  if (!business) throw new PanelError("NOT_ALLOWED");
  await db.business.update({
    where: { id: businessId },
    data: { trialEndsAt: dayRangeUtc(date, business.timezone).end, lastBillingNotice: null },
  });
}

/** "TOP" in the future catalog: 30 days from now, or off. */
export async function setFeatured(businessId: string, featured: boolean, now: Date = new Date()) {
  await db.business.update({
    where: { id: businessId },
    data: { featuredUntil: featured ? new Date(now.getTime() + 30 * 24 * 3600 * 1000) : null },
  });
}

/** Monthly recurring revenue: paid plans of ACTIVE businesses. */
export function monthlyRevenue(
  businesses: Array<Parameters<typeof getAccess>[0]>,
  now: Date,
): number {
  return businesses
    .filter((b) => getAccess(b, now).state === "ACTIVE")
    .reduce((sum, b) => sum + PLANS[b.plan].priceSom, 0);
}
