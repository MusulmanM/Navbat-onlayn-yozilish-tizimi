"use client";

import { Check, Clock3, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { Locale } from "@/config/locales";
import type { BookingResult } from "@/components/booking/types";
import { TelegramIcon } from "@/components/common/telegram-icon";
import { cn } from "@/lib/utils";

/** Step 6: confirmation with Telegram reminders as the main action (spec 7.2). */
export function BookingSuccess({
  locale,
  result,
  telegramMode,
  summary,
  onClose,
  onBookAnother,
}: {
  locale: Locale;
  result: BookingResult;
  telegramMode: boolean;
  summary: ReactNode;
  onClose: () => void;
  onBookAnother: () => void;
}) {
  const t = useTranslations("Booking");
  const tc = useTranslations("Common");
  const pending = result.status === "PENDING";
  const prefix = locale === "ru" ? "/ru" : "";
  const secondary =
    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border bg-background font-semibold transition-colors hover:bg-muted";

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain p-4">
      <div className="py-4 text-center">
        <span
          aria-hidden
          className={cn(
            "mx-auto inline-flex size-16 items-center justify-center rounded-full",
            pending ? "bg-pending/20 text-pending-foreground" : "bg-accent text-primary",
          )}
        >
          {pending ? <Clock3 className="size-8" /> : <Check className="size-9" strokeWidth={3} />}
        </span>
        <p className="mt-3 text-2xl font-bold">
          {pending ? t("pendingTitle") : t("confirmedTitle")}
        </p>
        {pending && <p className="mt-1 text-muted-foreground">{t("pendingText")}</p>}
      </div>

      {summary}

      <div className="mt-5 space-y-2.5">
        {result.telegramLinked ? (
          <p className="flex items-center gap-2 rounded-xl bg-accent p-3.5 font-medium text-accent-foreground">
            <TelegramIcon className="size-5 shrink-0" />
            {telegramMode ? t("telegramSent") : t("telegramLinked")}
          </p>
        ) : (
          result.telegramLink && (
            <div>
              <a
                href={result.telegramLink}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#1d8bc0]"
              >
                {t("telegramCta")}
              </a>
              <p className="mt-1.5 text-center text-sm text-muted-foreground">
                {t("telegramHint")}
              </p>
            </div>
          )
        )}

        <a
          href={`/api/public/bookings/${result.manageToken}/ics?locale=${locale}`}
          className={secondary}
        >
          {t("addToCalendar")}
        </a>
        <a href={`${prefix}/y/${result.manageToken}`} className={secondary}>
          <Settings2 className="size-5 text-primary" aria-hidden />
          {t("manage")}
        </a>
        {telegramMode ? (
          <button
            type="button"
            onClick={onClose}
            className={cn(secondary, "border-transparent bg-muted")}
          >
            {tc("close")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onBookAnother}
            className="inline-flex h-11 w-full items-center justify-center font-semibold text-primary"
          >
            {t("bookAnother")}
          </button>
        )}
      </div>
    </div>
  );
}
