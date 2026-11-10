// Business categories with labels and the word used instead of "staff" (spec 7.5).
import type { Locale } from "@/config/locales";

export const CATEGORY_CODES = [
  "BARBERSHOP",
  "BEAUTY_SALON",
  "NAILS",
  "COSMETOLOGY",
  "MASSAGE",
  "DENTAL",
  "CLINIC",
  "CAR_WASH",
  "AUTO_SERVICE",
  "TUTOR",
  "FITNESS",
  "PHOTO_STUDIO",
  "OTHER",
] as const;
export type CategoryCode = (typeof CATEGORY_CODES)[number];

type Labels = Record<Locale, string>;
type CategoryInfo = { name: Labels; staff: Labels; emoji: string };

export const CATEGORIES: Record<CategoryCode, CategoryInfo> = {
  BARBERSHOP: {
    name: { uz: "Sartaroshxona", ru: "Барбершоп" },
    staff: { uz: "Usta", ru: "Мастер" },
    emoji: "💈",
  },
  BEAUTY_SALON: {
    name: { uz: "Goʻzallik saloni", ru: "Салон красоты" },
    staff: { uz: "Usta", ru: "Мастер" },
    emoji: "💇‍♀️",
  },
  NAILS: {
    name: { uz: "Manikyur va pedikyur", ru: "Маникюр и педикюр" },
    staff: { uz: "Usta", ru: "Мастер" },
    emoji: "💅",
  },
  COSMETOLOGY: {
    name: { uz: "Kosmetologiya", ru: "Косметология" },
    staff: { uz: "Mutaxassis", ru: "Специалист" },
    emoji: "🧴",
  },
  MASSAGE: {
    name: { uz: "Massaj", ru: "Массаж" },
    staff: { uz: "Massajchi", ru: "Массажист" },
    emoji: "💆",
  },
  DENTAL: {
    name: { uz: "Stomatologiya", ru: "Стоматология" },
    staff: { uz: "Shifokor", ru: "Врач" },
    emoji: "🦷",
  },
  CLINIC: {
    name: { uz: "Klinika va shifokorlar", ru: "Клиника и врачи" },
    staff: { uz: "Shifokor", ru: "Врач" },
    emoji: "🩺",
  },
  CAR_WASH: {
    name: { uz: "Avtomoyka", ru: "Автомойка" },
    staff: { uz: "Boks", ru: "Бокс" },
    emoji: "🚿",
  },
  AUTO_SERVICE: {
    name: { uz: "Avtoservis", ru: "Автосервис" },
    staff: { uz: "Usta", ru: "Мастер" },
    emoji: "🔧",
  },
  TUTOR: {
    name: { uz: "Repetitor va kurslar", ru: "Репетиторы и курсы" },
    staff: { uz: "Oʻqituvchi", ru: "Преподаватель" },
    emoji: "📚",
  },
  FITNESS: {
    name: { uz: "Fitnes va trenerlar", ru: "Фитнес и тренеры" },
    staff: { uz: "Trener", ru: "Тренер" },
    emoji: "🏋️",
  },
  PHOTO_STUDIO: {
    name: { uz: "Fotostudiya", ru: "Фотостудия" },
    staff: { uz: "Fotograf", ru: "Фотограф" },
    emoji: "📷",
  },
  OTHER: {
    name: { uz: "Boshqa", ru: "Другое" },
    staff: { uz: "Mutaxassis", ru: "Специалист" },
    emoji: "✨",
  },
};

export function categoryName(code: CategoryCode, locale: Locale): string {
  return CATEGORIES[code].name[locale];
}

/** Capitalized staff word, e.g. "Usta", "Shifokor", "Boks". */
export function staffLabel(code: CategoryCode, locale: Locale): string {
  return CATEGORIES[code].staff[locale];
}
