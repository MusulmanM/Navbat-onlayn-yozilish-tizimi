"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// 500-style page (spec 7.9). Shown when a server component throws.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div role="alert" className="w-full max-w-sm text-center">
        <p className="text-5xl" aria-hidden>
          ⚠️
        </p>
        <h1 className="mt-4 text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("text")}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" onClick={() => reset()}>
            {t("retry")}
          </Button>
          <Link href="/" className={buttonVariants({ size: "lg", variant: "ghost" })}>
            {t("home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
