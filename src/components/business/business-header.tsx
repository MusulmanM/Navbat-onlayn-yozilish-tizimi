import { MapPin, Navigation, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { categoryName, type CategoryCode } from "@/config/categories";
import type { Locale } from "@/config/locales";
import { botStartLink } from "@/config/public-env";
import { InitialAvatar } from "@/components/common/initial-avatar";
import { TelegramIcon } from "@/components/common/telegram-icon";
import type { OpenStatus } from "@/lib/open-status";
import { formatPhone, phoneHref } from "@/lib/phone";
import { weekdayNameAcc } from "@/lib/time";
import { cn } from "@/lib/utils";

type Props = {
  locale: Locale;
  business: {
    slug: string;
    name: string;
    category: CategoryCode;
    address: string;
    district: string;
    landmark: string | null;
    mapUrl: string | null;
    phone: string;
    telegramUsername: string | null;
    instagram: string | null;
    logoUrl: string | null;
  };
  status: OpenStatus;
  showTelegramBooking: boolean;
};

const actionClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted";

export async function BusinessHeader({ locale, business, status, showTelegramBooking }: Props) {
  const t = await getTranslations("Business");
  const statusText = (() => {
    if (status.kind === "open") return t("openNow", { time: status.until });
    if (status.kind === "break") return t("onBreak", { time: status.until });
    if (!status.next) return t("closedNow");
    if (status.next.day === "today") return t("opensToday", { time: status.next.time });
    if (status.next.day === "tomorrow") return t("opensTomorrow", { time: status.next.time });
    return t("opensOn", { day: weekdayNameAcc(status.next.day, locale), time: status.next.time });
  })();
  const isOpen = status.kind === "open";
  const telegramBooking = showTelegramBooking ? botStartLink(`biz_${business.slug}`) : null;
  const telegramUser = business.telegramUsername?.replace(/^@/, "");

  return (
    <section aria-labelledby="business-name" className="space-y-4">
      <div className="flex items-start gap-4">
        {business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external logo, tiny
          <img
            src={business.logoUrl}
            alt=""
            className="size-16 shrink-0 rounded-2xl object-cover"
            width={64}
            height={64}
          />
        ) : (
          <InitialAvatar name={business.name} />
        )}
        <div className="min-w-0 flex-1">
          <h1
            id="business-name"
            className="text-2xl leading-tight font-bold tracking-tight text-balance"
          >
            {business.name}
          </h1>
          <p className="mt-0.5 text-muted-foreground">{categoryName(business.category, locale)}</p>
          <p
            className={cn(
              "mt-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-sm font-medium",
              isOpen ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                isOpen ? "bg-success" : "bg-muted-foreground/60",
              )}
            />
            {statusText}
          </p>
        </div>
      </div>

      <div className="flex gap-2 text-base">
        <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p>
            {business.address}, {business.district}
          </p>
          {business.landmark && (
            <p className="text-sm text-muted-foreground">
              {t("landmark", { landmark: business.landmark })}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={phoneHref(business.phone)} className={actionClass}>
          <Phone className="size-4 text-primary" aria-hidden />
          {t("call")}
          <span className="sr-only">{formatPhone(business.phone)}</span>
        </a>
        {business.mapUrl && (
          <a
            href={business.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass}
          >
            <Navigation className="size-4 text-primary" aria-hidden />
            {t("map")}
          </a>
        )}
        {telegramUser && (
          <a
            href={`https://t.me/${telegramUser}`}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass}
          >
            <TelegramIcon className="size-4 text-[#229ED9]" />
            {t("telegram")}
          </a>
        )}
        {business.instagram && (
          <a
            href={`https://instagram.com/${business.instagram.replace(/^@/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass}
          >
            {t("instagram")}
          </a>
        )}
      </div>

      {telegramBooking && (
        <a
          href={telegramBooking}
          className="flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <TelegramIcon className="size-5 text-[#229ED9]" />
          {t("bookViaTelegram")}
        </a>
      )}
    </section>
  );
}
