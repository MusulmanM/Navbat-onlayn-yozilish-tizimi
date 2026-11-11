import QRCode from "qrcode";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { categoryName } from "@/config/categories";
import { isLocale, type Locale } from "@/config/locales";
import { absoluteUrl, publicEnv } from "@/config/public-env";
import { PageHeader } from "@/components/panel/page-header";
import { PrintButton } from "@/components/panel/print-button";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

// Printable QR poster (spec 7.6): name, call to action, big QR, hint, small brand.
export default async function QrPosterPage({
  params,
  searchParams,
}: PageProps<"/[locale]/panel/qr">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const query = await searchParams;
  const size = query.size === "a4" ? "a4" : "a5";
  const { business } = await requireBusiness();
  const t = await getTranslations("Qr");
  const link = absoluteUrl(`/b/${business.slug}`);
  const svg = await QRCode.toString(link, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  const qrSrc = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const shortLink = link.replace(/^https?:\/\//, "");

  return (
    <div>
      <style>{`@media print { @page { size: ${size === "a4" ? "A4" : "A5"} portrait; margin: 0; } body { background: #fff !important; } }`}</style>
      <div className="print:hidden">
        <PageHeader title={t("title")} description={t("hint")} />
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <PrintButton label={t("print")} />
          <div
            className="inline-flex rounded-xl bg-muted p-1 text-sm font-semibold"
            role="group"
            aria-label={t("size")}
          >
            {(["a5", "a4"] as const).map((s) => (
              <Link
                key={s}
                href={`/panel/qr?size=${s}`}
                aria-current={size === s ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-lg px-4 uppercase",
                  size === s ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <article
        className={cn(
          "mx-auto flex flex-col items-center justify-between rounded-2xl border bg-white p-8 text-center text-slate-900 shadow-sm",
          "aspect-[1/1.414] w-full max-w-md",
          "print:m-0 print:h-screen print:max-w-none print:rounded-none print:border-0 print:p-[12mm] print:shadow-none",
        )}
      >
        <header>
          <p className="text-3xl leading-tight font-extrabold print:text-[11mm]">{business.name}</p>
          <p className="mt-1 text-lg text-slate-600 print:text-[5mm]">
            {categoryName(business.category, locale)}
          </p>
        </header>
        <div className="flex flex-col items-center">
          <p className="mb-4 rounded-full bg-primary px-5 py-2 text-xl font-bold text-white print:text-[7mm]">
            {t("headline")}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated QR */}
          <img
            src={qrSrc}
            alt={link}
            className="aspect-square w-3/4 max-w-80 print:w-[70%] print:max-w-none"
          />
          <p className="mt-4 text-lg font-semibold print:text-[5.5mm]">📱 {t("scan")}</p>
          <p className="mt-1 text-sm text-slate-600 print:text-[4mm]">
            {t("orOpen")} <span className="font-mono font-semibold">{shortLink}</span>
          </p>
        </div>
        <footer className="text-sm text-slate-500 print:text-[3.5mm]">{publicEnv.brandName}</footer>
      </article>
    </div>
  );
}
