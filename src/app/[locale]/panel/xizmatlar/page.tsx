import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { PageHeader } from "@/components/panel/page-header";
import { ServicesManager } from "@/components/panel/services-manager";
import { requireBusiness } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDuration } from "@/lib/time";

export default async function ServicesPage({ params }: PageProps<"/[locale]/panel/xizmatlar">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const { businessId } = await requireBusiness();
  const t = await getTranslations("Services");
  const [services, staff] = await Promise.all([
    db.service.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { staff: { select: { staffId: true } }, _count: { select: { bookings: true } } },
    }),
    db.staff.findMany({
      where: { businessId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title={t("title")} />
      <ServicesManager
        locale={locale}
        staff={staff}
        services={services.map((s) => ({
          id: s.id,
          nameUz: s.nameUz,
          nameRu: s.nameRu,
          descriptionUz: s.descriptionUz,
          descriptionRu: s.descriptionRu,
          durationMinutes: s.durationMinutes,
          bufferMinutes: s.bufferMinutes,
          price: s.price,
          priceIsFrom: s.priceIsFrom,
          isActive: s.isActive,
          staffIds: s.staff.map((x) => x.staffId),
          priceLabel: formatMoney(s.price, locale, s.priceIsFrom),
          durationLabel: formatDuration(s.durationMinutes, locale),
          bookingsCount: s._count.bookings,
        }))}
      />
    </div>
  );
}
