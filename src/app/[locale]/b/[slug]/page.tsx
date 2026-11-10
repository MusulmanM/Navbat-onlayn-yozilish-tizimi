import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { categoryName, staffLabel, staffLabelAcc } from "@/config/categories";
import { isLocale, type Locale } from "@/config/locales";
import { absoluteUrl, publicEnv } from "@/config/public-env";
import { BookingWidget } from "@/components/booking/booking-widget";
import { BusinessHeader } from "@/components/business/business-header";
import { WeeklyHours } from "@/components/business/weekly-hours";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { pickMessages } from "@/i18n/client-messages";
import { canAcceptOnlineBookings, getAccess } from "@/lib/access";
import { formatMoney } from "@/lib/money";
import { getOpenStatus } from "@/lib/open-status";
import { formatPhone } from "@/lib/phone";
import { DAY_KEYS, parseWeeklySchedule } from "@/lib/schedule";
import { formatDuration, zonedParts } from "@/lib/time";
import { getUpcomingClosures } from "@/server/public-business";
import { loadBusiness } from "./data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/b/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const business = await loadBusiness(slug);
  if (!business || !isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const serviceNames = business.services
    .slice(0, 5)
    .map((s) => (locale === "ru" ? (s.nameRu ?? s.nameUz) : s.nameUz))
    .join(", ");
  const title = t("businessTitle", { name: business.name, district: business.district });
  const description = t("businessDescription", {
    category: categoryName(business.category, locale),
    address: business.address,
    services: serviceNames,
  });
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`${locale === "ru" ? "/ru" : ""}/b/${slug}`),
      languages: { uz: absoluteUrl(`/b/${slug}`), ru: absoluteUrl(`/ru/b/${slug}`) },
    },
    openGraph: { title, description, type: "website" },
    robots: business.isDemo ? { index: false } : undefined,
  };
}

export default async function BusinessPage({
  params,
  searchParams,
}: PageProps<"/[locale]/b/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  const query = await searchParams;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  setRequestLocale(locale);

  const business = await loadBusiness(slug);
  if (!business) notFound();

  const t = await getTranslations("Business");
  const now = new Date();
  const telegramMode = query.src === "tg";
  const bookingDisabled = !canAcceptOnlineBookings(getAccess(business, now).state);
  const schedule = parseWeeklySchedule(business.weeklySchedule);
  const closures = await getUpcomingClosures(business.id, now);
  const status = getOpenStatus(
    schedule,
    now,
    business.timezone,
    closures.map((c) => ({ start: c.startsAt, end: c.endsAt })),
  );
  const todayParts = zonedParts(now, business.timezone);
  const initialServiceId = typeof query.s === "string" ? query.s : undefined;

  const services = business.services.map((s) => ({
    id: s.id,
    name: locale === "ru" ? (s.nameRu ?? s.nameUz) : s.nameUz,
    description: (locale === "ru" ? (s.descriptionRu ?? s.descriptionUz) : s.descriptionUz) ?? null,
    durationLabel: formatDuration(s.durationMinutes, locale),
    priceLabel: formatMoney(s.price, locale, s.priceIsFrom),
    staffIds: s.staff.map((link) => link.staffId),
  }));
  const messages = await pickMessages(["Booking", "Business", "Common"]);

  return (
    <>
      {!telegramMode && <SiteHeader />}
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        {business.isDemo && (
          <p className="rounded-lg bg-pending/15 px-3 py-2 text-sm font-medium text-pending-foreground">
            {t("demoNotice")}
          </p>
        )}
        <BusinessHeader
          locale={locale}
          business={business}
          status={status}
          showTelegramBooking={!telegramMode && !bookingDisabled}
        />
        <WeeklyHours schedule={schedule} locale={locale} todayWeekday={todayParts.weekday} />
        <NextIntlClientProvider messages={messages}>
          <BookingWidget
            slug={business.slug}
            locale={locale}
            today={todayParts.date}
            businessName={business.name}
            phone={business.phone}
            phoneLabel={formatPhone(business.phone)}
            address={[business.address, business.landmark].filter(Boolean).join(", ")}
            staffLabel={staffLabel(business.category, locale)}
            staffAcc={staffLabelAcc(business.category, locale)}
            services={services}
            staff={business.staff}
            bookingDisabled={bookingDisabled}
            initialServiceId={initialServiceId}
            telegramMode={telegramMode}
          />
        </NextIntlClientProvider>
        {business.description && (
          <p className="text-base whitespace-pre-line text-muted-foreground">
            {business.description}
          </p>
        )}
      </main>
      {!telegramMode && <SiteFooter />}
      <BusinessJsonLd
        business={business}
        schedule={schedule}
        url={absoluteUrl(`/b/${business.slug}`)}
      />
    </>
  );
}

const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** schema.org LocalBusiness (spec 13). `<` is escaped so no user text can close the tag. */
function BusinessJsonLd({
  business,
  schedule,
  url,
}: {
  business: {
    name: string;
    address: string;
    district: string;
    phone: string;
    latitude: number | null;
    longitude: number | null;
    description: string | null;
  };
  schedule: ReturnType<typeof parseWeeklySchedule>;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    url,
    telephone: business.phone,
    description: business.description ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: business.district,
      addressCountry: "UZ",
    },
    geo:
      business.latitude !== null && business.longitude !== null
        ? { "@type": "GeoCoordinates", latitude: business.latitude, longitude: business.longitude }
        : undefined,
    openingHoursSpecification: DAY_KEYS.filter((key) => schedule[key].open).map((key) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAYS[DAY_KEYS.indexOf(key)],
      opens: schedule[key].start,
      closes: schedule[key].end,
    })),
    brand: publicEnv.brandName || undefined,
  };
  return (
    <script
      type="application/ld+json"
      // JSON-LD; "<" is escaped so user text cannot close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
