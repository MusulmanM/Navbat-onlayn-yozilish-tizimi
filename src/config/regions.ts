// Regions of Uzbekistan (spec 7.5).
import type { Locale } from "@/config/locales";

export const REGION_CODES = [
  "TASHKENT_CITY",
  "TASHKENT_REGION",
  "ANDIJAN",
  "BUKHARA",
  "FERGANA",
  "JIZZAKH",
  "KHOREZM",
  "NAMANGAN",
  "NAVOI",
  "KASHKADARYA",
  "SAMARKAND",
  "SYRDARYA",
  "SURKHANDARYA",
  "KARAKALPAKSTAN",
] as const;
export type RegionCode = (typeof REGION_CODES)[number];

export const REGIONS: Record<RegionCode, Record<Locale, string>> = {
  TASHKENT_CITY: { uz: "Toshkent shahri", ru: "г. Ташкент" },
  TASHKENT_REGION: { uz: "Toshkent viloyati", ru: "Ташкентская область" },
  ANDIJAN: { uz: "Andijon viloyati", ru: "Андижанская область" },
  BUKHARA: { uz: "Buxoro viloyati", ru: "Бухарская область" },
  FERGANA: { uz: "Fargʻona viloyati", ru: "Ферганская область" },
  JIZZAKH: { uz: "Jizzax viloyati", ru: "Джизакская область" },
  KHOREZM: { uz: "Xorazm viloyati", ru: "Хорезмская область" },
  NAMANGAN: { uz: "Namangan viloyati", ru: "Наманганская область" },
  NAVOI: { uz: "Navoiy viloyati", ru: "Навоийская область" },
  KASHKADARYA: { uz: "Qashqadaryo viloyati", ru: "Кашкадарьинская область" },
  SAMARKAND: { uz: "Samarqand viloyati", ru: "Самаркандская область" },
  SYRDARYA: { uz: "Sirdaryo viloyati", ru: "Сырдарьинская область" },
  SURKHANDARYA: { uz: "Surxondaryo viloyati", ru: "Сурхандарьинская область" },
  KARAKALPAKSTAN: { uz: "Qoraqalpogʻiston Respublikasi", ru: "Республика Каракалпакстан" },
};

export function regionName(code: RegionCode, locale: Locale): string {
  return REGIONS[code][locale];
}
