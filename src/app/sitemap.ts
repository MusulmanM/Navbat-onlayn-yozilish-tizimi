import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/public-env";
import { canAcceptOnlineBookings, getAccess } from "@/lib/access";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const both = (path: string) => ({
  uz: absoluteUrl(path || "/"),
  ru: absoluteUrl(`/ru${path}`),
});

// Landing, legal pages and every published, active business page (spec 13).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = ["", "/maxfiylik", "/shartlar"].map((path) => ({
    url: absoluteUrl(path || "/"),
    alternates: { languages: both(path) },
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.3,
  }));
  try {
    const businesses = await db.business.findMany({
      where: { isPublished: true, isDemo: false, isBlocked: false },
      select: {
        slug: true,
        updatedAt: true,
        plan: true,
        trialEndsAt: true,
        paidUntil: true,
        isBlocked: true,
      },
    });
    for (const b of businesses) {
      if (!canAcceptOnlineBookings(getAccess(b, now).state)) continue;
      const path = `/b/${b.slug}`;
      entries.push({
        url: absoluteUrl(path),
        lastModified: b.updatedAt,
        alternates: { languages: both(path) },
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("[sitemap] database unavailable", error);
  }
  return entries;
}
