"use client";

import { Loader2, QrCode, RotateCcw, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/components/booking/api";
import { TelegramIcon } from "@/components/common/telegram-icon";
import type { Locale } from "@/config/locales";

type Started = { token: string; expiresAt: string; botLink: string; qr: string };
type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "waiting"; data: Started }
  | { kind: "completing" }
  | { kind: "expired" }
  | { kind: "rejected" }
  | { kind: "error"; message: string };

const POLL_MS = 2000;

function remaining(expiresAt: string, now: number): string {
  const total = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Telegram login (spec 7.4): token → bot confirms → this page polls → session cookie. */
export function LoginCard({ locale, next }: { locale: Locale; next: string | null }) {
  const t = useTranslations("Login");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [now, setNow] = useState(() => Date.now());
  const completing = useRef(false);

  const start = async () => {
    setPhase({ kind: "starting" });
    completing.current = false;
    const res = await apiRequest<Started>("/api/auth/login-token", { method: "POST" });
    if (res.ok) setPhase({ kind: "waiting", data: res.data });
    else
      setPhase({
        kind: "error",
        message:
          res.error.code === "TOO_MANY_REQUESTS"
            ? t("errors.tooMany")
            : res.error.code === "CONFIG"
              ? t("errors.config")
              : res.error.code === "NETWORK"
                ? t("errors.network")
                : t("errors.unknown"),
      });
  };

  const complete = useCallback(
    async (token: string) => {
      if (completing.current) return;
      completing.current = true;
      setPhase({ kind: "completing" });
      const res = await apiRequest<{ redirect: string }>(
        `/api/auth/login-token/${token}/complete`,
        {
          method: "POST",
        },
      );
      if (!res.ok) {
        setPhase({ kind: "expired" });
        return;
      }
      const prefix = locale === "ru" ? "/ru" : "";
      const target =
        next && !next.startsWith("/onboarding") && res.data.redirect === "/panel"
          ? next
          : `${prefix}${res.data.redirect}`;
      window.location.assign(target);
    },
    [locale, next],
  );

  const waitingToken = phase.kind === "waiting" ? phase.data.token : null;
  const expiresAt = phase.kind === "waiting" ? phase.data.expiresAt : null;

  // Poll every 2 s, and immediately when the user comes back from Telegram.
  useEffect(() => {
    if (!waitingToken) return;
    let stopped = false;
    const poll = async () => {
      const res = await apiRequest<{ state: string }>(`/api/auth/login-token/${waitingToken}`);
      if (stopped || !res.ok) return;
      if (res.data.state === "CONFIRMED") void complete(waitingToken);
      else if (res.data.state === "REJECTED") setPhase({ kind: "rejected" });
      else if (res.data.state === "EXPIRED" || res.data.state === "USED")
        setPhase({ kind: "expired" });
    };
    const interval = window.setInterval(poll, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [waitingToken, complete]);

  // Countdown; switches to "expired" locally when time is up.
  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (new Date(expiresAt).getTime() <= current) setPhase({ kind: "expired" });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const telegramButton =
    "inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-[#229ED9] px-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#1d8bc0] disabled:opacity-70";

  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="text-center">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-[#229ED9]/10 text-[#229ED9]">
          <TelegramIcon className="size-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1.5 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-6" aria-live="polite">
        {(phase.kind === "idle" || phase.kind === "starting") && (
          <button
            type="button"
            onClick={start}
            disabled={phase.kind === "starting"}
            className={telegramButton}
          >
            {phase.kind === "starting" ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <TelegramIcon className="size-5" />
            )}
            {t("button")}
          </button>
        )}

        {phase.kind === "waiting" && (
          <div className="space-y-5">
            <a
              href={phase.data.botLink}
              target="_blank"
              rel="noopener noreferrer"
              className={telegramButton}
            >
              <TelegramIcon className="size-5" />
              {t("openTelegram")}
            </a>
            <ol className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm">
              <li>1. {t("step1")}</li>
              <li>2. {t("step2")}</li>
              <li>3. {t("step3")}</li>
            </ol>
            <details className="group rounded-xl border sm:open:bg-transparent" open>
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 font-medium [&::-webkit-details-marker]:hidden">
                <QrCode className="size-5 text-primary" aria-hidden />
                {t("qrTitle")}
              </summary>
              <div className="flex flex-col items-center gap-2 px-4 pb-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL */}
                <img
                  src={phase.data.qr}
                  alt={t("qrAlt")}
                  width={200}
                  height={200}
                  className="size-52"
                />
                <p className="text-center text-sm text-muted-foreground">{t("qrHint")}</p>
              </div>
            </details>
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("waiting", { time: remaining(phase.data.expiresAt, now) })}
            </p>
          </div>
        )}

        {phase.kind === "completing" && (
          <p className="flex items-center justify-center gap-2 py-6 font-medium text-primary">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            {t("completing")}
          </p>
        )}

        {(phase.kind === "expired" || phase.kind === "rejected" || phase.kind === "error") && (
          <div role="alert" className="space-y-4 text-center">
            <p className="rounded-xl bg-muted p-4 font-medium">
              {phase.kind === "expired"
                ? t("expired")
                : phase.kind === "rejected"
                  ? t("rejected")
                  : phase.message}
            </p>
            <button
              type="button"
              onClick={start}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border font-semibold hover:bg-muted"
            >
              <RotateCcw className="size-5" aria-hidden />
              {t("retry")}
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
        {t("safety")}
      </p>
    </div>
  );
}
