import { CalendarPlus, MapPin, Navigation, Phone, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { staffLabel } from "@/config/categories";
import { isLocale } from "@/config/locales";
import { botStartLink } from "@/config/public-env";
import { TelegramIcon } from "@/components/common/telegram-icon";
import { CancelBooking } from "@/components/manage/cancel-booking";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Link } from "@/i18n/navigation";
import { pickMessages } from "@/i18n/client-messages";
import { canClientCancel, isActive } from "@/lib/bookings";
import { formatMoney } from "@/lib/money";
import { formatPhone, phoneHref } from "@/lib/phone";
import { dateInZone, formatDateLong, formatDuration, timeInZone } from "@/lib/time";
import { cn } from "@/lib/utils";
import { getBookingByToken } from "@/server/bookings";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/y/[token]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: isLocale(locale) ? locale : "uz",
    namespace: "Metadata",
  });
  return { title: t("manageTitle"), robots: { index: false, follow: false } };
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-pending/20 text-pending-foreground",
  CONFIRMED: "bg-accent text-accent-foreground",
  COMPLETED: "bg-success/15 text-success",
  NO_SHOW: "bg-destructive/10 text-destructive",
  CANCELLED_BY_CLIENT: "bg-muted text-muted-foreground",
  CANCELLED_BY_BUSINESS: "bg-muted text-muted-foreground",
};

export default async function ManageBookingPage({ params }: PageProps<"/[locale]/y/[token]">) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Manage");
  const tb = await getTranslations("Booking");
  const booking = await getBookingByToken(token);

  if (!booking) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-sm text-center">
            <p className="text-5xl" aria-hidden>
              🔎
            </p>
            <h1 className="mt-4 text-2xl font-bold">{t("notFound")}</h1>
            <p className="mt-2 text-muted-foreground">{t("notFoundText")}</p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const { business } = booking;
  const now = new Date();
  const tz = business.timezone;
  const active = isActive(booking.status) && booking.startsAt > now;
  const cancellable = active && canClientCancel(booking.startsAt, now, business.cancelUntilHours);
  const serviceName =
    locale === "ru"
      ? (booking.service.nameRu ?? booking.serviceNameSnapshot)
      : booking.serviceNameSnapshot;
  const telegramLink =
    active && booking.client.telegramId === null ? botStartLink(`bk_${token}`) : null;
  const rows: Array<[string, string]> = [
    [tb("service"), serviceName],
    [staffLabel(business.category, locale), booking.staff.name],
    [tb("date"), formatDateLong(dateInZone(booking.startsAt, tz), locale)],
    [tb("time"), `${timeInZone(booking.startsAt, tz)}–${timeInZone(booking.endsAt, tz)}`],
    [tb("duration"), formatDuration(booking.durationSnapshot, locale)],
    [tb("price"), formatMoney(booking.priceSnapshot, locale)],
  ];
  const secondary =
    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border bg-background font-semibold transition-colors hover:bg-muted";
  const messages = await pickMessages(["Manage"]);

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-lg flex-1 space-y-5 px-4 py-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t("title")}</p>
          <h1 className="mt-1 text-2xl font-bold">{business.name}</h1>
          <span
            className={cn(
              "mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold",
              STATUS_STYLE[booking.status],
            )}
          >
            {t(`status.${booking.status}`)}
          </span>
          {booking.status === "CANCELLED_BY_BUSINESS" && (
            <p className="mt-2 text-muted-foreground">
              {t("cancelledByBusiness")}
              {booking.cancelReason && booking.cancelReason !== "AUTO_EXPIRED" && (
                <> {t("cancelReasonLabel", { reason: booking.cancelReason })}</>
              )}
            </p>
          )}
        </div>

        <dl className="divide-y rounded-xl border bg-card">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-semibold first-letter:uppercase">{value}</dd>
            </div>
          ))}
          <div className="flex gap-2 px-4 py-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p>
              {business.address}
              {business.landmark && (
                <span className="block text-sm text-muted-foreground">{business.landmark}</span>
              )}
            </p>
          </div>
        </dl>

        <div className="space-y-2.5">
          {telegramLink && (
            <a
              href={telegramLink}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 text-lg font-semibold text-white"
            >
              <TelegramIcon className="size-5" />
              {tb("telegramCta").replace("📲 ", "")}
            </a>
          )}
          {active && (
            <a href={`/api/public/bookings/${token}/ics?locale=${locale}`} className={secondary}>
              <CalendarPlus className="size-5 text-primary" aria-hidden />
              {tb("addToCalendar").replace("📅 ", "")}
            </a>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <a href={phoneHref(business.phone)} className={secondary}>
              <Phone className="size-5 text-primary" aria-hidden />
              {t("call")}
            </a>
            {business.mapUrl ? (
              <a
                href={business.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={secondary}
              >
                <Navigation className="size-5 text-primary" aria-hidden />
                {(await getTranslations("Business"))("map")}
              </a>
            ) : (
              <Link href={`/b/${business.slug}`} className={secondary}>
                {t("toBusiness")}
              </Link>
            )}
          </div>

          {cancellable && (
            <NextIntlClientProvider messages={messages}>
              <CancelBooking token={token} />
            </NextIntlClientProvider>
          )}
          {active && !cancellable && (
            <p className="rounded-xl bg-muted p-4 text-center text-muted-foreground">
              {t("tooLate", {
                hours: business.cancelUntilHours,
                phone: formatPhone(business.phone),
              })}
            </p>
          )}
          {!active && business.isPublished && (
            <Link
              href={`/b/${business.slug}`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"
            >
              <RotateCcw className="size-5" aria-hidden />
              {t("rebook")}
            </Link>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
