// Supported UI languages. Uzbek (Latin) is the default and has no URL prefix.
export const LOCALES = ["uz", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Telegram language_code → our locale (spec 8.1). */
export function localeFromTelegram(languageCode: string | undefined): Locale {
  return languageCode?.toLowerCase().startsWith("ru") ? "ru" : "uz";
}
