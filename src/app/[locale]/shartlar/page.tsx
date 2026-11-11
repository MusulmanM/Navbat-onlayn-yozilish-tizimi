import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/config/locales";
import { LegalPage } from "@/components/marketing/legal-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shartlar">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: isLocale(locale) ? locale : "uz", namespace: "Legal" });
  return { title: t("termsTitle") };
}

export default async function TermsPage({ params }: PageProps<"/[locale]/shartlar">) {
  const { locale } = await params;
  setRequestLocale(isLocale(locale) ? locale : "uz");
  return (
    <LegalPage
      kind="terms"
      sections={["role", "business", "client", "payment", "block", "contact"]}
    />
  );
}
