import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/config/locales";
import { LoginCard } from "@/components/auth/login-card";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { pickMessages } from "@/i18n/client-messages";
import { redirect } from "@/i18n/navigation";
import { safeNextPath } from "@/lib/auth/access-rules";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: isLocale(locale) ? locale : "uz", namespace: "Login" });
  return { title: t("title"), robots: { index: false } };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const query = await searchParams;
  const next = safeNextPath(typeof query.next === "string" ? query.next : null);

  const user = await getSessionUser().catch(() => null);
  if (user) {
    const hasBusiness = (await db.membership.count({ where: { userId: user.id } })) > 0;
    redirect({ href: hasBusiness ? "/panel" : "/onboarding", locale });
  }

  const messages = await pickMessages(["Login"]);
  return (
    <>
      <SiteHeader showLogin={false} />
      <main
        id="main"
        className="flex flex-1 items-start justify-center bg-muted/40 px-4 py-8 sm:items-center"
      >
        <NextIntlClientProvider messages={messages}>
          <LoginCard locale={locale} next={next} />
        </NextIntlClientProvider>
      </main>
      <SiteFooter />
    </>
  );
}
