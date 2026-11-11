import {
  ChevronRight,
  ClipboardList,
  CreditCard,
  ExternalLink,
  LogOut,
  MonitorSmartphone,
  QrCode,
  Scissors,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/config/locales";
import { PageHeader } from "@/components/panel/page-header";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { Link } from "@/i18n/navigation";
import { isCurrentUserAdmin, requireBusiness } from "@/lib/auth/guards";
import { logoutAction, logoutAllAction } from "@/server/actions/account";

// Mobile "Yana" (more) menu: everything that does not fit into the bottom bar.
export default async function MorePage({ params }: PageProps<"/[locale]/panel/yana">) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "uz";
  setRequestLocale(locale);
  const { business, user } = await requireBusiness();
  const [t, tm, admin] = await Promise.all([
    getTranslations("PanelNav"),
    getTranslations("MorePage"),
    isCurrentUserAdmin(),
  ]);
  const links = [
    { href: "/panel/yozilishlar", label: t("bookings"), icon: ClipboardList },
    { href: "/panel/xizmatlar", label: t("services"), icon: Scissors },
    { href: "/panel/ustalar", label: t("staff"), icon: UserRound },
    { href: "/panel/sozlamalar", label: t("settings"), icon: Settings },
    { href: "/panel/qr", label: t("qr"), icon: QrCode },
    { href: "/panel/obuna", label: t("billing"), icon: CreditCard },
    ...(admin ? [{ href: "/admin", label: t("admin"), icon: Shield }] : []),
  ];
  const row = "flex min-h-14 items-center gap-3 px-4 font-medium hover:bg-muted/60";

  return (
    <div className="space-y-5">
      <PageHeader title={tm("title")} description={business.name} />
      <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className={row}>
              <Icon className="size-5 text-primary" aria-hidden />
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
        <li>
          <a
            href={`${locale === "ru" ? "/ru" : ""}/b/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={row}
          >
            <ExternalLink className="size-5 text-primary" aria-hidden />
            <span className="flex-1">{t("myPage")}</span>
          </a>
        </li>
      </ul>
      <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-2">
        <span className="font-medium">{tm("language")}</span>
        <LanguageSwitcher />
      </div>
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          {tm("account")} · {user.firstName}
          {user.telegramUsername ? ` (@${user.telegramUsername})` : ""}
        </h2>
        <div className="divide-y overflow-hidden rounded-2xl border bg-card">
          <form action={logoutAction}>
            <button type="submit" className={`${row} w-full text-left`}>
              <LogOut className="size-5 text-muted-foreground" aria-hidden />
              {t("logout")}
            </button>
          </form>
          <form action={logoutAllAction}>
            <button type="submit" className={`${row} w-full text-left text-destructive`}>
              <MonitorSmartphone className="size-5" aria-hidden />
              {t("logoutAll")}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
