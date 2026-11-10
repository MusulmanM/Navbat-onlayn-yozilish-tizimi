// Ready-made services offered during onboarding (spec 7.5). Prices are examples only.
import type { CategoryCode } from "@/config/categories";

export type ServiceTemplate = {
  nameUz: string;
  nameRu: string;
  durationMinutes: number;
  price: number;
  priceIsFrom?: boolean;
};

export const SERVICE_TEMPLATES: Record<CategoryCode, ServiceTemplate[]> = {
  BARBERSHOP: [
    { nameUz: "Soch olish", nameRu: "Стрижка", durationMinutes: 30, price: 50_000 },
    { nameUz: "Soqol olish", nameRu: "Бритьё бороды", durationMinutes: 20, price: 30_000 },
    { nameUz: "Soch + soqol", nameRu: "Стрижка + борода", durationMinutes: 45, price: 70_000 },
    { nameUz: "Bolalar soch olish", nameRu: "Детская стрижка", durationMinutes: 30, price: 40_000 },
  ],
  BEAUTY_SALON: [
    {
      nameUz: "Ayollar soch olish",
      nameRu: "Женская стрижка",
      durationMinutes: 60,
      price: 100_000,
    },
    {
      nameUz: "Soch boʻyash",
      nameRu: "Окрашивание волос",
      durationMinutes: 120,
      price: 250_000,
      priceIsFrom: true,
    },
    { nameUz: "Ukladka", nameRu: "Укладка", durationMinutes: 45, price: 80_000 },
    { nameUz: "Qosh dizayni", nameRu: "Дизайн бровей", durationMinutes: 30, price: 50_000 },
  ],
  NAILS: [
    { nameUz: "Manikyur", nameRu: "Маникюр", durationMinutes: 60, price: 80_000 },
    {
      nameUz: "Gel-lak bilan manikyur",
      nameRu: "Маникюр с гель-лаком",
      durationMinutes: 90,
      price: 150_000,
    },
    { nameUz: "Pedikyur", nameRu: "Педикюр", durationMinutes: 60, price: 120_000 },
  ],
  COSMETOLOGY: [
    { nameUz: "Yuz tozalash", nameRu: "Чистка лица", durationMinutes: 60, price: 200_000 },
    { nameUz: "Konsultatsiya", nameRu: "Консультация", durationMinutes: 30, price: 100_000 },
  ],
  MASSAGE: [
    {
      nameUz: "Klassik massaj",
      nameRu: "Классический массаж",
      durationMinutes: 60,
      price: 200_000,
    },
    { nameUz: "Bel massaji", nameRu: "Массаж спины", durationMinutes: 30, price: 100_000 },
  ],
  DENTAL: [
    {
      nameUz: "Koʻrik va konsultatsiya",
      nameRu: "Осмотр и консультация",
      durationMinutes: 30,
      price: 100_000,
    },
    { nameUz: "Tish tozalash", nameRu: "Чистка зубов", durationMinutes: 60, price: 300_000 },
    { nameUz: "Plomba", nameRu: "Пломба", durationMinutes: 60, price: 300_000, priceIsFrom: true },
  ],
  CLINIC: [
    { nameUz: "Shifokor qabuli", nameRu: "Приём врача", durationMinutes: 30, price: 150_000 },
  ],
  CAR_WASH: [
    { nameUz: "Kuzov yuvish", nameRu: "Мойка кузова", durationMinutes: 30, price: 60_000 },
    { nameUz: "Kompleks yuvish", nameRu: "Комплексная мойка", durationMinutes: 60, price: 120_000 },
    {
      nameUz: "Salonni kimyoviy tozalash",
      nameRu: "Химчистка салона",
      durationMinutes: 180,
      price: 600_000,
      priceIsFrom: true,
    },
  ],
  AUTO_SERVICE: [
    { nameUz: "Diagnostika", nameRu: "Диагностика", durationMinutes: 60, price: 150_000 },
    {
      nameUz: "Moy almashtirish",
      nameRu: "Замена масла",
      durationMinutes: 30,
      price: 50_000,
      priceIsFrom: true,
    },
    { nameUz: "Shinomontaj", nameRu: "Шиномонтаж", durationMinutes: 40, price: 80_000 },
  ],
  TUTOR: [
    {
      nameUz: "Individual dars",
      nameRu: "Индивидуальное занятие",
      durationMinutes: 60,
      price: 150_000,
    },
    { nameUz: "Sinov darsi", nameRu: "Пробное занятие", durationMinutes: 30, price: 0 },
  ],
  FITNESS: [
    {
      nameUz: "Shaxsiy mashgʻulot",
      nameRu: "Персональная тренировка",
      durationMinutes: 60,
      price: 150_000,
    },
  ],
  PHOTO_STUDIO: [
    { nameUz: "Fotosessiya", nameRu: "Фотосессия", durationMinutes: 60, price: 400_000 },
  ],
  OTHER: [],
};
