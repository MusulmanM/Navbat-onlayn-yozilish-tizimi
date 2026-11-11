"use server";

import { refresh } from "next/cache";
import { requireBusiness } from "@/lib/auth/guards";
import { claimPayment } from "@/server/billing";
import { runAction } from "@/server/panel/result";

/** Owner pressed "To'ladim": admins get a Telegram message (spec 7.6). */
export async function claimPaymentAction(plan: string) {
  return runAction(async () => {
    const { businessId } = await requireBusiness();
    await claimPayment(businessId, plan);
    refresh();
    return null;
  });
}
