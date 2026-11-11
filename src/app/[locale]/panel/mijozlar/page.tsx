import { ChevronRight, Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { EmptyState, PageHeader } from "@/components/panel/page-header";
import { TelegramIcon } from "@/components/common/telegram-icon";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth/guards";
import { formatSum } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { dateInZone, formatDayMonth } from "@/lib/time";
import { listClients } from "@/server/panel/queries";

export default async function ClientsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/panel/mijozlar">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.slice(0, 60) : "";
  const page = Math.max(1, Number(query.page) || 1);
  const { business, businessId } = await requireBusiness();
  const t = await getTranslations("ClientsPage");
  const ta = await getTranslations("Actions");
  const { clients, pages } = await listClients(businessId, q, page);

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} />
      <form method="get" role="search" className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t("search")}
          aria-label={t("search")}
          className="h-12 w-full rounded-xl border border-input bg-background pr-24 pl-10 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          className="absolute top-1/2 right-1.5 inline-flex h-9 -translate-y-1/2 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
        >
          {ta("search")}
        </button>
      </form>

      {clients.length === 0 ? (
        <EmptyState
          icon="👥"
          title={q ? t("notFound") : t("empty")}
          text={q ? undefined : t("emptyText")}
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                href={`/panel/mijozlar/${c.id}`}
                className="flex items-center gap-3 p-4 hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="truncate">{c.name}</span>
                    {c.telegramId !== null && (
                      <TelegramIcon className="size-4 shrink-0 text-[#229ED9]" />
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatPhone(c.phone)}</p>
                  <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <div className="flex gap-1">
                      <dt className="text-muted-foreground">{t("visits")}:</dt>
                      <dd className="font-semibold">{c.stats.visits}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt className="text-muted-foreground">{t("lastVisit")}:</dt>
                      <dd className="font-semibold">
                        {c.stats.lastVisit
                          ? formatDayMonth(dateInZone(c.stats.lastVisit, business.timezone), locale)
                          : t("never")}
                      </dd>
                    </div>
                    {c.stats.noShows > 0 && (
                      <div className="flex gap-1 text-destructive">
                        <dt>{t("noShows")}:</dt>
                        <dd className="font-semibold">{c.stats.noShows}</dd>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <dt className="text-muted-foreground">{t("totalPaid")}:</dt>
                      <dd className="font-semibold">{formatSum(c.stats.totalPaid, locale)}</dd>
                    </div>
                  </dl>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav className="flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/panel/mijozlar?page=${page - 1}`}
              className="inline-flex h-11 items-center rounded-lg border bg-background px-4 font-semibold"
            >
              {ta("prev")}
            </Link>
          )}
          <span className="inline-flex h-11 items-center px-2 text-sm text-muted-foreground">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link
              href={`/panel/mijozlar?page=${page + 1}`}
              className="inline-flex h-11 items-center rounded-lg border bg-background px-4 font-semibold"
            >
              {ta("nextPage")}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
