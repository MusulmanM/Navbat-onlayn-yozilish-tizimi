import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { absoluteUrl, botStartLink } from "@/config/public-env";
import { PageHeader } from "@/components/panel/page-header";
import {
  HoursForm,
  LinkSettings,
  NotificationsForm,
  ProfileForm,
  RulesForm,
} from "@/components/panel/settings-forms";
import { TimeOffList } from "@/components/panel/time-off-list";
import { initialBusinessValues } from "@/components/onboarding/business-values";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { parseWeeklySchedule } from "@/lib/schedule";
import { dateInZone } from "@/lib/time";
import { cn } from "@/lib/utils";
import { publishRequirements } from "@/server/panel/catalog";
import { timeOffLabel } from "@/server/panel/time-off-labels";

const TABS = ["profile", "hours", "rules", "notifications", "link"] as const;
type Tab = (typeof TABS)[number];

export default async function SettingsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/panel/sozlamalar">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const query = await searchParams;
  const tab: Tab = TABS.includes(query.tab as Tab) ? (query.tab as Tab) : "profile";
  const { business, user, businessId } = await requireBusiness();
  const t = await getTranslations("Settings");
  const now = new Date();

  let content: React.ReactNode = null;
  if (tab === "profile") {
    content = (
      <ProfileForm
        locale={locale}
        initial={{
          ...initialBusinessValues(business),
          mapUrl: business.mapUrl ?? "",
          instagram: business.instagram ?? "",
          telegramUsername: business.telegramUsername ?? "",
          description: business.description ?? "",
        }}
      />
    );
  } else if (tab === "hours") {
    const closures = await db.timeOff.findMany({
      where: { businessId, staffId: null, endsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
    });
    content = (
      <div className="space-y-8">
        <HoursForm initial={parseWeeklySchedule(business.weeklySchedule)} locale={locale} />
        <section>
          <h2 className="text-lg font-bold">{t("closures")}</h2>
          <p className="mb-3 text-sm text-muted-foreground">{t("closuresHint")}</p>
          <TimeOffList
            staffId={null}
            today={dateInZone(now, business.timezone)}
            emptyText={t("closuresEmpty")}
            addLabel={t("addClosure")}
            items={closures.map((c) => ({
              id: c.id,
              label: timeOffLabel(c.startsAt, c.endsAt, business.timezone, locale),
              reason: c.reason,
            }))}
          />
        </section>
      </div>
    );
  } else if (tab === "rules") {
    content = (
      <RulesForm
        initial={{
          slotStepMinutes: ([15, 30, 60].includes(business.slotStepMinutes)
            ? business.slotStepMinutes
            : 30) as 15 | 30 | 60,
          minLeadMinutes: business.minLeadMinutes,
          maxDaysAhead: business.maxDaysAhead,
          autoConfirm: business.autoConfirm,
          cancelUntilHours: business.cancelUntilHours,
        }}
      />
    );
  } else if (tab === "notifications") {
    const membership = await db.membership.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
    });
    content = (
      <NotificationsForm
        initial={{
          reminder24h: business.reminder24h,
          reminder2h: business.reminder2h,
          ownerNotify: membership?.notify ?? true,
        }}
      />
    );
  } else {
    const req = await publishRequirements(businessId);
    content = (
      <LinkSettings
        webLink={absoluteUrl(`/b/${business.slug}`)}
        telegramLink={botStartLink(`biz_${business.slug}`)}
        pagePath={`${locale === "ru" ? "/ru" : ""}/b/${business.slug}`}
        slug={business.slug}
        published={business.isPublished}
        hasService={req.hasService}
        hasStaff={req.hasStaff}
      />
    );
  }

  return (
    <div>
      <PageHeader title={t("title")} />
      <nav
        aria-label={t("title")}
        className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b px-4 [scrollbar-width:none]"
      >
        {TABS.map((key) => (
          <Link
            key={key}
            href={`/panel/sozlamalar?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 font-semibold whitespace-nowrap",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`tabs.${key}`)}
          </Link>
        ))}
      </nav>
      <div className="max-w-3xl">{content}</div>
    </div>
  );
}
