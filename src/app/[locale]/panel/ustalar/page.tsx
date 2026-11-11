import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { MAX_STAFF_LIMIT } from "@/config/site";
import { PageHeader } from "@/components/panel/page-header";
import { StaffManager } from "@/components/panel/staff-manager";
import { getAccess } from "@/lib/access";
import { requireBusiness } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { parseOptionalSchedule, parseWeeklySchedule } from "@/lib/schedule";
import { dateInZone } from "@/lib/time";
import { timeOffLabel } from "@/server/panel/time-off-labels";

export default async function StaffPage({ params }: PageProps<"/[locale]/panel/ustalar">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const { business } = await requireBusiness();
  const t = await getTranslations("StaffPage");
  const now = new Date();
  const [staff, services] = await Promise.all([
    db.staff.findMany({
      where: { businessId: business.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        services: { select: { serviceId: true } },
        timeOffs: { where: { endsAt: { gt: now } }, orderBy: { startsAt: "asc" } },
        _count: { select: { bookings: true } },
      },
    }),
    db.service.findMany({
      where: { businessId: business.id, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, nameUz: true, nameRu: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title={t("title")} />
      <StaffManager
        locale={locale}
        today={dateInZone(now, business.timezone)}
        maxStaff={Math.min(getAccess(business, now).maxStaff, MAX_STAFF_LIMIT)}
        businessSchedule={parseWeeklySchedule(business.weeklySchedule)}
        services={services.map((s) => ({
          id: s.id,
          name: locale === "ru" ? (s.nameRu ?? s.nameUz) : s.nameUz,
        }))}
        staff={staff.map((s) => ({
          id: s.id,
          name: s.name,
          position: s.position,
          isActive: s.isActive,
          serviceIds: s.services.map((x) => x.serviceId),
          weeklySchedule: parseOptionalSchedule(s.weeklySchedule),
          bookingsCount: s._count.bookings,
          timeOffs: s.timeOffs.map((o) => ({
            id: o.id,
            label: timeOffLabel(o.startsAt, o.endsAt, business.timezone, locale),
            reason: o.reason,
          })),
        }))}
      />
    </div>
  );
}
