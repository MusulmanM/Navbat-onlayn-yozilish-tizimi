"use client";

import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  ExternalLink,
  House,
  LogOut,
  Menu as MenuIcon,
  Plus,
  QrCode,
  Scissors,
  Settings,
  Shield,
  Users,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/site/brand-mark";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { PanelProvider, usePanel, type PanelInfo } from "@/components/panel/panel-context";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/account";
import { Toaster } from "@/components/ui/sonner";

type NavItem = { href: string; key: string; icon: typeof House; exact?: boolean };

const MAIN: NavItem[] = [
  { href: "/panel", key: "today", icon: House, exact: true },
  { href: "/panel/kalendar", key: "calendar", icon: CalendarDays },
  { href: "/panel/yozilishlar", key: "bookings", icon: ClipboardList },
  { href: "/panel/mijozlar", key: "clients", icon: Users },
  { href: "/panel/xizmatlar", key: "services", icon: Scissors },
  { href: "/panel/ustalar", key: "staff", icon: UserRound },
  { href: "/panel/sozlamalar", key: "settings", icon: Settings },
  { href: "/panel/qr", key: "qr", icon: QrCode },
  { href: "/panel/obuna", key: "billing", icon: CreditCard },
];

function isActive(pathname: string, item: NavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-pending px-1.5 text-xs font-bold text-pending-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function PanelShell({
  info,
  pendingCount,
  isAdmin,
  brandName,
  banner,
  children,
}: {
  info: PanelInfo;
  pendingCount: number;
  isAdmin: boolean;
  brandName: string;
  banner: ReactNode;
  children: ReactNode;
}) {
  return (
    <PanelProvider info={info}>
      <Shell pendingCount={pendingCount} isAdmin={isAdmin} brandName={brandName} banner={banner}>
        {children}
      </Shell>
      <Toaster />
    </PanelProvider>
  );
}

function Shell({
  pendingCount,
  isAdmin,
  brandName,
  banner,
  children,
}: {
  pendingCount: number;
  isAdmin: boolean;
  brandName: string;
  banner: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("PanelNav");
  const pathname = usePathname();
  const { openAddBooking, businessName, slug, locale } = usePanel();
  const publicUrl = `${locale === "ru" ? "/ru" : ""}/b/${slug}`;

  return (
    <div className="flex min-h-dvh bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-background lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <BrandMark />
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{brandName}</p>
            <p className="truncate font-semibold">{businessName}</p>
          </div>
        </div>
        <div className="p-3">
          <button
            type="button"
            onClick={() => openAddBooking()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-5" aria-hidden />
            {t("addBooking")}
          </button>
        </div>
        <nav aria-label={t("menu")} className="flex-1 overflow-y-auto px-3">
          <ul className="space-y-0.5">
            {MAIN.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground/80 hover:bg-muted",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                    {t(item.key)}
                    {item.key === "today" && <Badge count={pendingCount} />}
                  </Link>
                </li>
              );
            })}
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 font-medium text-foreground/80 hover:bg-muted"
                >
                  <Shield className="size-5" aria-hidden />
                  {t("admin")}
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="space-y-2 border-t p-3">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 font-medium text-primary hover:bg-muted"
          >
            <ExternalLink className="size-5" aria-hidden />
            {t("myPage")}
          </a>
          <div className="flex items-center justify-between gap-2 px-1">
            <LanguageSwitcher />
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden />
                {t("logout")}
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur lg:hidden">
          <BrandMark className="size-7" />
          <p className="min-w-0 flex-1 truncate font-semibold">{businessName}</p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("myPage")}
            className="inline-flex size-11 items-center justify-center rounded-lg text-primary hover:bg-muted"
          >
            <ExternalLink className="size-5" aria-hidden />
          </a>
        </header>

        {banner}
        <main
          id="main"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 lg:px-8 lg:pb-10"
        >
          {children}
        </main>

        {/* Mobile bottom navigation (spec 7.6) */}
        <nav
          aria-label={t("menu")}
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          <ul className="grid h-16 grid-cols-5">
            <MobileTab
              href="/panel"
              exact
              label={t("today")}
              icon={House}
              pathname={pathname}
              badge={pendingCount}
            />
            <MobileTab
              href="/panel/kalendar"
              label={t("calendar")}
              icon={CalendarDays}
              pathname={pathname}
            />
            <li className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => openAddBooking()}
                aria-label={t("addBooking")}
                className="-mt-6 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background active:scale-95"
              >
                <Plus className="size-7" aria-hidden />
              </button>
            </li>
            <MobileTab
              href="/panel/mijozlar"
              label={t("clients")}
              icon={Users}
              pathname={pathname}
            />
            <MobileTab href="/panel/yana" label={t("more")} icon={MenuIcon} pathname={pathname} />
          </ul>
        </nav>
      </div>
    </div>
  );
}

function MobileTab({
  href,
  label,
  icon: Icon,
  pathname,
  exact,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: typeof House;
  pathname: string;
  exact?: boolean;
  badge?: number;
}) {
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-6" aria-hidden />
        {label}
        {badge > 0 && (
          <span className="absolute top-1.5 left-1/2 ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-pending px-1 text-[11px] font-bold text-pending-foreground">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    </li>
  );
}
