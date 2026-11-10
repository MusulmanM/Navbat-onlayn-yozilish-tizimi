// Website session in an httpOnly cookie (spec 10). Business owners log in only via Telegram.
import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "@/config/site";
import { signSession, verifySession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { requireEnv } from "@/lib/env";

/** Current user, or null. Checks the token signature and sessionVersion (logout everywhere). */
export const getSessionUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token, process.env.SESSION_SECRET ?? "");
  if (!payload) return null;
  const user = await db.user.findUnique({ where: { id: payload.uid } });
  if (!user || user.sessionVersion !== payload.sv) return null;
  return user;
});

export async function startSession(user: { id: string; sessionVersion: number }): Promise<void> {
  const token = await signSession(
    { uid: user.id, sv: user.sessionVersion },
    requireEnv("SESSION_SECRET"),
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** "Log out of all devices": every existing token stops matching sessionVersion. */
export async function endAllSessions(userId: string): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } });
  await endSession();
}
