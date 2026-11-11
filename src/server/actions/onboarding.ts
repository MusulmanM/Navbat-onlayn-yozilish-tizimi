"use server";

import { refresh } from "next/cache";
import { getAccess } from "@/lib/access";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { changeSlug } from "@/server/panel/catalog";
import {
  finishOnboarding,
  saveBusinessStep,
  saveScheduleStep,
  saveServicesStep,
  saveStaffStep,
} from "@/server/panel/onboarding";
import { PanelError, runAction } from "@/server/panel/result";

/** The user's own business (onboarding never takes a business id from the client). */
async function ownBusiness() {
  const user = await requireUser();
  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { business: true },
  });
  if (!membership) throw new PanelError("NOT_ALLOWED");
  return { user, business: membership.business };
}

export async function onboardingBusinessAction(input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    const result = await saveBusinessStep(user, input);
    refresh();
    return result;
  });
}

export async function onboardingScheduleAction(input: unknown) {
  return runAction(async () => {
    const { business } = await ownBusiness();
    await saveScheduleStep(business.id, input);
    refresh();
    return null;
  });
}

export async function onboardingServicesAction(input: unknown) {
  return runAction(async () => {
    const { business } = await ownBusiness();
    await saveServicesStep(business.id, input);
    refresh();
    return null;
  });
}

export async function onboardingStaffAction(input: unknown) {
  return runAction(async () => {
    const { business } = await ownBusiness();
    await saveStaffStep(business, input, getAccess(business, new Date()).maxStaff);
    refresh();
    return null;
  });
}

export async function onboardingSlugAction(slug: string) {
  return runAction(async () => {
    const { business } = await ownBusiness();
    const result = await changeSlug(business.id, slug);
    refresh();
    return result;
  });
}

export async function onboardingFinishAction(publish: boolean) {
  return runAction(async () => {
    const { business } = await ownBusiness();
    await finishOnboarding(business.id, Boolean(publish));
    return null;
  });
}
