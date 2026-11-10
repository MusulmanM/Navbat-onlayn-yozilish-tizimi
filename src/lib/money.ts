// Money formatting (spec 6.7). Amounts are whole so'm.
import type { Locale } from "@/config/locales";

/** Non-breaking space: keeps "150 000 soʻm" on one line. */
const NBSP = " ";

/** 150000 → "150 000" with non-breaking spaces. */
export function formatAmount(amount: number): string {
  return String(Math.trunc(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** "150 000 soʻm", "150 000 soʻmdan", "Bepul" / "150 000 сум", "от 150 000 сум", "Бесплатно". */
export function formatMoney(amount: number, locale: Locale, priceIsFrom = false): string {
  if (amount === 0) return locale === "uz" ? "Bepul" : "Бесплатно";
  const value = formatAmount(amount);
  if (locale === "uz") return `${value}${NBSP}soʻm${priceIsFrom ? "dan" : ""}`;
  return `${priceIsFrom ? `от${NBSP}` : ""}${value}${NBSP}сум`;
}
