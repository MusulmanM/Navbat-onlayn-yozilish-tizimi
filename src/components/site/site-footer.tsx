import { getTranslations } from "next-intl/server";
import { publicEnv, supportLink } from "@/config/public-env";
import { Link } from "@/i18n/navigation";

/** Footer: © year brand, privacy, terms, Telegram support (spec 7.1). */
export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const support = supportLink();
  const year = new Date().getFullYear();
  const linkClass = "inline-flex min-h-11 items-center hover:text-foreground hover:underline";

  return (
    <footer className="mt-auto border-t bg-muted/50">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {publicEnv.brandName}
        </p>
        <nav className="flex flex-wrap gap-x-5">
          <Link href="/maxfiylik" className={linkClass}>
            {t("privacy")}
          </Link>
          <Link href="/shartlar" className={linkClass}>
            {t("terms")}
          </Link>
          {support && (
            <a href={support} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {t("support")}
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
