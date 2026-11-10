import { CalendarCheck, Clock3, Globe, Wallet } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { absoluteUrl } from "@/config/public-env";
import { AddBookingButton } from "@/components/panel/add-booking-button";
import { BookingRow } from "@/components/panel/booking-row";
import { CopyButton } from "@/components/panel/copy-button";
import { EmptyState, PageHeader } from "@/components/panel/page-header";
import { requireBusiness } from "@/lib/auth/guards";
import { formatSum } from "@/lib/money";
import { formatDateLong } from "@/lib/time";
import { getTodayData } from "@/server/panel/queries";
import { toRow } from "@/server/panel/serialize";

export default async function TodayPage({ params }: PageProps<"/[locale]/panel">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const { business } = await requireBusiness();
  const t = await getTranslations("Today");
  const now = new Date();
  const data = await getTodayData(business, now);
  const rows = data.todayBookings.map((b) => toRow(b, locale, business.timezone, now));
  const pendingRows = data.pending.map((b) => toRow(b, locale, business.timezone, now));
  const publicLink = absoluteUrl(`/b/${business.slug}`);

  const stats = [
    { icon: CalendarCheck, label: t("statToday"), value: String(data.stats.todayCount) },
    {
      icon: Clock3,
      label: t("statPending"),
      value: String(data.stats.pendingCount),
      warn: data.stats.pendingCount > 0,
    },
    { icon: Wallet, label: t("statWeek"), value: formatSum(data.stats.weekRevenue, locale) },
    { icon: Globe, label: t("statOnline"), value: String(data.stats.monthOnline) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={
          <span className="first-letter:uppercase">{formatDateLong(data.today, locale)}</span>
        }
        actions={<AddBookingButton className="hidden lg:inline-flex" />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, warn }) => (
          <div
            key={label}
            className={`rounded-2xl border bg-card p-4 ${warn ? "border-pending/50 bg-pending/10" : ""}`}
          >
            <Icon className="size-5 text-primary" aria-hidden />
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>
      {data.stats.monthOnline > 0 && (
        <p className="rounded-xl bg-accent px-4 py-3 font-medium text-accent-foreground">
          {t("onlineHint", { count: data.stats.monthOnline })}
        </p>
      )}

      {pendingRows.length > 0 && (
        <section aria-labelledby="pending-title">
          <h2 id="pending-title" className="mb-3 flex items-center gap-2 text-lg font-bold">
            <span className="inline-block size-2.5 rounded-full bg-pending" aria-hidden />
            {t("pendingTitle")}
          </h2>
          <ul className="divide-y overflow-hidden rounded-2xl border border-pending/40 bg-card">
            {pendingRows.map((row) => (
              <BookingRow key={row.id} row={row} showDate />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="today-title">
        <h2 id="today-title" className="mb-3 text-lg font-bold">
          {t("listTitle")}
        </h2>
        {rows.length === 0 ? (
          <EmptyState
            icon="☕"
            title={t("emptyTitle")}
            text={t("emptyText")}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <AddBookingButton />
                <CopyButton text={publicLink} label={t("copyLink")} />
              </div>
            }
          />
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {rows.map((row) => (
              <BookingRow key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
