"use client";

import { useLocale, useTranslations } from "next-intl";
import { LOCALES } from "@/config/locales";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** UZ | RU segmented switch. Keeps the current page; the choice is stored in a cookie. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Locale");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className={cn("inline-flex rounded-lg bg-muted p-0.5 text-sm font-semibold", className)}
    >
      {LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            replace
            scroll={false}
            hrefLang={locale}
            aria-current={active ? "true" : undefined}
            aria-label={t(`${locale}Full`)}
            className={cn(
              "inline-flex h-10 min-w-11 items-center justify-center rounded-md px-2.5 transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(locale)}
          </Link>
        );
      })}
    </nav>
  );
}
