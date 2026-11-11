"use server";

// Admin-only actions: every call re-checks ADMIN_TELEGRAM_IDS (spec 7.7).
import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { addPayment, setBlocked, setFeatured, setTrialEnds } from "@/server/billing";
import { runAction } from "@/server/panel/result";

const id = z.string().trim().min(1).max(64);

export async function addPaymentAction(businessId: string, input: unknown) {
  return runAction(async () => {
    const admin = await requireAdmin();
    const result = await addPayment(admin.id, id.parse(businessId), input);
    refresh();
    return result;
  });
}

export async function setBlockedAction(businessId: string, blocked: boolean) {
  return runAction(async () => {
    await requireAdmin();
    await setBlocked(id.parse(businessId), Boolean(blocked));
    refresh();
    return null;
  });
}

export async function setFeaturedAction(businessId: string, featured: boolean) {
  return runAction(async () => {
    await requireAdmin();
    await setFeatured(id.parse(businessId), Boolean(featured));
    refresh();
    return null;
  });
}

export async function setTrialEndsAction(businessId: string, date: string) {
  return runAction(async () => {
    await requireAdmin();
    await setTrialEnds(id.parse(businessId), date);
    refresh();
    return null;
  });
}
