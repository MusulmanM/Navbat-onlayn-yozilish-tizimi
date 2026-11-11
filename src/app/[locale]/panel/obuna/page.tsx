import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { PLAN_FEATURES, PLANS } from "@/config/plans";
import { supportLink } from "@/config/public-env";
import { BillingClaim } from "@/components/panel/billing-claim";
import { EmptyState, PageHeader } from "@/components/panel/page-header";
import { getAccess } from "@/lib/access";
import { requireBusiness } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatAmount, formatSum } from "@/lib/money";
import { dateInZone, formatDateFull } from "@/lib/time";
import { cn } from "@/lib/utils";

const STATE_STYLE = {
  TRIAL: "bg-accent text-accent-foreground",
  ACTIVE: "bg-success/15 text-success",
  GRACE: "bg-pending/20 text-pending-foreground",
  EXPIRED: "bg-destructive/10 text-destructive",
  BLOCKED: "bg-destructive/10 text-destructive",
} as const;

export default async function BillingPage({ params }: PageProps<"/[locale]/panel/obuna">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const { business, businessId } = await requireBusiness();
  const [t, tl] = await Promise.all([getTranslations("Billing"), getTranslations("Landing")]);
  const now = new Date();
  const access = getAccess(business, now);
  const [payments, activeStaff] = await Promise.all([
    db.payment.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    db.staff.count({ where: { businessId, isActive: true } }),
  ]);
  const tz = business.timezone;
  const instructions =
    (locale === "ru"
      ? process.env.PAYMENT_INSTRUCTIONS_RU
      : process.env.PAYMENT_INSTRUCTIONS_UZ
    )?.trim() ||
    process.env.PAYMENT_INSTRUCTIONS_UZ?.trim() ||
    "";
  const support = supportLink();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />

      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">{t("current")}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-xl font-bold">{t(`planNames.${business.plan}`)}</p>
          <span
            className={cn(
              "rounded-full px-3 py-0.5 text-sm font-semibold",
              STATE_STYLE[access.state],
            )}
          >
            {t(`states.${access.state}`)}
          </span>
        </div>
        <p className="mt-2 text-muted-foreground">
          {t("until", { date: formatDateFull(dateInZone(access.endsAt, tz), locale) })}
          {access.daysLeft > 0 && <> · {t("daysLeft", { days: access.daysLeft })}</>}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("staffLimit", { count: activeStaff, max: access.maxStaff })}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("plans")}</h2>
        <BillingClaim
          initialPlan={business.plan === "START" ? "START" : "PRO"}
          claimedLabel={
            business.paymentClaimedAt
              ? t("claimedAt", {
                  date: formatDateFull(dateInZone(business.paymentClaimedAt, tz), locale),
                })
              : null
          }
          plans={[
            {
              code: "START",
              name: tl("startName"),
              price: formatAmount(PLANS.START.priceSom),
              features: PLAN_FEATURES.START.map((k) => tl(`startFeatures.${k}`)),
            },
            {
              code: "PRO",
              name: tl("proName"),
              price: formatAmount(PLANS.PRO.priceSom),
              features: PLAN_FEATURES.PRO.map((k) => tl(`proFeatures.${k}`)),
            },
          ]}
        />
        {support && (
          <a
            href={support}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center font-medium text-primary underline"
          >
            {t("contact")}
          </a>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <h2 className="mb-2 text-lg font-bold">{t("howToPay")}</h2>
        {instructions ? (
          <p className="whitespace-pre-line">{instructions}</p>
        ) : (
          <p className="text-muted-foreground">{t("noInstructions")}</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("history")}</h2>
        {payments.length === 0 ? (
          <EmptyState title={t("noPayments")} />
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-semibold">{formatSum(p.amount, locale)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateFull(dateInZone(p.createdAt, tz), locale)} ·{" "}
                    {t(`planNames.${p.plan}`)} · {t("days", { count: p.periodDays })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
