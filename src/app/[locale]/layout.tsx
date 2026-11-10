import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { publicEnv } from "@/config/public-env";
import { BRAND_COLOR } from "@/config/theme";
import { pickMessages } from "@/i18n/client-messages";
import { routing } from "@/i18n/routing";
import "../globals.css";

// Inter covers Latin (incl. ʻ U+02BB, ʼ U+02BC) and Cyrillic; subsets load only when used.
const inter = Inter({ variable: "--font-sans", subsets: ["latin", "cyrillic"], display: "swap" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const brand = publicEnv.brandName;
  return {
    metadataBase: new URL(publicEnv.appUrl),
    title: t("landingTitle", { brand }),
    description: t("landingDescription"),
    applicationName: brand,
    formatDetection: { telephone: false },
    openGraph: { siteName: brand, locale: locale === "ru" ? "ru_RU" : "uz_UZ", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: BRAND_COLOR,
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await pickMessages(["Common", "Locale", "ErrorPage"]);

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
