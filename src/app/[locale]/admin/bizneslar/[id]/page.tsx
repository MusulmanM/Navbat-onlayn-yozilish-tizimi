import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { categoryName } from "@/config/categories";
import { isLocale, type Locale } from "@/config/locales";
import { regionName } from "@/config/regions";
import {
  AdminBusinessActions,
  AdminPaymentForm,
  AdminTrialForm,
} from "@/components/admin/admin-actions";
import { Link } from "@/i18n/navigation";
import { getAccess } from "@/lib/access";
import { formatSum } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { dateInZone, formatDateFull } from "@/lib/time";
import { getBusinessAdmin } from "@/server/admin";

export default async function AdminBusinessPage({
  params,
}: PageProps<"/[locale]/admin/bizneslar/[id]">) {
  const { locale: raw, id } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const business = await getBusinessAdmin(id);
  if (!business) notFound();
  const [t, tb] = await Promise.all([getTranslations("Admin"), getTranslations("Billing")]);
  const now = new Date();
  const access = getAccess(business, now);
  const tz = business.timezone;
  const date = (d: Date) => formatDateFull(dateInZone(d, tz), locale);
  const featured = !!business.featuredUntil && business.featuredUntil > now;

  const info: Array<[string, string]> = [
    [t("columns.category"), categoryName(business.category, locale)],
    [t("columns.region"), `${regionName(business.region, locale)}, ${business.district}`],
    [t("address"), `${business.address}${business.landmark ? ` (${business.landmark})` : ""}`],
    [t("phone"), formatPhone(business.phone)],
    [t("columns.plan"), `${business.plan} · ${tb(`states.${access.state}`)}`],
    [t("periodEnds"), date(access.endsAt)],
    [t("columns.created"), date(business.createdAt)],
    [
      t("counts"),
      `${business._count.bookings} / ${business._count.clients} / ${business._count.staff} / ${business._count.services}`,
    ],
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/bizneslar"
        className="inline-flex min-h-11 items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="text-muted-foreground">/b/{business.slug}</p>
          {business.isBlocked && (
            <p className="mt-1 font-semibold text-destructive">{t("blocked")}</p>
          )}
          {featured && (
            <p className="mt-1 text-sm">
              ⭐ {t("topUntil", { date: date(business.featuredUntil!) })}
            </p>
          )}
          {business.paymentClaimedAt && (
            <p className="mt-1 font-medium text-pending-foreground">
              💳 {t("claimedPayment", { date: date(business.paymentClaimedAt) })}
            </p>
          )}
        </div>
        <a
          href={`/b/${business.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 font-semibold hover:bg-muted"
        >
          <ExternalLink className="size-4" aria-hidden />
          {t("openPage")}
        </a>
      </div>
      <AdminBusinessActions
        businessId={business.id}
        blocked={business.isBlocked}
        featured={featured}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 text-lg font-bold">{t("info")}</h2>
          <dl className="space-y-2 text-sm">
            {info.map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="w-32 shrink-0 text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 mb-2 font-bold">{t("owners")}</h3>
          <ul className="space-y-1 text-sm">
            {business.memberships.map((m) => (
              <li key={m.id}>
                {m.user.firstName} {m.user.lastName ?? ""}
                {m.user.telegramUsername ? (
                  <a
                    href={`https://t.me/${m.user.telegramUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-primary underline"
                  >
                    @{m.user.telegramUsername}
                  </a>
                ) : (
                  <span className="ml-1 text-muted-foreground">
                    ID {m.user.telegramId.toString()}
                  </span>
                )}{" "}
                · {m.role}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 text-lg font-bold">{t("addPayment")}</h2>
          <AdminPaymentForm
            businessId={business.id}
            defaultPlan={business.plan === "START" ? "START" : "PRO"}
          />
          <div className="mt-5 border-t pt-4">
            <AdminTrialForm
              businessId={business.id}
              trialEnds={dateInZone(new Date(business.trialEndsAt.getTime() - 1), tz)}
            />
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("payments")}</h2>
        {business.payments.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-4 text-muted-foreground">
            {tb("noPayments")}
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {business.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                <span className="font-semibold">
                  {formatSum(p.amount, locale)} · {p.plan} · {tb("days", { count: p.periodDays })}
                </span>
                <span className="text-muted-foreground">
                  {date(p.createdAt)} · {t(`methods.${p.method}`)}
                  {p.note ? ` · ${p.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
