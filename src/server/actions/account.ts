"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser, endAllSessions, endSession } from "@/lib/auth/session";

export async function logoutAction() {
  await endSession();
  redirect({ href: "/login", locale: await getLocale() });
}

/** "Log out of all devices": bumps sessionVersion so every old cookie stops working. */
export async function logoutAllAction() {
  const user = await getSessionUser();
  if (user) await endAllSessions(user.id);
  else await endSession();
  redirect({ href: "/login", locale: await getLocale() });
}
