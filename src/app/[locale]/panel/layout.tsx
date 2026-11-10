import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { staffLabel } from "@/config/categories";
import { isLocale } from "@/config/locales";
import { publicEnv } from "@/config/public-env";
import { PanelShell } from "@/components/panel/panel-shell";
import { pickMessages } from "@/i18n/client-messages";
import { Link, redirect } from "@/i18n/navigation";
import { getAccess } from "@/lib/access";
import { isCurrentUserAdmin, requireBusiness } from "@/lib/auth/guards";
import { formatMoney } from "@/lib/money";
import { dateInZone } from "@/lib/time";
import { getBookingOptions, pendingCount } from "@/server/panel/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const PANEL_NAMESPACES = [
  "Common",
  "Locale",
  "Actions",
  "PanelErrors",
  "PanelNav",
  "Status",
  "Source",
  "AddBooking",
  "BookingActions",
  "Today",
  "Calendar",
  "BookingsPage",
  "ClientsPage",
  "Services",
  "StaffPage",
  "Schedule",
  "Settings",
  "Qr",
  "Billing",
  "MorePage",
];

export default async function PanelLayout({ children, params }: LayoutProps<"/[locale]/panel">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const ctx = await requireBusiness();
  if (ctx.business.onboardingStep !== null) redirect({ href: "/onboarding", locale });

  const now = new Date();
  const [pending, options, admin, messages, t] = await Promise.all([
    pendingCount(ctx.businessId, now),
    getBookingOptions(ctx.businessId),
    isCurrentUserAdmin(),
    pickMessages(PANEL_NAMESPACES),
    getTranslations("Banner"),
  ]);
  const access = getAccess(ctx.business, now);

  const banners: Array<{
    tone: "warn" | "danger" | "info";
    text: string;
    href: string;
    cta: string;
  }> = [];
  if (access.state === "TRIAL" && access.daysLeft <= 3)
    banners.push({
      tone: "warn",
      text: t("trialEnds", { days: access.daysLeft }),
      href: "/panel/obuna",
      cta: t("pay"),
    });
  if (access.state === "GRACE")
    banners.push({
      tone: "warn",
      text: t("graceEnds", { days: access.daysLeft }),
      href: "/panel/obuna",
      cta: t("pay"),
    });
  if (access.state === "EXPIRED")
    banners.push({ tone: "danger", text: t("expired"), href: "/panel/obuna", cta: t("pay") });
  if (access.state === "BLOCKED")
    banners.push({ tone: "danger", text: t("blocked"), href: "/panel/obuna", cta: t("pay") });
  if (!ctx.business.isPublished)
    banners.push({
      tone: "info",
      text: t("unpublished"),
      href: "/panel/sozlamalar?tab=link",
      cta: t("publish"),
    });

  const banner =
    banners.length > 0 ? (
      <div className="space-y-px">
        {banners.map((b) => (
          <div
            key={b.text}
            role="status"
            className={
              b.tone === "danger"
                ? "bg-destructive text-white"
                : b.tone === "warn"
                  ? "bg-pending text-pending-foreground"
                  : "bg-accent text-accent-foreground"
            }
          >
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 lg:px-8">
              <p className="font-medium">{b.text}</p>
              <Link
                href={b.href}
                className="inline-flex h-9 items-center rounded-lg bg-background/90 px-3 text-sm font-semibold text-foreground hover:bg-background"
              >
                {b.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <NextIntlClientProvider messages={messages}>
      <PanelShell
        pendingCount={pending}
        isAdmin={admin}
        brandName={publicEnv.brandName}
        banner={banner}
        info={{
          locale,
          businessName: ctx.business.name,
          slug: ctx.business.slug,
          timezone: ctx.business.timezone,
          today: dateInZone(now, ctx.business.timezone),
          staffLabel: staffLabel(ctx.business.category, locale),
          services: options.services.map((s) => ({
            id: s.id,
            name: locale === "ru" ? (s.nameRu ?? s.nameUz) : s.nameUz,
            durationMinutes: s.durationMinutes,
            priceLabel: formatMoney(s.price, locale, s.priceIsFrom),
            staffIds: s.staff.map((x) => x.staffId),
          })),
          staff: options.staff,
        }}
      >
        {children}
      </PanelShell>
    </NextIntlClientProvider>
  );
}
