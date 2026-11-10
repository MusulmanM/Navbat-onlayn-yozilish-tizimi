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
/** staffAcc: accusative form for "choose …" phrases (uz "Ustani", ru "мастера"). */
type CategoryInfo = { name: Labels; staff: Labels; staffAcc: Labels; emoji: string };

export const CATEGORIES: Record<CategoryCode, CategoryInfo> = {
  BARBERSHOP: {
    name: { uz: "Sartaroshxona", ru: "Барбершоп" },
    staff: { uz: "Usta", ru: "Мастер" },
    staffAcc: { uz: "Ustani", ru: "мастера" },
    emoji: "💈",
  },
  BEAUTY_SALON: {
    name: { uz: "Goʻzallik saloni", ru: "Салон красоты" },
    staff: { uz: "Usta", ru: "Мастер" },
    staffAcc: { uz: "Ustani", ru: "мастера" },
    emoji: "💇‍♀️",
  },
  NAILS: {
    name: { uz: "Manikyur va pedikyur", ru: "Маникюр и педикюр" },
    staff: { uz: "Usta", ru: "Мастер" },
    staffAcc: { uz: "Ustani", ru: "мастера" },
    emoji: "💅",
  },
  COSMETOLOGY: {
    name: { uz: "Kosmetologiya", ru: "Косметология" },
    staff: { uz: "Mutaxassis", ru: "Специалист" },
    staffAcc: { uz: "Mutaxassisni", ru: "специалиста" },
    emoji: "🧴",
  },
  MASSAGE: {
    name: { uz: "Massaj", ru: "Массаж" },
    staff: { uz: "Massajchi", ru: "Массажист" },
    staffAcc: { uz: "Massajchini", ru: "массажиста" },
    emoji: "💆",
  },
  DENTAL: {
    name: { uz: "Stomatologiya", ru: "Стоматология" },
    staff: { uz: "Shifokor", ru: "Врач" },
    staffAcc: { uz: "Shifokorni", ru: "врача" },
    emoji: "🦷",
  },
  CLINIC: {
    name: { uz: "Klinika va shifokorlar", ru: "Клиника и врачи" },
    staff: { uz: "Shifokor", ru: "Врач" },
    staffAcc: { uz: "Shifokorni", ru: "врача" },
    emoji: "🩺",
  },
  CAR_WASH: {
    name: { uz: "Avtomoyka", ru: "Автомойка" },
    staff: { uz: "Boks", ru: "Бокс" },
    staffAcc: { uz: "Boksni", ru: "бокс" },
    emoji: "🚿",
  },
  AUTO_SERVICE: {
    name: { uz: "Avtoservis", ru: "Автосервис" },
    staff: { uz: "Usta", ru: "Мастер" },
    staffAcc: { uz: "Ustani", ru: "мастера" },
    emoji: "🔧",
  },
  TUTOR: {
    name: { uz: "Repetitor va kurslar", ru: "Репетиторы и курсы" },
    staff: { uz: "Oʻqituvchi", ru: "Преподаватель" },
    staffAcc: { uz: "Oʻqituvchini", ru: "преподавателя" },
    emoji: "📚",
  },
  FITNESS: {
    name: { uz: "Fitnes va trenerlar", ru: "Фитнес и тренеры" },
    staff: { uz: "Trener", ru: "Тренер" },
    staffAcc: { uz: "Trenerni", ru: "тренера" },
    emoji: "🏋️",
  },
  PHOTO_STUDIO: {
    name: { uz: "Fotostudiya", ru: "Фотостудия" },
    staff: { uz: "Fotograf", ru: "Фотограф" },
    staffAcc: { uz: "Fotografni", ru: "фотографа" },
    emoji: "📷",
  },
  OTHER: {
    name: { uz: "Boshqa", ru: "Другое" },
    staff: { uz: "Mutaxassis", ru: "Специалист" },
    staffAcc: { uz: "Mutaxassisni", ru: "специалиста" },
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

/** "Ustani" / "мастера" — for "{staffAcc} tanlang" / "Выберите {staffAcc}". */
export function staffLabelAcc(code: CategoryCode, locale: Locale): string {
  return CATEGORIES[code].staffAcc[locale];
}
