import { getTranslations } from "next-intl/server";
import { publicEnv } from "@/config/public-env";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

/** Privacy policy / terms (spec 7.8) with the "draft" notice on top. */
export async function LegalPage({
  kind,
  sections,
}: {
  kind: "privacy" | "terms";
  sections: string[];
}) {
  const t = await getTranslations("Legal");
  const values = {
    brand: publicEnv.brandName,
    support: publicEnv.supportTelegram ? `@${publicEnv.supportTelegram}` : "Telegram",
  };
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p
          role="note"
          className="mb-6 rounded-xl border border-pending/50 bg-pending/15 px-4 py-3 font-medium text-pending-foreground"
        >
          ⚠️ {t("draft")}
        </p>
        <article className="space-y-6">
          <h1 className="text-3xl font-bold">
            {t(kind === "privacy" ? "privacyTitle" : "termsTitle")}
          </h1>
          <p className="text-lg">{t(`${kind}.intro`, values)}</p>
          {sections.map((section) => (
            <section key={section}>
              <h2 className="mb-2 text-xl font-bold">{t(`${kind}.${section}Title`)}</h2>
              <p className="leading-relaxed text-muted-foreground">
                {t(`${kind}.${section}`, values)}
              </p>
            </section>
          ))}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
