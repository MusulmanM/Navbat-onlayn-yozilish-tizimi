import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { Link } from "@/i18n/navigation";
import { formatSum } from "@/lib/money";
import { dateInZone, formatDateFull } from "@/lib/time";
import { getAdminStats } from "@/server/admin";

export default async function AdminStatsPage({ params }: PageProps<"/[locale]/admin">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const t = await getTranslations("Admin");
  const stats = await getAdminStats();
  const cards = [
    { label: t("stats.total"), value: stats.total },
    { label: t("stats.published"), value: stats.published },
    { label: t("stats.trial"), value: stats.trial },
    { label: t("stats.paying"), value: stats.paying },
    { label: t("stats.expired"), value: stats.expired },
    { label: t("stats.mrr"), value: formatSum(stats.mrr, locale) },
    { label: t("stats.bookings30"), value: stats.bookings30 },
    { label: t("stats.newWeek"), value: stats.newWeek },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("nav.stats")}</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4">
            <p className="text-2xl font-bold tabular-nums">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-3 text-lg font-bold">💳 {t("claims")}</h2>
        {stats.claims.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-4 text-muted-foreground">
            {t("noClaims")}
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {stats.claims.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/bizneslar/${c.id}`}
                  className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50"
                >
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {c.paymentClaimedAt &&
                      formatDateFull(dateInZone(c.paymentClaimedAt, "Asia/Tashkent"), locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
