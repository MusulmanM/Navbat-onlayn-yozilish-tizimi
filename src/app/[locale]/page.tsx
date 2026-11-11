import {
  BarChart3,
  BellRing,
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  Languages,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { PLANS } from "@/config/plans";
import { absoluteUrl, publicEnv, supportLink } from "@/config/public-env";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Link } from "@/i18n/navigation";
import { formatAmount } from "@/lib/money";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: isLocale(locale) ? locale : "uz",
    namespace: "Metadata",
  });
  return {
    title: t("landingTitle", { brand: publicEnv.brandName }),
    description: t("landingDescription"),
    alternates: {
      canonical: absoluteUrl(locale === "ru" ? "/ru" : "/"),
      languages: { uz: absoluteUrl("/"), ru: absoluteUrl("/ru") },
    },
  };
}

const primaryCta =
  "inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-6 text-lg font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90";
const secondaryCta =
  "inline-flex h-14 items-center justify-center rounded-2xl border-2 border-primary/30 bg-background px-6 text-lg font-semibold text-primary transition-colors hover:border-primary";

// Landing page for business owners (spec 7.1). Fully server-rendered, almost no JavaScript.
export default async function LandingPage({ params }: PageProps<"/[locale]">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const t = await getTranslations("Landing");
  const support = supportLink();

  const problems = ["phone", "noshow", "notebook"] as const;
  const features = [
    { key: "f1", icon: Clock },
    { key: "f2", icon: BellRing },
    { key: "f3", icon: CalendarClock },
    { key: "f4", icon: Users },
    { key: "f5", icon: BarChart3 },
    { key: "f6", icon: Languages },
  ] as const;
  const plans = [
    {
      key: "start",
      name: t("startName"),
      price: PLANS.START.priceSom,
      features: t.raw("startFeatures") as string[],
      highlight: false,
    },
    {
      key: "pro",
      name: t("proName"),
      price: PLANS.PRO.priceSom,
      features: t.raw("proFeatures") as string[],
      highlight: true,
    },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="overflow-hidden bg-gradient-to-b from-accent/60 to-background">
          <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 pt-10 pb-16 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
            <div>
              <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-4 text-lg text-pretty text-muted-foreground">{t("heroText")}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className={primaryCta}>
                  {t("ctaStart")}
                </Link>
                <Link href="/b/demo-barber" className={secondaryCta}>
                  {t("ctaDemo")}
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{t("heroNote")}</p>
            </div>
            <PhoneMockup />
          </div>
        </section>

        {/* Problems */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center text-3xl font-bold">{t("problemsTitle")}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p} className="rounded-2xl border bg-card p-5">
                <p className="text-lg font-bold">{t(`problems.${p}Title`)}</p>
                <p className="mt-2 text-muted-foreground">{t(`problems.${p}Text`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-muted/50">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 className="text-center text-3xl font-bold">{t("howTitle")}</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex gap-4">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {n}
                  </span>
                  <div>
                    <p className="text-lg font-bold">{t(`how.${n}title`)}</p>
                    <p className="mt-1 text-muted-foreground">{t(`how.${n}text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center text-3xl font-bold">{t("featuresTitle")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ key, icon: Icon }) => (
              <div key={key} className="rounded-2xl border bg-card p-5">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-6" aria-hidden />
                </span>
                <p className="mt-3 text-lg font-bold">{t(`features.${key}title`)}</p>
                <p className="mt-1 text-muted-foreground">{t(`features.${key}text`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-muted/50" id="narxlar">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 className="text-center text-3xl font-bold">{t("pricingTitle")}</h2>
            <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.key}
                  className={cn(
                    "relative rounded-2xl border-2 bg-card p-6",
                    plan.highlight ? "border-primary shadow-lg" : "border-border",
                  )}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-sm font-semibold text-primary-foreground">
                      {t("popular")}
                    </span>
                  )}
                  <p className="text-xl font-bold">{plan.name}</p>
                  <p className="mt-2">
                    <span className="text-3xl font-extrabold tabular-nums">
                      {formatAmount(plan.price)}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {locale === "uz" ? "soʻm" : "сум"}
                      {t("perMonth")}
                    </span>
                  </p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={cn(
                      plan.highlight ? primaryCta : secondaryCta,
                      "mt-6 h-12 w-full text-base",
                    )}
                  >
                    {t("ctaStart")}
                  </Link>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-xl text-center text-muted-foreground">
              {t("pricingNote")}
              {support && (
                <>
                  {" "}
                  <a
                    href={support}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary underline"
                  >
                    Telegram
                  </a>
                </>
              )}
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-center text-3xl font-bold">{t("faqTitle")}</h2>
          <div className="mt-8 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <details key={n} className="group rounded-2xl border bg-card">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {t(`faq.q${n}`)}
                  <ChevronDown
                    className="size-5 shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="px-5 pb-5 text-muted-foreground">{t(`faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final call to action */}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-14 text-center">
            <h2 className="text-3xl font-bold text-balance">{t("finalTitle")}</h2>
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-background px-8 text-lg font-semibold text-primary shadow-sm hover:bg-background/90"
            >
              {t("finalButton")}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
