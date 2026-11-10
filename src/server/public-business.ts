// Read models for public pages and APIs.
import { canAcceptOnlineBookings, getAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { ApiError } from "@/server/api";

/** Published business for the booking APIs; throws 404 / 403 like the spec requires. */
export async function requireBookableBusiness(slug: string, now: Date = new Date()) {
  const business = await db.business.findUnique({ where: { slug } });
  if (!business || !business.isPublished) throw new ApiError(404, "BUSINESS_NOT_FOUND");
  if (!canAcceptOnlineBookings(getAccess(business, now).state)) {
    throw new ApiError(403, "BOOKING_DISABLED", undefined, { phone: business.phone });
  }
  return business;
}

/** Everything the public business page renders. Null when not found or not published. */
export async function getPublicBusinessPage(slug: string) {
  const business = await db.business.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { staff: { select: { staffId: true } } },
      },
      staff: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, position: true, sortOrder: true },
      },
    },
  });
  if (!business || !business.isPublished) return null;
  return business;
}

export type PublicBusinessPage = NonNullable<Awaited<ReturnType<typeof getPublicBusinessPage>>>;

/** Business-wide closures (holidays) for the next week, for the "open now" line. */
export async function getUpcomingClosures(businessId: string, now: Date) {
  return db.timeOff.findMany({
    where: {
      businessId,
      staffId: null,
      endsAt: { gt: now },
      startsAt: { lt: new Date(now.getTime() + 8 * 24 * 3600 * 1000) },
    },
    select: { startsAt: true, endsAt: true },
  });
}
