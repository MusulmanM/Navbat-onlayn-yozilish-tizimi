import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Shield } from "lucide-react";
import { isLocale } from "@/config/locales";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { Toaster } from "@/components/ui/sonner";
import { pickMessages } from "@/i18n/client-messages";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Platform admin area (spec 7.7). Only ADMIN_TELEGRAM_IDS get past requireAdmin (404 otherwise).
export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdmin();
  const t = await getTranslations("Admin");
  const messages = await pickMessages([
    "Admin",
    "Billing",
    "Actions",
    "PanelErrors",
    "Common",
    "Locale",
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <header className="sticky top-0 z-30 border-b bg-foreground text-background">
        {/* Two rows on phones (title + language, then navigation), one row on wider screens. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 px-4 py-1.5 sm:h-14 sm:flex-nowrap sm:py-0">
          <Shield className="size-5" aria-hidden />
          <Link href="/admin" className="min-h-11 content-center font-bold whitespace-nowrap">
            {t("title")}
          </Link>
          <nav className="order-last -mx-3 flex w-full gap-1 text-sm sm:order-none sm:mx-0 sm:ml-2 sm:w-auto">
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center rounded-lg px-3 hover:bg-background/10"
            >
              {t("nav.stats")}
            </Link>
            <Link
              href="/admin/bizneslar"
              className="inline-flex min-h-11 items-center rounded-lg px-3 hover:bg-background/10"
            >
              {t("nav.businesses")}
            </Link>
            <Link
              href="/panel"
              className="ml-auto inline-flex min-h-11 items-center rounded-lg px-3 underline sm:hidden"
            >
              {t("toPanel")}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/panel" className="hidden text-sm underline sm:inline">
              {t("toPanel")}
            </Link>
            <LanguageSwitcher className="bg-background/15" />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
      <Toaster />
    </NextIntlClientProvider>
  );
}
