import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/config/locales";
import { LegalPage } from "@/components/marketing/legal-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/maxfiylik">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: isLocale(locale) ? locale : "uz", namespace: "Legal" });
  return { title: t("privacyTitle") };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/maxfiylik">) {
  const { locale } = await params;
  setRequestLocale(isLocale(locale) ? locale : "uz");
  return (
    <LegalPage kind="privacy" sections={["collect", "why", "who", "keep", "delete", "consent"]} />
  );
}
