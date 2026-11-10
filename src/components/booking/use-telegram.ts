"use client";

import { useEffect, useState } from "react";

// Minimal typing of the Telegram Mini App API we use (spec 8.5).
export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: { user?: { first_name?: string; last_name?: string } };
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  BackButton: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
  HapticFeedback?: { notificationOccurred(type: "success" | "error" | "warning"): void };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const SCRIPT_SRC = "https://telegram.org/js/telegram-web-app.js";

/** Loads telegram-web-app.js only when the page was opened from the bot (?src=tg). */
export function useTelegramWebApp(enabled: boolean): TelegramWebApp | null {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const activate = () => {
      const app = window.Telegram?.WebApp;
      if (cancelled || !app || !app.initData) return;
      app.ready();
      app.expand();
      app.setHeaderColor?.("#ffffff");
      app.setBackgroundColor?.("#ffffff");
      setWebApp(app);
    };
    if (window.Telegram?.WebApp) {
      activate();
      return () => {
        cancelled = true;
      };
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = activate;
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return webApp;
}
