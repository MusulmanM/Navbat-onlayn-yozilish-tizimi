// Route and action guards (spec 10). businessId from the client is never trusted:
// the business always comes from the logged-in user's own membership.
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { cache } from "react";
import { redirect } from "@/i18n/navigation";
import { findMembership, isAdmin } from "@/lib/auth/access-rules";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { adminTelegramIds } from "@/lib/env";

async function goTo(href: string): Promise<never> {
  const locale = await getLocale();
  return redirect({ href, locale });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return goTo("/login");
  return user;
}

/** The user's business (first membership; the schema allows more for later). */
export const getCurrentMembership = cache(async (userId: string) =>
  db.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { business: true },
  }),
);

export type PanelContext = {
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
  businessId: string;
  business: NonNullable<Awaited<ReturnType<typeof getCurrentMembership>>>["business"];
  role: "OWNER" | "MANAGER";
};

/** For /panel pages and panel actions. Without a business → onboarding. */
export async function requireBusiness(): Promise<PanelContext> {
  const user = await requireUser();
  const membership = await getCurrentMembership(user.id);
  if (!membership) return goTo("/onboarding");
  return {
    user,
    businessId: membership.businessId,
    business: membership.business,
    role: membership.role,
  };
}

/** Explicit check for a specific business id (e.g. switching businesses later). */
export async function requireMember(businessId: string): Promise<PanelContext> {
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { business: true },
  });
  const membership = findMembership(memberships, businessId);
  if (!membership) notFound();
  return { user, businessId, business: membership.business, role: membership.role };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user.telegramId, adminTelegramIds())) notFound();
  return user;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && isAdmin(user.telegramId, adminTelegramIds());
}
