import { LogIn } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { publicEnv } from "@/config/public-env";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/site/brand-mark";
import { LanguageSwitcher } from "@/components/site/language-switcher";

/** Public header: brand, UZ | RU, "Kirish" (spec 7.0). */
export async function SiteHeader({ showLogin = true }: { showLogin?: boolean }) {
  const t = await getTranslations("Common");
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 font-bold"
          aria-label={publicEnv.brandName}
        >
          <BrandMark />
          <span className="text-lg tracking-tight">{publicEnv.brandName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {showLogin && (
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-accent"
            >
              <LogIn className="size-4" aria-hidden />
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
