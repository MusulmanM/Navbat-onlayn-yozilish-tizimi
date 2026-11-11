import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check } from "lucide-react";
import { isLocale, type Locale } from "@/config/locales";
import { absoluteUrl, botStartLink, publicEnv } from "@/config/public-env";
import { SERVICE_TEMPLATES } from "@/config/service-templates";
import { initialBusinessValues } from "@/components/onboarding/business-values";
import {
  BusinessStep,
  DoneStep,
  HoursStep,
  ServicesStep,
  StaffStep,
} from "@/components/onboarding/wizard-steps";
import { BrandMark } from "@/components/site/brand-mark";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { Toaster } from "@/components/ui/sonner";
import { pickMessages } from "@/i18n/client-messages";
import { redirect } from "@/i18n/navigation";
import { getAccess } from "@/lib/access";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { defaultWeeklySchedule, parseWeeklySchedule } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "@/server/panel/onboarding";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

export default async function OnboardingPage({
  params,
  searchParams,
}: PageProps<"/[locale]/onboarding">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);
  const query = await searchParams;
  const user = await requireUser();
  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      business: {
        include: {
          services: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
          staff: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: { services: { select: { serviceId: true } } },
          },
        },
      },
    },
  });
  const business = membership?.business ?? null;
  if (business && business.onboardingStep === null) redirect({ href: "/panel", locale });

  const reached = business?.onboardingStep ?? 1;
  const requested = Number(query.step);
  const step =
    Number.isInteger(requested) && requested >= 1 && requested <= reached ? requested : reached;
  const t = await getTranslations("Onboarding");
  const messages = await pickMessages([
    "Onboarding",
    "Schedule",
    "Settings",
    "StaffPage",
    "Actions",
    "PanelErrors",
    "Common",
    "Locale",
  ]);

  const titles: Record<number, string> = {
    1: t("businessTitle"),
    2: t("hoursTitle"),
    3: t("servicesTitle"),
    4: t("staffTitle"),
    5: t("doneTitle"),
  };
  const hints: Record<number, string | undefined> = {
    2: t("hoursHint"),
    3: t("servicesHint"),
    4: t("staffHint"),
  };

  let content: React.ReactNode = null;
  if (step === 1 || !business) {
    content = <BusinessStep initial={initialBusinessValues(business)} locale={locale} />;
  } else if (step === 2) {
    content = (
      <HoursStep
        initial={parseWeeklySchedule(business.weeklySchedule ?? defaultWeeklySchedule())}
        locale={locale}
      />
    );
  } else if (step === 3) {
    const initial =
      business.services.length > 0
        ? business.services.map((s) => ({
            key: s.id,
            id: s.id,
            nameUz: s.nameUz,
            nameRu: s.nameRu,
            durationMinutes: s.durationMinutes,
            price: s.price,
            priceIsFrom: s.priceIsFrom,
          }))
        : SERVICE_TEMPLATES[business.category].map((tpl, i) => ({
            key: `tpl-${i}`,
            nameUz: tpl.nameUz,
            nameRu: tpl.nameRu,
            durationMinutes: tpl.durationMinutes,
            price: tpl.price,
            priceIsFrom: tpl.priceIsFrom ?? false,
          }));
    content = <ServicesStep initial={initial} />;
  } else if (step === 4) {
    const services = business.services.map((s) => ({
      id: s.id,
      name: locale === "ru" ? (s.nameRu ?? s.nameUz) : s.nameUz,
    }));
    const initial =
      business.staff.length > 0
        ? business.staff.map((s) => ({
            key: s.id,
            id: s.id,
            name: s.name,
            position: s.position ?? "",
            serviceIds: s.services.map((x) => x.serviceId),
          }))
        : [
            {
              key: "owner",
              name: user.firstName === "—" ? "" : user.firstName,
              position: "",
              serviceIds: services.map((s) => s.id),
            },
          ];
    content = (
      <StaffStep
        initial={initial}
        services={services}
        maxStaff={getAccess(business, new Date()).maxStaff}
      />
    );
  } else {
    const pagePath = `${locale === "ru" ? "/ru" : ""}/b/${business.slug}`;
    content = (
      <DoneStep
        link={absoluteUrl(`/b/${business.slug}`)}
        telegramLink={botStartLink(`biz_${business.slug}`)}
        slug={business.slug}
        pagePath={pagePath}
      />
    );
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
          <span className="flex items-center gap-2 font-bold">
            <BrandMark />
            {publicEnv.brandName}
          </span>
          <LanguageSwitcher />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {step === 1 && (
          <div className="mb-5">
            <p className="text-2xl font-bold">{t("welcome", { name: user.firstName })}</p>
            <p className="text-muted-foreground">{t("intro")}</p>
          </div>
        )}
        <ol
          className="mb-6 grid grid-cols-5 gap-1.5"
          aria-label={t("stepLabel", { current: step, total: ONBOARDING_STEPS })}
        >
          {Array.from({ length: ONBOARDING_STEPS }, (_, i) => i + 1).map((n) => (
            <li key={n} className="min-w-0">
              <span
                className={cn(
                  "block h-1.5 rounded-full",
                  n < step ? "bg-primary" : n === step ? "bg-primary/60" : "bg-muted",
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "mt-1.5 flex items-center gap-1 truncate text-xs",
                  n === step ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
                aria-current={n === step ? "step" : undefined}
              >
                {n < step && <Check className="size-3 shrink-0 text-primary" aria-hidden />}
                {t(`steps.${n}`)}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-sm font-medium text-muted-foreground">
          {t("stepLabel", { current: step, total: ONBOARDING_STEPS })}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{titles[step]}</h1>
        {hints[step] && <p className="mt-1 text-muted-foreground">{hints[step]}</p>}
        <div className="mt-5">{content}</div>
      </main>
      <Toaster />
    </NextIntlClientProvider>
  );
}
