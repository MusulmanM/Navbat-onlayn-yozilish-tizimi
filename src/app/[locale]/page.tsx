import { getTranslations, setRequestLocale } from "next-intl/server";
import { publicEnv } from "@/config/public-env";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

// Temporary home page; the full landing page arrives in stage 5.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-sm ring-1 ring-border">
          <p className="text-lg font-semibold">{publicEnv.brandName}</p>
          <span className="mt-4 inline-flex rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            {t("badge")}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-balance">{t("title")}</h1>
          <p className="mt-2 text-base text-pretty text-muted-foreground">{t("subtitle")}</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
