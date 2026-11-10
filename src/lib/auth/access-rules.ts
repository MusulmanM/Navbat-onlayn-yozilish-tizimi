// Pure authorization rules (unit-tested). Guards in guards.ts apply them to the session.

export type MembershipLike = { businessId: string; role: "OWNER" | "MANAGER" };

/** A user may touch a business only through an explicit membership. */
export function findMembership<T extends MembershipLike>(
  memberships: T[],
  businessId: string,
): T | null {
  return memberships.find((m) => m.businessId === businessId) ?? null;
}

export function isAdmin(telegramId: bigint, adminIds: bigint[]): boolean {
  return adminIds.some((id) => id === telegramId);
}

/** Only relative in-app paths are allowed after login (no open redirects). */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return null;
  if (!/^\/(ru\/)?(panel|onboarding|admin)(\/|$|\?)/.test(next)) return null;
  return next;
}
