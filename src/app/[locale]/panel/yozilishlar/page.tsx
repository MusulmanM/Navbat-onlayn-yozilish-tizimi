import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { BookingRow } from "@/components/panel/booking-row";
import { EmptyState, PageHeader } from "@/components/panel/page-header";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth/guards";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/bookings";
import { db } from "@/lib/db";
import { isValidDateStr } from "@/lib/time";
import { listBookings } from "@/server/panel/queries";
import { toRow } from "@/server/panel/serialize";

const SOURCES = ["WEB", "TELEGRAM", "PANEL"] as const;
const field =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function BookingsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/panel/yozilishlar">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const q = await searchParams;
  const str = (key: string) => (typeof q[key] === "string" ? (q[key] as string) : "");
  const { business, businessId } = await requireBusiness();
  const [t, ts, tsrc, ta] = await Promise.all([
    getTranslations("BookingsPage"),
    getTranslations("Status"),
    getTranslations("Source"),
    getTranslations("Actions"),
  ]);

  const filters = {
    from: isValidDateStr(str("from")) ? str("from") : undefined,
    to: isValidDateStr(str("to")) ? str("to") : undefined,
    staffId: str("staff") || undefined,
    status: (BOOKING_STATUSES as readonly string[]).includes(str("status"))
      ? (str("status") as BookingStatus)
      : undefined,
    source: (SOURCES as readonly string[]).includes(str("source"))
      ? (str("source") as (typeof SOURCES)[number])
      : undefined,
    q: str("q") || undefined,
    page: Math.max(1, Number(str("page")) || 1),
  };
  const [result, staff] = await Promise.all([
    listBookings(business, filters),
    db.staff.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  const now = new Date();
  const rows = result.items.map((b) => toRow(b, locale, business.timezone, now));
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({
      from: filters.from,
      to: filters.to,
      staff: filters.staffId,
      status: filters.status,
      source: filters.source,
      q: filters.q,
    })) {
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    return `/panel/yozilishlar?${params}`;
  };
  const filtered = Object.entries(filters).some(([k, v]) => k !== "page" && v);

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("total", { count: result.total })} />
      {/* Plain GET form: works without JavaScript, filters stay in the URL. */}
      <form
        method="get"
        className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="sm:col-span-2 lg:col-span-2">
          <label htmlFor="f-q" className="mb-1 block text-sm font-medium">
            {ta("search")}
          </label>
          <input
            id="f-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder={t("search")}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="f-from" className="mb-1 block text-sm font-medium">
            {t("from")}
          </label>
          <input
            id="f-from"
            name="from"
            type="date"
            defaultValue={filters.from}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="f-to" className="mb-1 block text-sm font-medium">
            {t("to")}
          </label>
          <input id="f-to" name="to" type="date" defaultValue={filters.to} className={field} />
        </div>
        <div>
          <label htmlFor="f-staff" className="mb-1 block text-sm font-medium">
            {t("staff")}
          </label>
          <select id="f-staff" name="staff" defaultValue={filters.staffId ?? ""} className={field}>
            <option value="">{ta("all")}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="mb-1 block text-sm font-medium">
            {t("status")}
          </label>
          <select id="f-status" name="status" defaultValue={filters.status ?? ""} className={field}>
            <option value="">{ta("all")}</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ts(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-source" className="mb-1 block text-sm font-medium">
            {t("source")}
          </label>
          <select id="f-source" name="source" defaultValue={filters.source ?? ""} className={field}>
            <option value="">{ta("all")}</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {tsrc(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5 lg:justify-end">
          {filtered && (
            <Link
              href="/panel/yozilishlar"
              className="inline-flex h-11 items-center rounded-lg px-4 font-semibold text-muted-foreground hover:bg-muted"
            >
              {t("reset")}
            </Link>
          )}
          <button
            type="submit"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground sm:flex-none"
          >
            {t("apply")}
          </button>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon="🔎" title={t("empty")} text={filtered ? t("emptyText") : undefined} />
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {rows.map((row) => (
            <BookingRow key={row.id} row={row} showDate />
          ))}
        </ul>
      )}

      {result.pages > 1 && (
        <nav
          className="flex items-center justify-center gap-2"
          aria-label={t("page", { page: filters.page, pages: result.pages })}
        >
          {filters.page > 1 && (
            <Link
              href={pageHref(filters.page - 1)}
              className="inline-flex h-11 items-center gap-1 rounded-lg border bg-background px-3 font-semibold"
            >
              <ChevronLeft className="size-4" aria-hidden />
              {ta("prev")}
            </Link>
          )}
          <span className="px-2 text-sm text-muted-foreground">
            {t("page", { page: filters.page, pages: result.pages })}
          </span>
          {filters.page < result.pages && (
            <Link
              href={pageHref(filters.page + 1)}
              className="inline-flex h-11 items-center gap-1 rounded-lg border bg-background px-3 font-semibold"
            >
              {ta("nextPage")}
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
