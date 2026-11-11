import { getTranslations, setRequestLocale } from "next-intl/server";
import { CATEGORY_CODES, categoryName, type CategoryCode } from "@/config/categories";
import { isLocale, type Locale } from "@/config/locales";
import { REGION_CODES, regionName, type RegionCode } from "@/config/regions";
import { Link } from "@/i18n/navigation";
import type { AccessState } from "@/lib/access";
import { dateInZone, formatDayMonth, formatDateFull } from "@/lib/time";
import { cn } from "@/lib/utils";
import { listBusinessesAdmin } from "@/server/admin";

const STATES: AccessState[] = ["TRIAL", "ACTIVE", "GRACE", "EXPIRED", "BLOCKED"];
const field = "h-11 w-full rounded-lg border border-input bg-background px-3 text-base";
const STATE_STYLE: Record<AccessState, string> = {
  TRIAL: "bg-accent text-accent-foreground",
  ACTIVE: "bg-success/15 text-success",
  GRACE: "bg-pending/20 text-pending-foreground",
  EXPIRED: "bg-destructive/10 text-destructive",
  BLOCKED: "bg-destructive text-white",
};

export default async function AdminBusinessesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/bizneslar">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const q = await searchParams;
  const str = (key: string) => (typeof q[key] === "string" ? (q[key] as string) : "");
  const [t, tb] = await Promise.all([getTranslations("Admin"), getTranslations("Billing")]);
  const filters = {
    q: str("q").slice(0, 60) || undefined,
    state: STATES.includes(str("state") as AccessState) ? (str("state") as AccessState) : undefined,
    category: (CATEGORY_CODES as readonly string[]).includes(str("category"))
      ? (str("category") as CategoryCode)
      : undefined,
    region: (REGION_CODES as readonly string[]).includes(str("region"))
      ? (str("region") as RegionCode)
      : undefined,
    page: Math.max(1, Number(str("page")) || 1),
  };
  const { items, pages, total } = await listBusinessesAdmin(filters);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">
        {t("nav.businesses")} <span className="text-muted-foreground">({total})</span>
      </h1>
      <form
        method="get"
        className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder={t("search")}
          aria-label={t("search")}
          className={cn(field, "lg:col-span-2")}
        />
        <select
          name="state"
          defaultValue={filters.state ?? ""}
          aria-label={t("columns.state")}
          className={field}
        >
          <option value="">{t("allStates")}</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {tb(`states.${s}`)}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          aria-label={t("columns.category")}
          className={field}
        >
          <option value="">{t("allCategories")}</option>
          {CATEGORY_CODES.map((c) => (
            <option key={c} value={c}>
              {categoryName(c, locale)}
            </option>
          ))}
        </select>
        <select
          name="region"
          defaultValue={filters.region ?? ""}
          aria-label={t("columns.region")}
          className={field}
        >
          <option value="">{t("allRegions")}</option>
          {REGION_CODES.map((r) => (
            <option key={r} value={r}>
              {regionName(r, locale)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 rounded-lg bg-primary px-5 font-semibold text-primary-foreground lg:col-start-5"
        >
          {t("apply")}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                {(
                  [
                    "name",
                    "category",
                    "region",
                    "plan",
                    "state",
                    "paidUntil",
                    "bookings30",
                    "created",
                  ] as const
                ).map((c) => (
                  <th key={c} scope="col" className="px-3 py-2.5 font-medium">
                    {t(`columns.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((b) => (
                <tr key={b.id} className="hover:bg-muted/40">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/bizneslar/${b.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {b.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      /b/{b.slug}
                      {b.isDemo ? ` · ${t("demo")}` : ""}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{categoryName(b.category, locale)}</td>
                  <td className="px-3 py-2.5">{regionName(b.region, locale)}</td>
                  <td className="px-3 py-2.5">{b.plan}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        STATE_STYLE[b.access.state],
                      )}
                    >
                      {tb(`states.${b.access.state}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {b.paidUntil
                      ? formatDateFull(dateInZone(b.paidUntil, b.timezone), locale)
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{b.bookings30}</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {formatDayMonth(dateInZone(b.createdAt, b.timezone), locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/bizneslar?${new URLSearchParams({ ...(filters.q ? { q: filters.q } : {}), ...(filters.state ? { state: filters.state } : {}), page: String(p) })}`}
              aria-current={p === filters.page ? "page" : undefined}
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-lg border",
                p === filters.page && "bg-primary text-primary-foreground",
              )}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
