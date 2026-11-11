import { ArrowLeft, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { AddBookingButton } from "@/components/panel/add-booking-button";
import { BookingRow } from "@/components/panel/booking-row";
import { ClientNotes } from "@/components/panel/client-notes";
import { EmptyState } from "@/components/panel/page-header";
import { TelegramIcon } from "@/components/common/telegram-icon";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth/guards";
import { formatSum } from "@/lib/money";
import { formatPhone, phoneHref } from "@/lib/phone";
import { dateInZone, formatDayMonth } from "@/lib/time";
import { getClientDetails } from "@/server/panel/queries";
import { toRow } from "@/server/panel/serialize";

export default async function ClientPage({ params }: PageProps<"/[locale]/panel/mijozlar/[id]">) {
  const { locale: raw, id } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const { business, businessId } = await requireBusiness();
  const data = await getClientDetails(businessId, id);
  if (!data) notFound();
  const t = await getTranslations("ClientsPage");
  const { client, stats } = data;
  const now = new Date();
  const rows = data.bookings.map((b) => toRow(b, locale, business.timezone, now));
  const telegram = client.telegramId !== null;

  const cards = [
    { label: t("visits"), value: String(stats.visits) },
    { label: t("noShows"), value: String(stats.noShows) },
    { label: t("totalPaid"), value: formatSum(stats.totalPaid, locale) },
    {
      label: t("lastVisit"),
      value: stats.lastVisit
        ? formatDayMonth(dateInZone(stats.lastVisit, business.timezone), locale)
        : t("never"),
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/panel/mijozlar"
        className="inline-flex min-h-11 items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>
      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <h1 className="text-2xl font-bold">{client.name}</h1>
        <p className="text-muted-foreground">{formatPhone(client.phone)}</p>
        <p
          className={`mt-2 flex items-center gap-1.5 text-sm ${telegram ? "text-primary" : "text-muted-foreground"}`}
        >
          <TelegramIcon className="size-4" />
          {telegram ? t("telegramLinked") : t("telegramNotLinked")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={phoneHref(client.phone)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border bg-background px-4 font-semibold hover:bg-muted"
          >
            <Phone className="size-4" aria-hidden />
            {t("call")}
          </a>
          <AddBookingButton
            prefill={{
              client: { id: client.id, name: client.name, phone: client.phone, telegram },
            }}
            label={t("addBooking")}
          />
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4">
            <p className="text-xl font-bold tabular-nums">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <ClientNotes id={client.id} name={client.name} notes={client.notes} />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">{t("history")}</h2>
        {rows.length === 0 ? (
          <EmptyState title={t("noHistory")} />
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {rows.map((row) => (
              <BookingRow key={row.id} row={row} showDate />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
