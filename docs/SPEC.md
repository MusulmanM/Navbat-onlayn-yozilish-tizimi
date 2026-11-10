# Navbat — onlayn yozilish tizimi (veb-sayt + Telegram bot)

**Claude uchun to'liq texnik topshiriq.**

"Navbat" — ishchi nom, keyin o'zgartiriladi. Nom kodda hech qayerda qattiq yozilmaydi, faqat `NEXT_PUBLIC_BRAND_NAME` orqali olinadi.

---

## 0. Claude, ishni boshlashdan oldin buni o'qi

### 0.1. Men bilan qanday ishlaysan

1. Men dasturchi emasman. Men bilan **har doim o'zbek tilida (lotin yozuvida), sodda tilda** gaplash. Texnik atama ishlatsang, yonida bir jumla bilan tushuntir.
2. Avval shu hujjatni **oxirigacha** o'qib chiq. Keyin menga 5–7 qatorda nimani qurishimizni va ish qaysi bosqichlardan iborat ekanini aytib ber, so'ng **0-bosqichni boshla**.
3. Ish **16-bo'limdagi bosqichlar** bo'yicha boradi, bir vaqtda faqat bitta bosqich. Bosqichlarni o'tkazib yuborma va birlashtirma.
4. Har bir bosqich oxirida:
   - `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` ni ishga tushir va barcha xatolarni tuzat;
   - menga nima qilinganini qisqa tushuntir va **men o'zim nimani tekshirishim kerakligini** yoz (qaysi manzilni ochish, nimani bosish, nima ko'rinishi kerak);
   - `docs/PROGRESS.md` ni yangila va git commit qil (commit xabari inglizcha, masalan `feat: public booking page`);
   - keyingi bosqichga o'tishdan oldin **mendan ruxsat so'ra**. Men "davom et" desam — keyingisiga o'tasan.
5. Men qo'lda qilishim kerak bo'lgan ishlar (akkaunt ochish, token olish, sozlama kiritish) uchun **raqamlangan qadamlar** ber: qaysi saytga kirish, qaysi tugmani bosish, nimani nusxalab qayerga qo'yish. Men tayyor bo'lgunimcha kut.
6. Pulimiz yo'q: **faqat bepul xizmatlar va ochiq kodli kutubxonalar**. Biror narsa pullik bo'lsa — to'xta va mendan so'ra.
7. Maxfiy kalitlar faqat `.env.local` faylida. `.env.example` da faqat nomlar va izohlar. `.env.example` dan boshqa `.env*` fayllar git'ga tushmasin. Mendan kalitlarni chatga yozishni so'rama — ularni o'zim faylga qo'yaman.
8. Kutubxonalarning **eng so'nggi barqaror versiyalari**ni ishlat. Agar bu hujjatdagi biror API (Next.js, Prisma, next-intl, grammY va h.k.) o'zgargan bo'lsa — rasmiy hujjatni tekshir va yangi usulni qo'lla. Eskirgan (deprecated) usullardan foydalanma.
9. Bazani o'chiradigan yoki tozalaydigan buyruqlarni (`prisma migrate reset`, `DROP`, `TRUNCATE`, `db push --force-reset`) **faqat mening ruxsatim bilan** ishlat.
10. Bu hujjatda aytilmagan kichik qarorlarni o'zing oqilona qabul qil va `docs/DECISIONS.md` ga bir qatordan yozib qo'y. Katta qarorlar (arxitekturani o'zgartirish, pullik xizmat, ma'lumot o'chirish, xavfsizlikni susaytirish) uchun mendan so'ra.
11. Har bir yangi sessiya boshida avval `CLAUDE.md` va `docs/PROGRESS.md` ni o'qi va qolgan joydan davom et.
12. Men Windows'da ishlashim mumkin: barcha skriptlar Windows, macOS va Linux'da bir xil ishlasin. Bash'ga bog'lanma, TypeScript skriptlarni `tsx` bilan ishga tushir.

### 0.2. Kod sifati

- TypeScript `strict` rejimi, `any` taqiqlangan.
- Serverga keladigan har bir ma'lumot `zod` bilan tekshiriladi (API, server action, bot callback).
- UI matnlari kodga yozilmaydi — faqat `messages/uz.json` va `messages/ru.json` orqali. Bot matnlari `src/bot/texts/` da turadi.
- Biznes-logika (`src/lib/`) sahifalardan ajratilgan, "toza" (bazaga murojaat qilmaydigan) funksiyalar ko'rinishida yozilgan va testlangan.
- Kod izohlari ingliz tilida, qisqa.
- Hostingga bog'lanib qolma: faqat standart Next.js imkoniyatlari. Keyin loyihani istalgan serverga (masalan, Docker bilan O'zbekistondagi VPS'ga) ko'chirish oson bo'lsin.
- Prisma `BigInt` maydonlarini (Telegram ID) JSON'ga chiqarishda `string`ga aylantir, aks holda `JSON.stringify` xato beradi.

---

## 1. Loyiha haqida

### 1.1. Muammo

O'zbekistondagi kichik xizmat bizneslari (sartaroshxona, go'zallik saloni, manikyur, stomatologiya, avtomoyka, avtoservis, repetitorlar) mijozlarni hali ham telefon, Telegram yozishmalari yoki daftar orqali yozib olishadi. Natijada telefon kun bo'yi jiringlaydi, navbat chalkashadi, mijozlar unutib kelmay qoladi.

### 1.2. Yechim

Bitta platforma, ikkita "eshik":

1. **Veb-sayt** — har bir biznesning o'z yozilish sahifasi (`sayt.uz/b/barber-ali`), biznes egasi uchun boshqaruv paneli, platforma egasi (men) uchun admin panel.
2. **Telegram bot** — mijozga tasdiq va eslatmalar (tashrifdan 1 kun va 2 soat oldin), biznes egasiga yangi yozilishlar haqida xabar, Telegram ichida yozilish (Mini App).

Ma'lumotlar bitta bazada saqlanadi: mijoz saytdan yozilsa ham, botdan yozilsa ham, biznes egasi hammasini bir joyda ko'radi.

### 1.3. Rollar

| Rol | Kim | Nima qiladi |
|---|---|---|
| Mijoz | Oddiy odam | Ro'yxatdan o'tmasdan yoziladi (ism + telefon), eslatma oladi, bekor qiladi |
| Biznes egasi | Sartarosh, salon egasi va h.k. | Telegram orqali kiradi, xizmat/usta/ish vaqtini sozlaydi, yozilishlarni boshqaradi |
| Platforma admini | Men | Bizneslar ro'yxati, to'lovlarni qo'lda qayd etish, bloklash, statistika |

### 1.4. Daromad modeli

- Oylik obuna: **Start** — 99 000 so'm/oy (1 usta), **Pro** — 199 000 so'm/oy (5 tagacha usta). Har bir yangi biznesga 14 kun bepul sinov (Pro imkoniyatlari bilan).
- Narxlar va limitlar faqat `src/config/plans.ts` da turadi, keyin oson o'zgartiriladi.
- Boshida to'lov **qo'lda** qabul qilinadi: biznes Click/Payme/karta orqali to'laydi, men admin panelda to'lovni qayd etaman va obuna uzayadi. Avtomatik to'lov (Click/Payme API) — keyingi bosqich (18-bo'lim).

### 1.5. Dizaynga ta'sir qiladigan cheklovlar

- Foydalanuvchilarning ko'pchiligi **arzon Android telefon**da va viloyatlarda **sekin internet**da. Ommaviy sahifalar yengil bo'lsin: server-render, kam JavaScript, og'ir kutubxonalarsiz. Biznes sahifasining JS hajmi iloji boricha kichik bo'lsin.
- Biznes egalarining ko'pi texnikani yaxshi bilmaydi: har bir ekran oddiy, tugmalar katta, matn minimal.
- Asosiy til — o'zbek (lotin), ikkinchisi — rus.
- Vaqt zonasi — `Asia/Tashkent` (UTC+5, yozgi vaqt yo'q), lekin kod istalgan zona bilan to'g'ri ishlasin.

### 1.6. Asosiy konstantalar

Hammasi `src/config/site.ts` da bitta joyda:

| Nom | Qiymat | Ma'nosi |
|---|---|---|
| `TRIAL_DAYS` | 14 | Bepul sinov muddati |
| `GRACE_DAYS` | 3 | Obuna tugagach yana necha kun ishlab turadi |
| `QUIET_HOURS` | 22:00–07:00 (biznes vaqti bilan) | Bu oraliqda mijozga eslatma yuborilmaydi |
| `MAX_ACTIVE_BOOKINGS_PER_PHONE` | 3 | Bitta raqamdan bitta biznesga kelajakdagi faol yozilishlar soni |
| `LOGIN_TOKEN_TTL_MIN` | 10 | Login havolasi amal qilish muddati |
| `SESSION_TTL_DAYS` | 30 | Saytda kirgan holat qancha saqlanadi |
| `AUTO_COMPLETE_AFTER_HOURS` | 6 | Tashrif tugaganidan necha soat keyin avtomatik "Yakunlandi" bo'ladi |
| `STATUS_EDIT_WINDOW_DAYS` | 7 | "Keldi/Kelmadi" holatini necha kungacha tuzatish mumkin |
| `REMINDER_MAX_ATTEMPTS` | 3 | Eslatmani yuborishga urinishlar soni |
| `DAYS_API_RANGE` | 14 | Kalendar tasmasida nechta kun ko'rsatiladi |

---

## 2. Texnologiyalar

| Qism | Tanlov | Izoh |
|---|---|---|
| Framework | Next.js (App Router), TypeScript | Sayt, API, bot webhook va cron — hammasi bitta loyihada |
| UI | Tailwind CSS + shadcn/ui, ikonlar: lucide-react, toast: sonner | |
| Shrift | Inter (`next/font`) | Lotin va kirill, `oʻ`/`gʻ` belgilari bilan |
| Ma'lumotlar bazasi | PostgreSQL — Supabase bepul tarifi | Supabase'ni **faqat Postgres** sifatida ishlatamiz (Supabase Auth'siz), keyin istalgan Postgres'ga ko'chirish mumkin |
| ORM | Prisma | Migratsiyalar va seed. Eng yangi Prisma'da ulanish sozlamalari `prisma.config.ts` ga ko'chgan bo'lishi mumkin — hujjatga qarab moslashtir |
| Validatsiya | zod | Server va klient uchun umumiy sxemalar |
| Ko'p tillilik | next-intl | `uz` (asosiy), `ru` |
| Sana va vaqt | date-fns + @date-fns/tz | Bazada barcha vaqtlar UTC (`timestamptz`) |
| Telegram bot | grammY | Production'da webhook (Next.js route), lokal'da long polling |
| Sessiya | jose (JWT, httpOnly cookie) | Biznes egalari faqat Telegram orqali kiradi |
| QR kod | qrcode | Login va QR-poster uchun |
| Testlar | vitest | Biznes-logika uchun |
| Hosting | Vercel + Supabase | 19-bo'limdagi ogohlantirishni o'qi |
| Cron | cron-job.org (bepul) | Maxfiy kalit bilan himoyalangan API endpoint'larni chaqiradi |

**Regionlar:** Supabase loyihasi va Vercel funksiyalari **bitta regionda** bo'lsin — Frankfurt (`eu-central-1` / `fra1`). Vercel'ning standart regioni AQShda, uni albatta o'zgartir, aks holda har bir baza so'rovi sekinlashadi.

**Ishlatilmaydigan narsalar:** FullCalendar'ning ustalar bo'yicha ustunli (resource) plaginlari pullik — ularni ishlatma, kalendarni o'zing oddiy CSS grid bilan yasagin. SMS xizmatlari pullik — eslatmalar faqat Telegram orqali.

---

## 3. Arxitektura

```
 Mijoz (brauzer) ──► /b/[slug] ───────┐
 Mijoz (Telegram) ─► Bot ─► Mini App ─┤
                                       ├─► Next.js API ─► Prisma ─► PostgreSQL (Supabase)
 Biznes egasi ─────► /panel ──────────┤
 Admin (men) ──────► /admin ──────────┘

 Telegram serverlari ─► POST /api/telegram/webhook ─► grammY handlerlari
 cron-job.org ─► GET /api/cron/reminders (har 5 daqiqada) ─► eslatmalar ─► Telegram
 cron-job.org ─► GET /api/cron/daily (har kuni 08:00 Toshkent = 03:00 UTC) ─► kunlik hisobot, obuna ogohlantirishlari
```

Asosiy tamoyillar:

- Bitta Next.js ilova, alohida server yo'q.
- Bot logikasi `src/bot/` da. U bir xil handlerlar bilan ikki rejimda ishlaydi: lokal'da `npm run bot:dev` (long polling) va production'da webhook.
- Barcha bildirishnomalar `src/lib/notify.ts` dagi interfeys orqali yuboriladi. Bot hali tayyor bo'lmagan bosqichlarda bu interfeysning faqat log yozadigan versiyasi ishlaydi, 4-bosqichda Telegram versiyasi bilan almashtiriladi:

```ts
interface Notifier {
  bookingCreated(bookingId: string): Promise<void>;      // mijozga tasdiq + egalarga xabar
  bookingConfirmed(bookingId: string): Promise<void>;    // PENDING → CONFIRMED: mijozga xabar
  bookingCancelled(bookingId: string, by: "client" | "business"): Promise<void>;
  bookingRescheduled(bookingId: string): Promise<void>;
}
```

- Ikki xil bot bo'ladi: **test bot** (lokal ishlab chiqish uchun) va **asosiy bot** (production uchun). Bitta botni bir vaqtda ham webhook, ham polling bilan ishlatib bo'lmaydi.

---

## 4. Papkalar tuzilmasi

```
.
├── CLAUDE.md                  # qisqa qoidalar + "docs/SPEC.md ni o'qi"
├── Dockerfile                 # 6-bosqichda: boshqa serverga ko'chish uchun zaxira variant
├── docs/
│   ├── SPEC.md                # shu hujjatning nusxasi
│   ├── PROGRESS.md            # bosqichlar checklisti
│   ├── DECISIONS.md           # qabul qilingan kichik qarorlar
│   ├── QA.md                  # qo'lda tekshirish ssenariylari
│   └── SETUP_UZ.md            # men uchun: akkauntlar, deploy, sozlash (o'zbekcha)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── scripts/
│   ├── bot-dev.ts             # lokal: webhook'ni o'chiradi va long polling'ni yoqadi
│   ├── set-webhook.ts         # production: webhook, bot buyruqlari, tavsif
│   └── cron-dev.ts            # lokal: har daqiqada cron endpoint'larni chaqiradi
├── messages/
│   ├── uz.json
│   └── ru.json
└── src/
    ├── app/
    │   ├── [locale]/
    │   │   ├── (marketing)/page.tsx            # landing
    │   │   ├── (marketing)/maxfiylik/page.tsx  # maxfiylik siyosati
    │   │   ├── (marketing)/shartlar/page.tsx   # foydalanish shartlari
    │   │   ├── b/[slug]/page.tsx               # biznes sahifasi + yozilish
    │   │   ├── b/[slug]/opengraph-image.tsx    # havola ulashilganda chiqadigan rasm
    │   │   ├── y/[token]/page.tsx              # mijoz: yozilishni boshqarish
    │   │   ├── login/page.tsx
    │   │   ├── onboarding/page.tsx
    │   │   ├── panel/...                        # 7.6-bo'lim
    │   │   └── admin/...                        # 7.7-bo'lim
    │   ├── api/
    │   │   ├── public/[slug]/slots/route.ts
    │   │   ├── public/[slug]/days/route.ts
    │   │   ├── public/[slug]/bookings/route.ts
    │   │   ├── public/bookings/[token]/route.ts
    │   │   ├── public/bookings/[token]/cancel/route.ts
    │   │   ├── public/bookings/[token]/ics/route.ts
    │   │   ├── auth/login-token/route.ts
    │   │   ├── auth/login-token/[token]/route.ts
    │   │   ├── auth/login-token/[token]/complete/route.ts
    │   │   ├── auth/logout/route.ts
    │   │   ├── telegram/webhook/route.ts
    │   │   ├── cron/reminders/route.ts
    │   │   └── cron/daily/route.ts
    │   ├── sitemap.ts
    │   └── robots.ts
    ├── bot/
    │   ├── bot.ts             # grammY instance, handlerlarni ulash
    │   ├── handlers/          # start.ts, callbacks.ts, commands.ts
    │   ├── keyboards.ts
    │   ├── texts/             # uz.ts, ru.ts
    │   └── send.ts            # xabar yuborish, 403 xatoni ushlash
    ├── components/            # ui/, booking/, panel/, marketing/
    ├── config/                # site.ts, plans.ts, categories.ts, regions.ts, service-templates.ts
    ├── i18n/                  # routing.ts, request.ts
    ├── lib/
    │   ├── db.ts              # Prisma client (singleton)
    │   ├── env.ts             # env o'zgaruvchilarini zod bilan tekshirish
    │   ├── auth/              # session.ts, guards.ts
    │   ├── telegram/          # init-data.ts (Mini App ma'lumotini tekshirish)
    │   ├── schedule.ts        # ish jadvali formati va validatsiyasi
    │   ├── slots.ts           # bo'sh vaqtlarni hisoblash (ENG MUHIM QISM)
    │   ├── bookings.ts        # yozilish yaratish, o'zgartirish, statuslar
    │   ├── reminders.ts       # eslatma vaqtlarini hisoblash va rejalashtirish
    │   ├── access.ts          # obuna holati va limitlar
    │   ├── notify.ts
    │   └── phone.ts, money.ts, slug.ts, time.ts, ics.ts, tokens.ts, rate-limit.ts
    └── middleware.ts
```

`src/lib/env.ts`: ilova ishga tushganda barcha kerakli env o'zgaruvchilarini zod bilan tekshiradi. Biror narsa yetishmasa — tushunarli xabar bilan to'xtaydi (masalan: `TELEGRAM_BOT_TOKEN topilmadi — .env.local faylini tekshiring`).

---

## 5. Ma'lumotlar bazasi

### 5.1. Prisma sxemasi

Bu sxemani asos qilib ol. Barcha `DateTime` maydonlar `@db.Timestamptz(3)` bo'lishi shart (vaqt zonasi bilan).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Locale {
  uz
  ru
}

enum MemberRole {
  OWNER
  MANAGER
}

enum Category {
  BARBERSHOP
  BEAUTY_SALON
  NAILS
  COSMETOLOGY
  MASSAGE
  DENTAL
  CLINIC
  CAR_WASH
  AUTO_SERVICE
  TUTOR
  FITNESS
  PHOTO_STUDIO
  OTHER
}

enum Region {
  TASHKENT_CITY
  TASHKENT_REGION
  ANDIJAN
  BUKHARA
  FERGANA
  JIZZAKH
  KHOREZM
  NAMANGAN
  NAVOI
  KASHKADARYA
  SAMARKAND
  SYRDARYA
  SURKHANDARYA
  KARAKALPAKSTAN
}

enum PlanCode {
  TRIAL
  START
  PRO
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  NO_SHOW
  CANCELLED_BY_CLIENT
  CANCELLED_BY_BUSINESS
}

enum BookingSource {
  WEB
  TELEGRAM
  PANEL
}

enum LoginTokenStatus {
  PENDING
  CONFIRMED
  REJECTED
  USED
}

enum MessageType {
  REMINDER_24H
  REMINDER_2H
}

enum MessageStatus {
  PENDING
  SENDING
  SENT
  FAILED
  CANCELLED
}

/// Biznes egalari va adminlar. Faqat Telegram orqali aniqlanadi.
model User {
  id               String       @id @default(cuid())
  telegramId       BigInt       @unique
  telegramUsername String?
  firstName        String
  lastName         String?
  phone            String?
  locale           Locale       @default(uz)
  sessionVersion   Int          @default(1)
  createdAt        DateTime     @default(now()) @db.Timestamptz(3)
  updatedAt        DateTime     @updatedAt @db.Timestamptz(3)
  memberships      Membership[]
}

model Membership {
  id         String     @id @default(cuid())
  userId     String
  businessId String
  role       MemberRole @default(OWNER)
  notify     Boolean    @default(true) /// Telegram bildirishnomalarini olsinmi
  createdAt  DateTime   @default(now()) @db.Timestamptz(3)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  business   Business   @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([userId, businessId])
  @@index([businessId])
}

model Business {
  id               String       @id @default(cuid())
  slug             String       @unique
  name             String
  category         Category
  region           Region
  district         String /// shahar yoki tuman, masalan "Chilonzor tumani"
  address          String
  landmark         String? /// mo'ljal, masalan "Chilonzor metrosi yonida"
  mapUrl           String? /// Google yoki Yandex xarita havolasi
  latitude         Float?
  longitude        Float?
  phone            String /// +998XXXXXXXXX
  telegramUsername String?
  instagram        String?
  description      String?
  logoUrl          String?
  timezone         String       @default("Asia/Tashkent")
  weeklySchedule   Json /// 5.3-bo'limdagi format
  slotStepMinutes  Int          @default(30) /// 15 | 30 | 60
  minLeadMinutes   Int          @default(60) /// hozirdan kamida necha daqiqa keyinga yozilish mumkin
  maxDaysAhead     Int          @default(30) /// necha kun oldinga yozilish mumkin
  autoConfirm      Boolean      @default(true) /// false bo'lsa, ega har bir yozilishni tasdiqlaydi
  cancelUntilHours Int          @default(2) /// mijoz tashrifdan necha soat oldingacha o'zi bekor qila oladi
  reminder24h      Boolean      @default(true)
  reminder2h       Boolean      @default(true)
  isPublished      Boolean      @default(false)
  isBlocked        Boolean      @default(false)
  isDemo           Boolean      @default(false)
  plan             PlanCode     @default(TRIAL)
  trialEndsAt      DateTime     @db.Timestamptz(3)
  paidUntil        DateTime?    @db.Timestamptz(3)
  featuredUntil    DateTime?    @db.Timestamptz(3) /// katalogda "TOP" (keyingi bosqich)
  referralCode     String       @unique
  referredById     String?
  createdAt        DateTime     @default(now()) @db.Timestamptz(3)
  updatedAt        DateTime     @updatedAt @db.Timestamptz(3)

  memberships Membership[]
  staff       Staff[]
  services    Service[]
  timeOffs    TimeOff[]
  clients     Client[]
  bookings    Booking[]
  payments    Payment[]

  @@index([region, category, isPublished])
}

model Staff {
  id             String         @id @default(cuid())
  businessId     String
  name           String
  position       String? /// "Barber", "Stilist" va h.k.
  photoUrl       String?
  telegramId     BigInt? /// keyingi bosqich: usta o'z yozilishlarini Telegram'da oladi
  weeklySchedule Json? /// null bo'lsa biznes jadvali ishlatiladi
  isActive       Boolean        @default(true)
  sortOrder      Int            @default(0)
  createdAt      DateTime       @default(now()) @db.Timestamptz(3)
  business       Business       @relation(fields: [businessId], references: [id], onDelete: Cascade)
  services       StaffService[]
  bookings       Booking[]
  timeOffs       TimeOff[]

  @@index([businessId])
}

model Service {
  id              String         @id @default(cuid())
  businessId      String
  nameUz          String
  nameRu          String?
  descriptionUz   String?
  descriptionRu   String?
  durationMinutes Int /// 5..480
  bufferMinutes   Int            @default(0) /// xizmatdan keyingi tayyorlanish vaqti
  price           Int /// so'mda, butun son; 0 = "Bepul"
  priceIsFrom     Boolean        @default(false) /// "... dan boshlab"
  isActive        Boolean        @default(true)
  sortOrder       Int            @default(0)
  createdAt       DateTime       @default(now()) @db.Timestamptz(3)
  business        Business       @relation(fields: [businessId], references: [id], onDelete: Cascade)
  staff           StaffService[]
  bookings        Booking[]

  @@index([businessId])
}

model StaffService {
  staffId   String
  serviceId String
  staff     Staff   @relation(fields: [staffId], references: [id], onDelete: Cascade)
  service   Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@id([staffId, serviceId])
}

/// Dam olish, bayram, ta'til. staffId null bo'lsa — butun biznes yopiq.
model TimeOff {
  id         String   @id @default(cuid())
  businessId String
  staffId    String?
  startsAt   DateTime @db.Timestamptz(3)
  endsAt     DateTime @db.Timestamptz(3)
  reason     String?
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  staff      Staff?   @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@index([businessId, startsAt])
}

model Client {
  id         String    @id @default(cuid())
  businessId String
  name       String
  phone      String /// +998XXXXXXXXX
  telegramId BigInt?
  notes      String? /// faqat biznes ko'radi
  createdAt  DateTime  @default(now()) @db.Timestamptz(3)
  updatedAt  DateTime  @updatedAt @db.Timestamptz(3)
  business   Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  bookings   Booking[]

  @@unique([businessId, phone])
  @@index([telegramId])
}

model Booking {
  id                  String             @id @default(cuid())
  businessId          String
  staffId             String
  serviceId           String
  clientId            String
  startsAt            DateTime           @db.Timestamptz(3)
  endsAt              DateTime           @db.Timestamptz(3) /// startsAt + davomiylik
  blockedUntil        DateTime           @db.Timestamptz(3) /// endsAt + buffer; to'qnashuv shu bilan tekshiriladi
  status              BookingStatus
  source              BookingSource
  serviceNameSnapshot String /// yozilish paytidagi nom (keyin xizmat o'zgarsa ham tarix buzilmaydi)
  priceSnapshot       Int
  durationSnapshot    Int
  clientComment       String?
  internalNote        String? /// faqat biznes ko'radi
  manageToken         String             @unique /// mijoz uchun maxfiy havola tokeni
  clientConfirmedAt   DateTime?          @db.Timestamptz(3) /// mijoz "Kelaman" bosgan vaqt
  cancelledAt         DateTime?          @db.Timestamptz(3)
  cancelReason        String?
  createdAt           DateTime           @default(now()) @db.Timestamptz(3)
  updatedAt           DateTime           @updatedAt @db.Timestamptz(3)
  business            Business           @relation(fields: [businessId], references: [id], onDelete: Cascade)
  staff               Staff              @relation(fields: [staffId], references: [id], onDelete: Restrict)
  service             Service            @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  client              Client             @relation(fields: [clientId], references: [id], onDelete: Cascade)
  messages            ScheduledMessage[]

  @@index([businessId, startsAt])
  @@index([staffId, startsAt])
  @@index([clientId])
}

/// Botga hech bo'lmasa bir marta yozgan har bir Telegram foydalanuvchisi.
model TelegramChat {
  telegramId BigInt   @id
  firstName  String?
  username   String?
  locale     Locale   @default(uz)
  isBlocked  Boolean  @default(false) /// foydalanuvchi botni bloklagan (403)
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  updatedAt  DateTime @updatedAt @db.Timestamptz(3)
}

model LoginToken {
  id          String           @id @default(cuid())
  token       String           @unique
  status      LoginTokenStatus @default(PENDING)
  telegramId  BigInt?
  createdAt   DateTime         @default(now()) @db.Timestamptz(3)
  expiresAt   DateTime         @db.Timestamptz(3)
  confirmedAt DateTime?        @db.Timestamptz(3)
}

model ScheduledMessage {
  id        String        @id @default(cuid())
  bookingId String
  chatId    BigInt
  type      MessageType
  sendAt    DateTime      @db.Timestamptz(3)
  status    MessageStatus @default(PENDING)
  attempts  Int           @default(0)
  lastError String?
  sentAt    DateTime?     @db.Timestamptz(3)
  createdAt DateTime      @default(now()) @db.Timestamptz(3)
  updatedAt DateTime      @updatedAt @db.Timestamptz(3)
  booking   Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@unique([bookingId, type])
  @@index([status, sendAt])
}

model Payment {
  id               String   @id @default(cuid())
  businessId       String
  amount           Int
  plan             PlanCode
  periodDays       Int      @default(30)
  method           String /// "click" | "payme" | "card" | "cash" | "other"
  note             String?
  recordedByUserId String?
  createdAt        DateTime @default(now()) @db.Timestamptz(3)
  business         Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId])
}

model RateLimit {
  key         String   @id
  count       Int      @default(0)
  windowStart DateTime @db.Timestamptz(3)
}
```

### 5.2. Qo'shimcha SQL (alohida migratsiya)

Prisma "exclusion constraint"ni bilmaydi, shuning uchun alohida migratsiya yarat: `npx prisma migrate dev --create-only --name booking_no_overlap` va ichiga yoz:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_time_check"
  CHECK ("endsAt" > "startsAt" AND "blockedUntil" >= "endsAt");

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startsAt", "blockedUntil", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));
```

Bu bir ustaga bir vaqtda ikkita yozilish tushishini **baza darajasida** imkonsiz qiladi, hatto ikki mijoz aynan bir soniyada bosgan bo'lsa ham. Bu xato Postgres'da `23P01` kodi bilan qaytadi (Prisma xatosining xabarida `23P01` yoki `Booking_no_overlap` bo'ladi). Uni ushlab, foydalanuvchiga "Bu vaqt hozirgina band bo'ldi" deb javob beramiz.

### 5.3. Ish jadvali formati (`weeklySchedule`)

```json
{
  "mon": { "open": true,  "start": "09:00", "end": "20:00", "breaks": [{ "start": "13:00", "end": "14:00" }] },
  "tue": { "open": true,  "start": "09:00", "end": "20:00", "breaks": [] },
  "wed": { "open": true,  "start": "09:00", "end": "20:00", "breaks": [] },
  "thu": { "open": true,  "start": "09:00", "end": "20:00", "breaks": [] },
  "fri": { "open": true,  "start": "09:00", "end": "20:00", "breaks": [] },
  "sat": { "open": true,  "start": "09:00", "end": "20:00", "breaks": [] },
  "sun": { "open": false, "start": "09:00", "end": "20:00", "breaks": [] }
}
```

Qoidalar (`src/lib/schedule.ts` dagi zod sxemasi tekshiradi):

- Vaqt formati `HH:MM`, daqiqalar 5 ga karrali.
- `start < end`, `end` ko'pi bilan `"24:00"`. Tungi smena (masalan 20:00–02:00) hozircha qo'llab-quvvatlanmaydi.
- Tanaffuslar `[start, end]` ichida, tartiblangan, bir-birini kesmaydi, ko'pi bilan 3 ta.
- Standart jadval: Du–Sh 09:00–20:00, yakshanba dam, tanaffussiz.
- `Staff.weeklySchedule` `null` bo'lsa, biznes jadvali ishlatiladi.

### 5.4. Hisoblanadigan statistika

Mijozning tashriflar soni, kelmay qolishlari, jami to'lagani va oxirgi tashrifi **alohida ustunlarda saqlanmaydi** — kerak bo'lganda `Booking` jadvalidan so'rov (`groupBy`/`aggregate`) bilan hisoblanadi. Bu hisoblagichlarning "chalkashib ketishi"ning oldini oladi.

### 5.5. O'chirish siyosati

- Yozilishlari bor usta yoki xizmat o'chirilmaydi — **arxivlanadi** (`isActive = false`). UI'da tugma "Arxivlash" deb ataladi.
- Biznes ma'lumotlari obuna tugaganda ham o'chirilmaydi.

---

## 6. Biznes-logika

### 6.1. Vaqt bilan ishlash

- Bazada barcha vaqtlar UTC'da (`timestamptz`).
- Ekranda va bot xabarlarida vaqt **biznesning vaqt zonasida** ko'rsatiladi (`Business.timezone`).
- Ish jadvalidagi vaqtlar mahalliy vaqt (`"09:00"`), ular kerakli sana uchun UTC'ga `@date-fns/tz` orqali aylantiriladi.
- "Bugun", "ertaga", hafta kuni — har doim biznes vaqt zonasi bo'yicha hisoblanadi, serverning vaqt zonasi bo'yicha emas.

### 6.2. Bo'sh vaqtlarni hisoblash (`src/lib/slots.ts`)

Bu tizimning eng muhim qismi. Bazaga murojaat qilmaydigan **toza funksiya** bo'lsin:

```ts
type SlotQuery = {
  business: { timezone: string; weeklySchedule: WeeklySchedule; slotStepMinutes: number; minLeadMinutes: number; maxDaysAhead: number };
  service: { durationMinutes: number; bufferMinutes: number };
  staff: Array<{ id: string; weeklySchedule: WeeklySchedule | null; sortOrder: number }>; // faqat faol va shu xizmatni bajaradiganlar
  date: string; // "YYYY-MM-DD", biznes vaqti bo'yicha
  busy: Array<{ staffId: string | null; start: Date; end: Date }>; // yozilishlar [startsAt, blockedUntil) + TimeOff (staffId null = hammasi)
  now: Date;
  options?: { ignoreWorkingHours?: boolean; ignoreLeadTime?: boolean }; // panelda ega uchun
};
type Slot = { time: string /* "HH:MM" */; startsAt: Date; staffIds: string[] };
function computeSlots(q: SlotQuery): Slot[];
```

Algoritm:

1. `date` bugundan oldin yoki `bugun + maxDaysAhead` dan keyin bo'lsa → bo'sh ro'yxat.
2. Har bir usta uchun: jadval = `staff.weeklySchedule ?? business.weeklySchedule`; shu hafta kunining sozlamasi `open: false` bo'lsa → bu ustada bo'sh vaqt yo'q.
3. Ish oralig'i `[start, end]` dan tanaffuslar olib tashlanadi → bir nechta ish oraliqlari hosil bo'ladi.
4. Nomzod vaqtlar **soatga tekislanadi**: kun boshidan `slotStepMinutes` qadam bilan (09:00, 09:30, 10:00...), har bir ish oralig'ining boshidan yoki undan keyingi birinchi qadamdan boshlanadi.
5. Nomzod `t` yaroqli, agar:
   - `[t, t + duration)` to'liq bitta ish oralig'i ichida bo'lsa (xizmat yopilish vaqtidan yoki tanaffusdan oshib ketmasin; buffer esa yopilishdan keyin chiqib ketishi mumkin);
   - `[t, t + duration + buffer)` shu ustaning band oraliqlari bilan ham, butun biznes `TimeOff`'lari bilan ham kesishmasa;
   - `t >= now + minLeadMinutes` bo'lsa.
6. Natija: bir xil vaqtlar birlashtiriladi, `staffIds` — shu vaqtda bo'sh bo'lgan ustalar. Vaqt bo'yicha tartiblanadi.
7. "Farqi yo'q" (istalgan usta) tanlanganda, yozilish yaratishda usta `pickStaff()` bilan tanlanadi: o'sha kuni faol yozilishlari eng kam bo'lgan usta; teng bo'lsa — `sortOrder` bo'yicha birinchisi.

Bazadan ma'lumot yuklash (`busy`, `staff`) alohida funksiyada. Yozilishni ko'chirishda (reschedule) ko'chirilayotgan yozilishning o'zi `busy` ro'yxatiga kiritilmaydi.

API:

- `GET /api/public/[slug]/slots?serviceId=...&staffId=any|<id>&date=YYYY-MM-DD` → `{ date, slots: [{ time, startsAt, staffIds }] }`
- `GET /api/public/[slug]/days?serviceId=...&staffId=any|<id>` → keyingi `DAYS_API_RANGE` kun uchun `[{ date, hasSlots }]` (bo'sh vaqti yo'q kunlar kulrang ko'rsatiladi)

### 6.3. Yozilish yaratish (`POST /api/public/[slug]/bookings`)

Kiruvchi ma'lumot (zod):

| Maydon | Qoida |
|---|---|
| `serviceId` | majburiy |
| `staffId` | `"any"` yoki usta ID'si |
| `startsAt` | ISO sana-vaqt |
| `name` | 2–60 belgi, bo'sh joylar tozalanadi |
| `phone` | 6.6-bo'lim bo'yicha normallashtiriladi |
| `comment` | ixtiyoriy, 300 belgigacha |
| `consent` | `true` bo'lishi shart |
| `website` | honeypot: yashirin maydon, bo'sh bo'lishi shart |
| `tgInitData` | ixtiyoriy, Telegram Mini App ichidan yozilganda |

Qadamlar:

1. Biznes topiladi; `isPublished` va obuna holati (6.9) tekshiriladi.
2. Spamdan himoya (6.10).
3. Tanlangan vaqt `computeSlots` natijasida haqiqatan borligi qayta tekshiriladi (klientga ishonilmaydi). `"any"` bo'lsa usta `pickStaff()` bilan tanlanadi.
4. `tgInitData` bo'lsa — 8.5-bo'lim bo'yicha tekshiriladi, Telegram ID olinadi, manba `TELEGRAM` bo'ladi; bo'lmasa `WEB`.
5. Tranzaksiya ichida: `Client` (businessId + phone bo'yicha) yaratiladi yoki topiladi; Telegram ID bo'lsa unga yoziladi; `Booking` yaratiladi: status `autoConfirm ? CONFIRMED : PENDING`, `manageToken`, snapshot maydonlari, `endsAt`, `blockedUntil`.
6. `23P01` xatosi kelsa: `"any"` holatida shu vaqtda bo'sh bo'lgan keyingi ustani sinab ko'r (ko'pi bilan 3 marta), aks holda `409 SLOT_TAKEN`.
7. Status `CONFIRMED` bo'lsa va mijozning Telegram ID'si bo'lsa — eslatmalar rejalashtiriladi (6.5).
8. Javobdan keyin `notifier.bookingCreated()` chaqiriladi. Next.js'dagi `after()` (`next/server`) dan foydalan, shunda mijoz kutib qolmaydi. Bildirishnoma xatosi yozilishni buzmasin — faqat log yoziladi.
9. Javob: `{ bookingId, manageToken, status, startsAt, telegramLink }`, bunda `telegramLink = https://t.me/<bot>?start=bk_<manageToken>`.

Xato kodlari (matnlari i18n orqali):

| HTTP | Kod | Mijozga ko'rinadigan ma'no |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Qaysi maydon noto'g'ri |
| 404 | `BUSINESS_NOT_FOUND` | Sahifa topilmadi |
| 403 | `BOOKING_DISABLED` | Onlayn yozilish vaqtincha mavjud emas, telefon qiling |
| 409 | `SLOT_TAKEN` | Bu vaqt hozirgina band bo'ldi, boshqasini tanlang |
| 422 | `TOO_MANY_ACTIVE_BOOKINGS` | Sizda allaqachon 3 ta faol yozilish bor |
| 429 | `TOO_MANY_REQUESTS` | Juda ko'p urinish, biroz kuting |

### 6.4. Yozilish statuslari

| Hozirgi | Keyingi | Kim | Natija |
|---|---|---|---|
| PENDING | CONFIRMED | Ega | Mijozga xabar, eslatmalar rejalashtiriladi |
| PENDING | CANCELLED_BY_BUSINESS | Ega (rad etish) | Mijozga xabar |
| PENDING | CANCELLED_BY_CLIENT | Mijoz | Egaga xabar |
| PENDING | CANCELLED_BY_BUSINESS (avtomatik) | Cron | `startsAt` o'tib ketgan va tasdiqlanmagan; `cancelReason = "AUTO_EXPIRED"`, xabar yuborilmaydi |
| CONFIRMED | COMPLETED | Ega yoki cron | Cron: `endsAt + AUTO_COMPLETE_AFTER_HOURS` dan keyin |
| CONFIRMED | NO_SHOW | Ega | — |
| CONFIRMED | CANCELLED_BY_CLIENT | Mijoz | Faqat `startsAt - cancelUntilHours` gacha; egaga xabar |
| CONFIRMED | CANCELLED_BY_BUSINESS | Ega | Mijozga xabar (sabab bilan, ixtiyoriy) |
| COMPLETED ↔ NO_SHOW | | Ega | Faqat `STATUS_EDIT_WINDOW_DAYS` ichida |
| Bekor qilingan | — | — | Yakuniy holat, qayta ochilmaydi (yangi yozilish yaratiladi) |

Bekor qilinganda kutilayotgan eslatmalar (`ScheduledMessage`, status `PENDING`) `CANCELLED` qilinadi. Barcha o'tishlar bitta joyda — `src/lib/bookings.ts` dagi `transitionBooking()` funksiyasida, ruxsat etilmagan o'tish xato qaytaradi.

**Ko'chirish (reschedule)** — faqat ega panelda qiladi: yangi sana, vaqt va usta tanlanadi, bo'sh vaqt qayta tekshiriladi, tranzaksiyada `startsAt/endsAt/blockedUntil/staffId` yangilanadi, eslatmalar qayta hisoblanadi, mijozga xabar boradi. Mijoz esa vaqtni o'zgartirish uchun bekor qilib, qaytadan yoziladi.

### 6.5. Eslatma vaqtlari (`src/lib/reminders.ts`)

Eslatmalar faqat `CONFIRMED` yozilish uchun va faqat mijozning Telegram ID'si bo'lsa yaratiladi. `ScheduledMessage` jadvaliga `(bookingId, type)` bo'yicha upsert qilinadi.

`QUIET_HOURS` yarim ochiq oraliq: `[22:00, 07:00)` — 22:00 tinch soatga kiradi, 07:00 esa kirmaydi.

```
eveningBefore(visit) = tashrif sanasidan oldingi kun, soat 20:00 (biznes vaqti)

REMINDER_24H (agar business.reminder24h):
  t = startsAt − 24 soat
  agar t QUIET_HOURS ichida bo'lsa → t = eveningBefore(startsAt)
  agar t <= now + 10 daqiqa:
      alt = eveningBefore(startsAt)
      agar alt > now + 10 daqiqa va alt < startsAt − 3 soat → t = alt
      aks holda → bu eslatma yaratilmaydi

REMINDER_2H (agar business.reminder2h):
  t = startsAt − 2 soat
  agar t QUIET_HOURS ichida bo'lsa yoki t <= now + 10 daqiqa → yaratilmaydi
```

Misollar (testlarga kirit):

| Yozilgan vaqt | Tashrif | 24H eslatma | 2H eslatma |
|---|---|---|---|
| Se 10:00 | Ch 15:00 | Se 15:00 | Ch 13:00 |
| Se 18:00 | Ch 09:00 | Se 20:00 | Ch 07:00 |
| Se 21:00 | Ch 10:00 | yo'q | Ch 08:00 |
| Se 10:00 | Se 15:00 | yo'q | Se 13:00 |
| Se 14:00 | Se 15:00 | yo'q | yo'q |
| Du 12:00 | Ju 23:30 | Pa 20:00 | Ju 21:30 |
| Du 12:00 | Ch 08:00 | Se 08:00 | yo'q (06:00 — tinch soatlar) |
| Du 12:00 | Ch 06:30 | Se 20:00 (06:30 — tinch soatlar) | yo'q |

24H eslatma matnidagi kun so'zi **yuborish paytida** hisoblanadi: tashrif ertaga bo'lsa — "Ertaga", bugun bo'lsa — "Bugun", aks holda sana.

`REMINDER_TEST_MODE=true` bo'lsa (faqat lokal), eslatmalar yozilishdan 1 va 2 daqiqa keyinga qo'yiladi — tez sinash uchun.

### 6.6. Telefon raqam (`src/lib/phone.ts`)

- Faqat O'zbekiston raqamlari: `+998` + 9 raqam.
- Qabul qilinadigan kiritishlar: `90 123 45 67`, `+998 90 123-45-67`, `998901234567`, `901234567`. Raqam bo'lmagan belgilar olib tashlanadi: 9 raqam bo'lsa oldiga `998` qo'shiladi; 12 raqam bo'lsa va `998` bilan boshlansa — qabul qilinadi; boshqa holatlarda xato.
- Bazada saqlash formati: `+998901234567`. Ekranda: `+998 90 123 45 67`.
- Operator kodlari ro'yxati bilan cheklama (ular o'zgarib turadi).
- Kiritish maydonida `+998` prefiksi oldindan yozilgan va o'zgarmaydigan bo'lsin, qolgan qism `90 123 45 67` maskasi bilan kiritiladi. Klaviatura: `inputMode="tel"`.

### 6.7. Pul va davomiylik (`src/lib/money.ts`, `src/lib/time.ts`)

- Pul har doim butun son (so'm). Ko'rinishi: `150 000 soʻm` (uz), `150 000 сум` (ru). Minglar ajratgichi — bo'linmaydigan bo'sh joy (U+202F yoki U+00A0), qator bo'linib ketmasin.
- `priceIsFrom = true` bo'lsa: `150 000 soʻmdan` / `от 150 000 сум`. Narx 0 bo'lsa: `Bepul` / `Бесплатно`.
- Davomiylik: `45 daqiqa`, `1 soat`, `1 soat 30 daqiqa` / `45 мин`, `1 ч`, `1 ч 30 мин`.

### 6.8. Slug (`src/lib/slug.ts`)

- Biznes nomidan avtomatik yasaladi, ega onboarding'da o'zgartira oladi.
- O'zbek lotin: `oʻ o' o‘ o\`` → `o`, `gʻ` → `g`. Kirill → lotin: а→a, б→b, в→v, г→g, ғ→g, д→d, е→e, ё→yo, ж→j, з→z, и→i, й→y, к→k, қ→q, л→l, м→m, н→n, о→o, ў→o, п→p, р→r, с→s, т→t, у→u, ф→f, х→x, ҳ→h, ц→ts, ч→ch, ш→sh, щ→sh, ъ/ь→"", ы→i, э→e, ю→yu, я→ya.
- Kichik harflar; `[a-z0-9]` dan boshqa belgilar `-` ga almashtiriladi; ketma-ket `-` birlashtiriladi; boshi va oxiridagi `-` olib tashlanadi; uzunligi 3–40 belgi.
- Bo'sh qolsa → `biznes`. Band bo'lsa → `-2`, `-3`, ...
- Taqiqlangan so'zlar: `admin`, `api`, `panel`, `login`, `onboarding`, `katalog`, `uz`, `ru`, `b`, `y`.
- **Muhim:** slug Telegram deep link'ida ishlatiladi (`biz_<slug>`), Telegram esa start parametrini 64 belgi va `A-Z a-z 0-9 _ -` bilan cheklaydi — yuqoridagi qoidalar bunga mos.

### 6.9. Obuna holati va limitlar (`src/lib/access.ts`)

```ts
getAccess(business, now) → { state: "TRIAL" | "ACTIVE" | "GRACE" | "EXPIRED" | "BLOCKED"; daysLeft: number; maxStaff: number }
```

- `BLOCKED`: `isBlocked = true`.
- `TRIAL`: `now < trialEndsAt` va `paidUntil` yo'q yoki o'tib ketgan.
- `ACTIVE`: `paidUntil` bor va `now < paidUntil`.
- `GRACE`: oxirgi muddat (`paidUntil` yoki `trialEndsAt`) o'tgan, lekin `GRACE_DAYS` ichida.
- `EXPIRED`: qolgan holatlar.

`EXPIRED` va `BLOCKED` holatlarida **faqat yangi onlayn yozilishlar** o'chadi: ommaviy sahifada "Onlayn yozilish vaqtincha mavjud emas. Qo'ng'iroq qiling: {telefon}" ko'rsatiladi. Panel ochiladi (to'lov sahifasi va banner bilan), mavjud yozilishlarning eslatmalari yuborilaveradi. Ma'lumotlar o'chirilmaydi.

`src/config/plans.ts`:

```ts
export const PLANS = {
  TRIAL: { priceSom: 0,       maxStaff: 5 },
  START: { priceSom: 99_000,  maxStaff: 1 },
  PRO:   { priceSom: 199_000, maxStaff: 5 },
} as const;
```

Limitdan ortiq faol usta qo'shishga urinilsa — tushunarli xabar va "Tarifni oshirish" tugmasi chiqadi. 5 tadan ortiq usta kerak bo'lsa — "Biz bilan bog'laning".

### 6.10. Spamdan himoya (`src/lib/rate-limit.ts`)

- `RateLimit` jadvali orqali oddiy hisoblagich: `rateLimit(key, limit, windowSeconds)`, tranzaksiyada: oyna eskirgan bo'lsa → `count = 1`, aks holda `count + 1`.
- Kalitlar va limitlar: `book:ip:<ip>` — soatiga 10; `login:ip:<ip>` — soatiga 10; `cancel:ip:<ip>` — soatiga 20.
- IP: `x-forwarded-for` sarlavhasining birinchi qiymati.
- Bitta telefon raqamidan bitta biznesga kelajakdagi faol yozilishlar soni — ko'pi bilan `MAX_ACTIVE_BOOKINGS_PER_PHONE`.
- Honeypot maydon (`website`) to'ldirilgan bo'lsa — umumiy xato qaytariladi, sababi aytilmaydi.

### 6.11. Tokenlar (`src/lib/tokens.ts`)

- `randomToken()` — 24 bayt kriptografik tasodifiy son, base64url ko'rinishida (32 belgi). Bu `manageToken` va login tokeni uchun ishlatiladi.
- Telegram cheklovlariga mos: `bk_` + 32 belgi = 35 belgi (64 dan kam), callback ma'lumotlari ham 64 baytdan oshmaydi.

---

## 7. Sahifalar

### 7.0. Umumiy

- Barcha sahifalar **mobil uchun birinchi** (360 px kenglikda mukammal ko'rinsin), keyin planshet va kompyuter.
- Header (ommaviy sahifalarda): logotip/brend nomi, til almashtirgich (`UZ | RU`), "Kirish" tugmasi.
- Til next-intl orqali, `localePrefix: "as-needed"`: o'zbekcha prefikssiz (`/b/ali`), ruscha `/ru/b/ali`.
- URL segmentlari ikkala tilda ham bir xil (o'zbekcha): `/panel/kalendar`, `/ru/panel/kalendar`.

### 7.1. Landing (`/`)

Biznes egalari uchun reklama sahifasi. Bo'limlar va matnlar (o'zbekcha; ruschasini tabiiy tarjima qil):

**Hero**
- Sarlavha: "Mijozlaringiz endi qoʻngʻiroqsiz yoziladi"
- Matn: "Sartaroshxona, salon, klinika va avtoservislar uchun onlayn navbat. Mijoz saytdan yoki Telegramdan 30 soniyada yoziladi, bot esa unga oʻzi eslatib turadi."
- Tugmalar: "14 kun bepul boshlash" (→ `/login`), "Demoni koʻrish" (→ `/b/demo-barber`)
- Kichik matn: "Karta talab qilinmaydi · 5 daqiqada sozlanadi"
- O'ng tomonda (mobilda pastda): telefon ramkasidagi yozilish sahifasining sxematik ko'rinishi (CSS bilan chizilgan, og'ir rasm emas).

**Muammolar** (3 ta karta)
- "📞 Telefon tinmaydi" — "Ish paytida qoʻngʻiroqlarga javob berish chalgʻitadi, javob olmagan mijoz esa boshqa joyga ketadi."
- "🚫 Mijoz kelmay qoladi" — "Unutib qoʻygan mijoz — boʻsh qolgan vaqt va yoʻqotilgan pul."
- "📒 Daftar chalkashadi" — "Bir vaqtga ikki kishi yozilib qoladi, kim qachon kelishini topish qiyin."

**Qanday ishlaydi** (3 qadam)
1. "Roʻyxatdan oʻting" — "Xizmatlar, narxlar va ish vaqtini kiriting. 5 daqiqa vaqt oladi."
2. "Havolani ulashing" — "Havolani Instagram, Telegram kanal va xaritaga qoʻying, QR kodni esa devorga osib qoʻying."
3. "Mijozlarni qabul qiling" — "Yangi yozilishlar Telegramingizga keladi, eslatmalarni bot oʻzi yuboradi."

**Imkoniyatlar** (6 ta)
- "Onlayn yozilish 24/7" — "Mijozlar tunda ham, dam olish kunida ham yoziladi."
- "Telegram eslatmalar" — "Tashrifdan 1 kun va 2 soat oldin. SMS kerak emas — bepul."
- "Ustalar jadvali" — "Har bir usta uchun alohida ish vaqti va dam olish kunlari."
- "Mijozlar bazasi" — "Kim necha marta kelgani, qancha toʻlagani va izohlar."
- "Daromad statistikasi" — "Kunlik va oylik tushum bir qarashda."
- "Oʻzbek va rus tillarida" — "Mijoz oʻziga qulay tilni tanlaydi."

**Narxlar** (`plans.ts` dan olinadi)
- Start — 99 000 soʻm/oy: "1 usta", "Cheksiz yozilishlar", "Telegram eslatmalar", "Mijozlar bazasi"
- Pro — 199 000 soʻm/oy: "5 tagacha usta", "Start'dagi hamma narsa", "Ustalar boʻyicha statistika"
- Ostida: "Ikkala tarifda ham 14 kun bepul sinov. 5 tadan koʻp usta kerakmi? Biz bilan bogʻlaning."

**Ko'p beriladigan savollar** (accordion)
- "Mijozlarim biror ilova yuklashi kerakmi?" — "Yoʻq. Mijoz havolani bosadi va saytda yoki Telegramning oʻzida yoziladi."
- "Telefon orqali yoziladigan mijozlar-chi?" — "Ularni panelga oʻzingiz 10 soniyada qoʻshasiz. Butun navbat bir joyda boʻladi."
- "Eslatma qanday yuboriladi?" — "Telegram bot orqali: tashrifdan 1 kun va 2 soat oldin. Bu bepul, SMS kerak emas."
- "Toʻlovni qanday qilaman?" — "Click, Payme yoki karta orqali, oyma-oy."
- "Obunani toʻxtatsam maʼlumotlarim oʻchib ketadimi?" — "Yoʻq, barcha maʼlumotlaringiz saqlanib qoladi."

**Yakuniy chaqiriq:** "Bugun boshlang — birinchi 14 kun bepul" + tugma.

**Footer:** `© {yil} {Brand}`, "Maxfiylik siyosati", "Foydalanish shartlari", "Telegram orqali yordam" (→ `https://t.me/<support>`).

### 7.2. Biznes sahifasi va yozilish (`/b/[slug]`)

Server-render qilinadi (tez ochilishi uchun). Bo'sh vaqtlar klientda API orqali olinadi.

**Yuqori qism**
- Logotip yoki bosh harfli rangli doira (rang nomdan deterministik tanlanadi), biznes nomi, kategoriya.
- Bugungi holat: "Hozir ochiq · 20:00 gacha" yoki "Hozir yopiq · ertaga 09:00 da ochiladi" (biznes vaqt zonasi bo'yicha).
- Manzil + mo'ljal, "Xaritada ochish" (agar `mapUrl` bo'lsa), "Qoʻngʻiroq qilish" (`tel:`), Telegram (agar `telegramUsername` bo'lsa).
- "Telegram orqali yozilish" havolasi → `https://t.me/<bot>?start=biz_<slug>`.
- Haftalik ish vaqti (yig'iladigan blok).

**Xizmatlar ro'yxati:** nomi, davomiyligi, narxi; har birida "Yozilish" tugmasi.

**Yozilish bosqichlari** (bitta sahifada, ketma-ket ochiladigan qadamlar, har birida "Orqaga" tugmasi):

1. **Xizmat** — "Xizmatni tanlang". `?s=<serviceId>` parametri bo'lsa, xizmat oldindan tanlanadi (ega aniq xizmatga havola ulasha oladi).
2. **Usta** — "{staffLabel}ni tanlang" (kategoriyaga mos so'z, 7.5-bo'limdagi jadvaldan). Birinchi variant: "Farqi yoʻq — birinchi boʻsh {staffLabel}". Shu xizmatni bajaradigan bitta usta bo'lsa — bu qadam o'tkazib yuboriladi.
3. **Sana** — gorizontal aylanadigan tasma, `DAYS_API_RANGE` kun: hafta kuni qisqartmasi (Du, Se, Ch, Pa, Ju, Sh, Ya) va kun raqami. Bo'sh vaqti yo'q kunlar kulrang va bosilmaydi.
4. **Vaqt** — vaqtlar to'ri, guruhlarga ajratilgan: "Ertalab" (12:00 gacha), "Kunduzi" (12:00–17:00), "Kechqurun" (17:00 dan). Bo'sh vaqt bo'lmasa: "Bu kunga boʻsh vaqt yoʻq. Boshqa kunni tanlang."
5. **Ma'lumotlar** — "Ismingiz", "Telefon raqamingiz", "Izoh (ixtiyoriy)", belgi: "Shaxsiy maʼlumotlarimni qayta ishlashga roziman" (maxfiylik siyosatiga havola bilan). Tugma: "Yozilish".
6. **Tasdiq** — xulosa (xizmat, usta, sana, vaqt, narx, manzil) va tugmalar:
   - "📲 Telegram orqali eslatma olish" → `telegramLink` (asosiy, eng ko'zga tashlanadigan tugma; ostida: "Tashrifdan oldin eslatib turamiz");
   - "📅 Kalendarga qoʻshish" → `.ics` fayl;
   - "Yozilishni boshqarish" → `/y/<token>`.
   - Status `PENDING` bo'lsa sarlavha: "Soʻrovingiz yuborildi" va "Biznes tasdiqlagach xabar beramiz".

**Holatlar:**
- Yuklanayotganda — skeleton.
- `409 SLOT_TAKEN` — xabar va avtomatik ravishda vaqt tanlash qadamiga qaytish (ro'yxat yangilanadi).
- `BOOKING_DISABLED` — xizmatlar ro'yxati ko'rinadi, lekin yozilish tugmalari o'rniga: "Onlayn yozilish vaqtincha mavjud emas. Qoʻngʻiroq qiling: {telefon}".
- Biznes nashr qilinmagan bo'lsa — 404.

**Telegram Mini App rejimi** (8.5-bo'lim): sahifa Telegram ichida ochilganda header va footer yashiriladi, ism oldindan to'ldiriladi, Android "orqaga" tugmasi `WebApp.BackButton` orqali oldingi qadamga qaytaradi, tasdiq ekranida "Yopish" tugmasi (`WebApp.close()`) chiqadi va bot darhol tasdiq xabarini yuboradi.

### 7.3. Yozilishni boshqarish (`/y/[token]`)

- Token bo'yicha yozilish topiladi (ID orqali emas — begona yozilishni ko'rib bo'lmasin). Topilmasa: "Yozilish topilmadi".
- Ko'rsatiladi: biznes, xizmat, usta, sana va vaqt, narx, manzil, status nishoni ("Tasdiqlangan", "Tasdiq kutilmoqda", "Bekor qilingan", "Yakunlangan").
- Tugmalar: "Bekor qilish" (tasdiqlash oynasi + ixtiyoriy sabab), "Kalendarga qoʻshish", "Telegram orqali eslatma olish" (agar ulanmagan bo'lsa), "Qayta yozilish" (→ biznes sahifasi).
- Bekor qilishga kech bo'lsa: "Tashrifga {N} soatdan kam vaqt qoldi. Bekor qilish uchun qoʻngʻiroq qiling: {telefon}".
- `.ics` fayl: `VEVENT`, `DTSTART`/`DTEND` UTC'da, `SUMMARY` = "{xizmat} — {biznes}", `LOCATION` = manzil, `DESCRIPTION` = boshqarish havolasi.

### 7.4. Kirish (`/login`)

Biznes egalari faqat Telegram orqali kiradi (parol yo'q, SMS yo'q — bepul va O'zbekistonda hamma Telegram'da).

1. Foydalanuvchi "Telegram orqali kirish" tugmasini bosadi.
2. Server `LoginToken` yaratadi (`PENDING`, `LOGIN_TOKEN_TTL_MIN` daqiqa amal qiladi) va qaytaradi.
3. Sahifada ko'rsatiladi: "Telegramni ochish" tugmasi (`https://t.me/<bot>?start=login_<token>`), kompyuterdan kirganlar uchun shu havolaning **QR kodi** ("Telefoningiz kamerasi bilan skanerlang"), qolgan vaqt hisoblagichi.
4. Bot `/start login_<token>` ni oladi va **tasdiqlash tugmalari bilan ogohlantirish** yuboradi (8.6-bo'lim). Bu muhim: kimdir boshqa odamga o'z login havolasini yuborib, uning akkauntiga kirib olishiga yo'l qo'ymaydi.
5. "Tasdiqlash" bosilgach: `User` yaratiladi yoki yangilanadi (Telegram ID, ism, username), token `CONFIRMED` bo'ladi, `telegramId` yoziladi.
6. Sahifa har 2 soniyada holatni so'raydi. `CONFIRMED` bo'lishi bilan `complete` endpoint'i tokenni `USED` qiladi va sessiya cookie'sini o'rnatadi.
7. Yo'naltirish: biznesi yo'q bo'lsa → `/onboarding`, bor bo'lsa → `/panel`.
8. Muddat tugasa: "Havola muddati tugadi" + "Qaytadan urinish" tugmasi. Rad etilsa: "Kirish rad etildi".

### 7.5. Onboarding (`/onboarding`)

5 qadamli sehrgar, yuqorida progress ko'rsatkichi. Har bir qadam serverga saqlanadi (sahifa yangilansa ham ma'lumot yo'qolmaydi).

1. **Biznes** — nomi, kategoriya, viloyat, shahar/tuman, manzil, mo'ljal, telefon (egasining Telegram'dagi ismi bilan salomlashuv: "Xush kelibsiz, {ism}!").
2. **Ish vaqti** — 7 kun; har kunda ochiq/yopiq tugmasi, boshlanish/tugash (15 daqiqa qadamli tanlov), "Tanaffus qoʻshish", "Barcha kunlarga nusxalash". Standart: Du–Sh 09:00–20:00.
3. **Xizmatlar** — tanlangan kategoriya uchun **tayyor shablonlar** belgilangan holda chiqadi (quyidagi jadval), ega keraksizini olib tashlaydi, narx va vaqtni o'zgartiradi, yangisini qo'shadi. Narxlar faqat namuna — ega o'zgartiradi.
4. **Ustalar** — kamida bitta (standart nomi — egasining ismi), har biriga qaysi xizmatlarni bajarishi (standart — hammasi).
5. **Tayyor!** — havola (`{APP_URL}/b/{slug}`), "Nusxalash", "Telegram havolasi", QR kodni yuklab olish, "QR-posterni chop etish", slug'ni o'zgartirish imkoniyati, "Sahifani nashr qilish" tugmasi → `/panel`.

Yangi biznes yaratilganda: `trialEndsAt = now + TRIAL_DAYS`, `plan = TRIAL`, `referralCode` yaratiladi, egaga `Membership(OWNER)`, adminlarga Telegram xabari ("🆕 Yangi biznes: ...").

**Xizmat shablonlari** (`src/config/service-templates.ts`):

| Kategoriya | Xizmatlar (davomiylik, namunaviy narx) |
|---|---|
| BARBERSHOP | Soch olish (30 daq, 50 000), Soqol olish (20 daq, 30 000), Soch + soqol (45 daq, 70 000), Bolalar soch olish (30 daq, 40 000) |
| BEAUTY_SALON | Ayollar soch olish (60 daq, 100 000), Soch boʻyash (120 daq, 250 000 dan), Ukladka (45 daq, 80 000), Qosh dizayni (30 daq, 50 000) |
| NAILS | Manikyur (60 daq, 80 000), Gel-lak bilan manikyur (90 daq, 150 000), Pedikyur (60 daq, 120 000) |
| COSMETOLOGY | Yuz tozalash (60 daq, 200 000), Konsultatsiya (30 daq, 100 000) |
| MASSAGE | Klassik massaj (60 daq, 200 000), Bel massaji (30 daq, 100 000) |
| DENTAL | Koʻrik va konsultatsiya (30 daq, 100 000), Tish tozalash (60 daq, 300 000), Plomba (60 daq, 300 000 dan) |
| CLINIC | Shifokor qabuli (30 daq, 150 000) |
| CAR_WASH | Kuzov yuvish (30 daq, 60 000), Kompleks yuvish (60 daq, 120 000), Salonni kimyoviy tozalash (180 daq, 600 000 dan) |
| AUTO_SERVICE | Diagnostika (60 daq, 150 000), Moy almashtirish (30 daq, 50 000 dan), Shinomontaj (40 daq, 80 000) |
| TUTOR | Individual dars (60 daq, 150 000), Sinov darsi (30 daq, bepul) |
| FITNESS | Shaxsiy mashgʻulot (60 daq, 150 000) |
| PHOTO_STUDIO | Fotosessiya (60 daq, 400 000) |
| OTHER | (shablonsiz) |

**Kategoriyalar, "usta" so'zi va viloyatlar** (`categories.ts`, `regions.ts`):

| Kod | O'zbekcha | Ruscha | "Usta" o'rniga (uz / ru) |
|---|---|---|---|
| BARBERSHOP | Sartaroshxona | Барбершоп | Usta / Мастер |
| BEAUTY_SALON | Goʻzallik saloni | Салон красоты | Usta / Мастер |
| NAILS | Manikyur va pedikyur | Маникюр и педикюр | Usta / Мастер |
| COSMETOLOGY | Kosmetologiya | Косметология | Mutaxassis / Специалист |
| MASSAGE | Massaj | Массаж | Massajchi / Массажист |
| DENTAL | Stomatologiya | Стоматология | Shifokor / Врач |
| CLINIC | Klinika va shifokorlar | Клиника и врачи | Shifokor / Врач |
| CAR_WASH | Avtomoyka | Автомойка | Boks / Бокс |
| AUTO_SERVICE | Avtoservis | Автосервис | Usta / Мастер |
| TUTOR | Repetitor va kurslar | Репетиторы и курсы | Oʻqituvchi / Преподаватель |
| FITNESS | Fitnes va trenerlar | Фитнес и тренеры | Trener / Тренер |
| PHOTO_STUDIO | Fotostudiya | Фотостудия | Fotograf / Фотограф |
| OTHER | Boshqa | Другое | Mutaxassis / Специалист |

Viloyatlar: Toshkent shahri / г. Ташкент; Toshkent viloyati / Ташкентская область; Andijon viloyati / Андижанская область; Buxoro viloyati / Бухарская область; Fargʻona viloyati / Ферганская область; Jizzax viloyati / Джизакская область; Xorazm viloyati / Хорезмская область; Namangan viloyati / Наманганская область; Navoiy viloyati / Навоийская область; Qashqadaryo viloyati / Кашкадарьинская область; Samarqand viloyati / Самаркандская область; Sirdaryo viloyati / Сырдарьинская область; Surxondaryo viloyati / Сурхандарьинская область; Qoraqalpogʻiston Respublikasi / Республика Каракалпакстан.

### 7.6. Biznes paneli (`/panel/...`)

Mobilda pastki menyu: **Bugun · Kalendar · ➕ · Mijozlar · Yana**. Kompyuterda chap tomonda yon menyu. "➕" — har doim "Yozilish qoʻshish" oynasini ochadi. Tasdiq kutayotgan yozilishlar soni menyuda nishon bilan ko'rinadi.

Obuna `TRIAL` (oxirgi 3 kun), `GRACE` yoki `EXPIRED` holatida yuqorida banner: "Sinov muddati {N} kundan keyin tugaydi" / "Obuna tugadi — onlayn yozilish oʻchirilgan" + "Toʻlash" tugmasi.

**`/panel` — Bugun**
- Kartochkalar: bugungi yozilishlar soni, tasdiq kutayotganlar, shu hafta tushum (`COMPLETED` va bugungi `CONFIRMED` narxlari yig'indisi), shu oy saytdan/Telegramdan kelgan yozilishlar soni ("Bu oy {N} ta mijoz onlayn yozildi" — bu egaga platformaning foydasini ko'rsatadi, obunani davom ettirishga undaydi).
- "Tasdiq kutayotganlar" bloki (agar bo'lsa): har birida "Tasdiqlash" / "Rad etish".
- Bugungi yozilishlar ro'yxati vaqt bo'yicha: vaqt, mijoz ismi, xizmat, usta, status nishoni, mijoz "Kelaman" bosgan bo'lsa ✅ belgisi, mijozda Telegram ulanmagan bo'lsa 📵 belgisi ("eslatma bormaydi — qoʻngʻiroq qiling"). Tez amallar: "Keldi", "Kelmadi", "Bekor qilish".

**`/panel/kalendar` — Kalendar**
- Kun ko'rinishi: har bir usta uchun alohida ustun, vaqt o'qi (1 soat = 64 px, 15 daqiqalik chiziqlar), ish vaqtidan tashqari va tanaffuslar xiralashtirilgan, hozirgi vaqt — qizil chiziq.
- Yozilish bloklari status rangida: CONFIRMED — asosiy rang, PENDING — sariq, COMPLETED — yashil (xira), NO_SHOW — qizil (xira); bekor qilinganlar standart bo'yicha yashirin ("Bekor qilinganlarni koʻrsatish" tugmasi).
- Bo'sh joy bosilsa → shu usta va vaqt bilan "Yozilish qoʻshish". Blok bosilsa → o'ng tomondan (mobilda pastdan) tafsilotlar paneli: mijoz (ism, telefon — `tel:` havola, Telegram belgisi), xizmat, narx, izohlar, ichki izoh tahriri, status tugmalari, "Vaqtini oʻzgartirish", "Mijozga xabar matnini nusxalash".
- Hafta ko'rinishi: tanlangan usta uchun 7 ustun.
- Mobilda: usta tanlash tugmalari + bitta ustun.
- Kalendar uchun pullik kutubxona ishlatilmaydi (2-bo'lim).

**"Yozilish qoʻshish" oynasi**
- Mijoz: ism yoki telefon bo'yicha qidiruv (mavjud mijozlar) yoki yangi mijoz (ism + telefon).
- Xizmat, usta, sana, vaqt (bo'sh vaqtlar ko'rsatiladi; "Ish vaqtidan tashqari" belgisi bilan ega istalgan vaqtni tanlay oladi — `ignoreWorkingHours`, lekin boshqa yozilish bilan to'qnashuv baribir taqiqlanadi).
- Manba `PANEL`, status `CONFIRMED`.
- Saqlangandan keyin: "Mijozga xabar yuborish" — tayyor matnni nusxalash: "Assalomu alaykum! Siz {sana} soat {vaqt} da {biznes}ga yozildingiz. Eslatma olish uchun: {telegramLink}".

**`/panel/yozilishlar` — Yozilishlar**
- Jadval (mobilda kartochkalar): sana/vaqt, mijoz, xizmat, usta, narx, status, manba.
- Filtrlar: sana oralig'i, usta, status, manba; mijoz ismi yoki telefoni bo'yicha qidiruv; sahifalash (har sahifada 30 ta).

**`/panel/mijozlar` — Mijozlar**
- Qidiruv, ro'yxat: ism, telefon, tashriflar soni, oxirgi tashrif, kelmay qolishlar, jami to'lagan (hisoblanadigan, 5.4).
- Mijoz sahifasi: tashriflar tarixi, ichki izoh, Telegram ulangan-ulanmagani, "Qoʻngʻiroq qilish", "Yozilish qoʻshish".

**`/panel/xizmatlar` — Xizmatlar**
- Ro'yxat (yuqoriga/pastga surish tugmalari bilan tartiblash), qo'shish/tahrirlash oynasi: nomi (uz, ru ixtiyoriy), tavsif, davomiylik, buffer, narx, "dan boshlab", qaysi ustalar bajaradi, faol/arxiv.

**`/panel/ustalar` — Ustalar**
- Ro'yxat, qo'shish/tahrirlash: ism, lavozim, xizmatlar, shaxsiy ish vaqti ("Biznes jadvali bilan bir xil" yoki o'zining), dam olish kunlari va ta'tillar (`TimeOff`: sana oralig'i + sabab), faol/arxiv. Tarif limiti tekshiriladi.

**`/panel/sozlamalar` — Sozlamalar** (tablar)
- **Profil:** biznes ma'lumotlari, xarita havolasi, Instagram, Telegram, tavsif.
- **Ish vaqti:** jadval muharriri + "Biznes yopiq kunlari" (bayramlar, masalan Navroʻz, Hayit — `TimeOff` butun biznes uchun).
- **Yozilish qoidalari:** vaqt qadami (15/30/60), eng kamida necha daqiqa oldin, necha kun oldinga, avtomatik tasdiqlash, mijoz necha soat oldingacha bekor qila oladi.
- **Bildirishnomalar:** 24 soatlik va 2 soatlik eslatmalar yoqilgan/o'chirilgan; egalar Telegram bildirishnomalarini olsinmi.
- **Havola va QR:** havolalar (sayt va Telegram), nusxalash, QR yuklab olish (PNG), "QR-posterni chop etish", "Sahifani nashr qilish/yashirish". Nashr qilish uchun kamida 1 ta faol xizmat va 1 ta faol usta bo'lishi kerak — yetishmasa, nima yetishmasligi ko'rsatiladi.

**`/panel/qr` — QR-poster** (chop etish uchun, A5/A4, `@media print`)
- Biznes nomi, "Navbatga onlayn yoziling", katta QR kod (`/b/{slug}`), "Telefoningiz kamerasini QR kodga qarating", pastda kichik brend nomi. Bu viloyatlarda yangi mijozlarni jalb qilishning eng arzon yo'li — devorga osiladi.

**`/panel/obuna` — Obuna**
- Joriy tarif, holat, necha kun qolgani, tariflar jadvali.
- To'lov ko'rsatmasi (`PAYMENT_INSTRUCTIONS_UZ/RU` dan).
- "Toʻladim" tugmasi → adminlarga Telegram xabari ("💳 {biznes} toʻlov qilganini aytdi..."), egaga: "Rahmat! Toʻlov tekshirilgach obuna uzaytiriladi."
- To'lovlar tarixi.

**Chiqish:** menyuda "Chiqish" va "Barcha qurilmalardan chiqish" (`sessionVersion` oshiriladi).

### 7.7. Admin panel (`/admin`) — faqat men uchun

Kirish: Telegram ID'si `ADMIN_TELEGRAM_IDS` ro'yxatida bo'lgan foydalanuvchilar.

- **Statistika:** jami bizneslar, nashr qilinganlar, sinovdagilar, to'layotganlar, muddati o'tganlar, oylik daromad (MRR: `ACTIVE` bizneslar tarif narxlari yig'indisi), oxirgi 30 kundagi yozilishlar, shu haftadagi yangi bizneslar.
- **Bizneslar jadvali:** nom, kategoriya, viloyat, tarif, holat, `paidUntil`, oxirgi 30 kundagi yozilishlar, yaratilgan sana; filtrlar va qidiruv.
- **Biznes sahifasi:** ma'lumotlar, egalari (Telegram username bilan), to'lovlar tarixi, amallar:
  - "Toʻlov qoʻshish": summa, tarif, kunlar (standart 30), usul, izoh → `paidUntil = max(now, paidUntil) + kunlar`, `plan` yangilanadi, `Payment` yoziladi, egaga Telegram xabari "✅ Toʻlov qabul qilindi...".
  - "Bloklash / Blokdan chiqarish".
  - "TOP qilish" (`featuredUntil`) — katalog uchun, keyinroq ishlatiladi.

### 7.8. Huquqiy sahifalar

- `/maxfiylik` — maxfiylik siyosati: qanday ma'lumot yig'iladi (ism, telefon, Telegram ID), nima uchun (yozilish va eslatma), kim ko'radi (faqat tegishli biznes), qancha saqlanadi, ma'lumotni o'chirishni qanday so'rash mumkin (yordam Telegram'i orqali).
- `/shartlar` — foydalanish shartlari: platforma vositachi ekani, biznes o'z xizmatlari uchun javobgar, obuna va to'lov shartlari.
- Ikkala sahifa tepasida: "Loyiha matni. Yurist tomonidan tekshirilishi kerak." (bu yozuvni men keyin olib tashlayman).

### 7.9. Xato sahifalari

- 404: "Sahifa topilmadi" + "Bosh sahifaga qaytish".
- 500: "Nimadir xato ketdi. Birozdan keyin qayta urinib koʻring."

---

## 8. Telegram bot

### 8.1. Umumiy

- Kutubxona: grammY. Production: `POST /api/telegram/webhook`, grammY'ning App Router uchun adapteri bilan (hozirgi hujjatdagi to'g'ri adapterni tekshir). `X-Telegram-Bot-Api-Secret-Token` sarlavhasi `TELEGRAM_WEBHOOK_SECRET` ga teng bo'lmasa → 401.
- Lokal: `npm run bot:dev` — test botning webhook'ini o'chiradi va long polling'ni yoqadi (xuddi shu handlerlar).
- Barcha xabarlar `parse_mode: "HTML"`. Foydalanuvchi kiritgan har qanday matn (ism, izoh, biznes nomi) `<`, `>`, `&` belgilari bo'yicha **ekranlanadi**.
- Har bir yangilanishda `TelegramChat` upsert qilinadi (ism, username). Yangi foydalanuvchining tili: Telegram `language_code` `ru` bo'lsa — `ru`, aks holda `uz`.
- **Telegram cheklovlari:**
  - inline URL tugmalarida faqat `http(s)://` va `tg://` havolalar ishlaydi — `tel:` mumkin emas, shuning uchun telefon raqami matnda yoziladi;
  - Telegram `localhost` havolalarini tugmalarda qabul qilmaydi — `APP_URL` `https` bo'lmasa, URL tugmalar qo'shilmaydi (`urlButton()` yordamchi funksiyasi `null` qaytaradi);
  - `web_app` tugmalari faqat HTTPS bilan ishlaydi — lokal'da Mini App'ni sinash uchun bepul tunnel (masalan, `cloudflared tunnel --url http://localhost:3000`) yoki Vercel preview ishlatiladi;
  - `callback_data` 64 baytgacha, start parametri 64 belgigacha.

### 8.2. Deep link'lar (`/start <parametr>`)

| Parametr | Kim uchun | Nima qiladi |
|---|---|---|
| (yo'q) | Hamma | Salomlashuv va asosiy menyu |
| `biz_<slug>` | Mijoz | Biznes kartochkasi + "📅 Yozilish" (Mini App) tugmasi |
| `bk_<manageToken>` | Mijoz | Yozilishni shu chatga bog'laydi (`Client.telegramId`), tasdiq xabarini yuboradi, eslatmalarni rejalashtiradi |
| `login_<token>` | Biznes egasi | Saytga kirishni tasdiqlash so'rovi |

### 8.3. Buyruqlar va menyu

`setMyCommands` (o'zbekcha standart + `language_code: "ru"` uchun ruscha tavsiflar):

| Buyruq | O'zbekcha | Ruscha |
|---|---|---|
| `/start` | Boshlash | Начать |
| `/yozilishlarim` | Mening yozilishlarim | Мои записи |
| `/bugun` | Bugungi jadval (biznes egalari uchun) | Расписание на сегодня (для владельцев) |
| `/til` | Tilni oʻzgartirish | Сменить язык |
| `/yordam` | Yordam | Помощь |

Qo'shimcha: `/id` — foydalanuvchining Telegram ID'sini qaytaradi (admin ID'sini `.env` ga yozish uchun kerak).

- **Mening yozilishlarim:** shu Telegram ID'ga bog'langan barcha bizneslardagi kelajakdagi faol yozilishlar (10 tagacha), har birida "❌ Bekor qilish".
- **Bugungi jadval:** foydalanuvchi a'zo bo'lgan bizneslarning bugungi yozilishlari.
- Asosiy menyu tugmalari: "🗓 Mening yozilishlarim", "🌐 Til / Язык"; biznes egalari uchun qo'shimcha: "📊 Bugungi jadval", "⚙️ Panelni ochish" (URL tugma → `/panel`).
- Tushunilmagan xabar: "Tushunmadim 🙂 Quyidagi tugmalardan foydalaning." + asosiy menyu.

### 8.4. Callback'lar

| `callback_data` | Kim bosishi mumkin | Amal |
|---|---|---|
| `c:<bookingId>` | Yozilish egasi bo'lgan mijoz | "Rostdan ham bekor qilasizmi?" so'rovi |
| `cy:<bookingId>` | Mijoz | Bekor qilish (cheklov: `cancelUntilHours`) |
| `cn:<bookingId>` | Mijoz | Bekor qilmaslik, oldingi tugmalarni qaytarish |
| `k:<bookingId>` | Mijoz | "Kelaman" — `clientConfirmedAt` yoziladi |
| `oa:<bookingId>` | Biznes a'zosi | PENDING → CONFIRMED |
| `or:<bookingId>` | Biznes a'zosi | PENDING → CANCELLED_BY_BUSINESS |
| `la:<token>` / `lr:<token>` | Token egasi | Kirishni tasdiqlash / rad etish |
| `lang:uz` / `lang:ru` | Hamma | Tilni o'zgartirish |

Har bir callback'da: ruxsat tekshiriladi (mijoz amallari uchun `ctx.from.id === client.telegramId`; ega amallari uchun shu biznesga a'zolik), `answerCallbackQuery` albatta chaqiriladi, xabar `editMessageText` bilan yangilanadi (eski tugmalar qolib ketmasin).

### 8.5. Telegram Mini App (yozilish Telegram ichida)

- Biznes kartochkasidagi "📅 Yozilish" — `web_app` tugmasi: `{APP_URL}/b/{slug}?src=tg`.
- Sahifa `?src=tg` bo'lsa `https://telegram.org/js/telegram-web-app.js` skriptini yuklaydi. `window.Telegram.WebApp.initData` bo'sh bo'lmasa — Telegram rejimi: `ready()`, `expand()`, header rangi, ism `initDataUnsafe.user` dan oldindan to'ldiriladi.
- Yozilish yuborilganda `tgInitData = WebApp.initData` qo'shiladi.
- **Serverda tekshirish** (`src/lib/telegram/init-data.ts`):
  1. `initData` query-string sifatida o'qiladi, `hash` ajratib olinadi;
  2. qolgan juftliklar kalit bo'yicha tartiblanib, `key=value` ko'rinishida `\n` bilan birlashtiriladi (data_check_string);
  3. `secret_key = HMAC_SHA256(key = "WebAppData", data = BOT_TOKEN)`;
  4. `HEX(HMAC_SHA256(key = secret_key, data = data_check_string))` `hash` ga teng bo'lishi shart (vaqt bo'yicha xavfsiz taqqoslash bilan);
  5. `auth_date` 24 soatdan eski bo'lmasin;
  6. `user` JSON'idan `id`, `first_name`, `username`, `language_code` olinadi.
  
  Bu funksiya uchun unit-test yoz (ma'lum token bilan o'zing yasagan namunaviy `initData` orqali).
- Telegram Web (brauzerdagi Telegram) Mini App'ni `iframe` ichida ochadi — shuning uchun `/b/*` sahifalarida `X-Frame-Options: DENY` **qo'yilmaydi**, o'rniga `Content-Security-Policy: frame-ancestors 'self' https://web.telegram.org https://*.telegram.org`. Panel va admin sahifalarida esa `frame-ancestors 'none'`.

### 8.6. Xabar matnlari (o'zbekcha; ruschasini tabiiy tarjima qil)

`{...}` — o'zgaruvchilar. Barcha matnlar `src/bot/texts/uz.ts` va `ru.ts` da funksiyalar ko'rinishida.

**Salomlashuv** (`/start`):
```
Assalomu alaykum, {firstName}! 👋

Men — {brand} boti. Men orqali:
• yozilishlaringizni koʻrasiz va bekor qilasiz;
• tashrifdan oldin eslatma olasiz.

Biznesingiz bormi? Mijozlaringizni onlayn yozib olish uchun: {appUrl}
```

**Biznes kartochkasi** (`biz_<slug>`):
```
<b>{name}</b>
{category}

📍 {address}
Moʻljal: {landmark}
🕘 Bugun: {todayHours}
📞 {phone}
```
`todayHours` — "09:00–20:00" yoki "dam olish kuni". Mo'ljal bo'lmasa, qator chiqmaydi. Tugmalar: "📅 Yozilish" (web_app), "🗺 Xaritada ochish" (agar `mapUrl` bo'lsa).

**Yozilish tasdig'i (CONFIRMED):**
```
✅ <b>Siz yozildingiz!</b>

🏠 {business}
🔹 {service}
👤 {staffLabel}: {staff}
🗓 {date}, soat {time}
💰 {price}
📍 {address}

Tashrifdan 1 kun va 2 soat oldin eslatib qoʻyaman.
```

**So'rov yuborildi (PENDING):**
```
⏳ <b>Soʻrovingiz yuborildi!</b>

🏠 {business}
🔹 {service}
👤 {staffLabel}: {staff}
🗓 {date}, soat {time}

Biznes tasdiqlashi bilan sizga xabar beraman.
```
Ikkalasida tugmalar: "❌ Bekor qilish", "🔗 Batafsil" (→ `/y/<token>`).

**Biznes tasdiqladi:**
```
✅ <b>{business} yozilishingizni tasdiqladi!</b>

🗓 {date}, soat {time}
🔹 {service} — {staff}

Tashrifdan oldin eslatib qoʻyaman.
```

**24 soatlik eslatma:**
```
⏰ <b>Eslatma</b>

{dayWord} soat {time} da <b>{business}</b> sizni kutadi.
🔹 {service} — {staff}
📍 {address}

Kelasizmi?
```
Tugmalar: "✅ Ha, kelaman", "❌ Bekor qilish".

**2 soatlik eslatma:**
```
⏰ 2 soatdan keyin, soat {time} da <b>{business}</b> sizni kutadi.

🔹 {service} — {staff}
📍 {address}
Moʻljal: {landmark}
```
Tugmalar: "🗺 Xaritada ochish" (agar bo'lsa), "❌ Bekor qilish".

**Mijoz "Kelaman" bosdi** — xabar tahrirlanadi, tugmalar olib tashlanadi, oxiriga qo'shiladi: `✅ Rahmat! Sizni kutamiz.`

**Bekor qilishni so'rash:** "Rostdan ham bekor qilasizmi?" — tugmalar: "Ha, bekor qilaman", "Yoʻq, qolsin".

**Bekor qilindi (mijozga):**
```
❌ Yozilishingiz bekor qilindi.

Boshqa vaqtga yozilish uchun pastdagi tugmani bosing.
```
Tugma: "📅 Qayta yozilish" (→ biznes sahifasi).

**Bekor qilishga kech:** "Tashrifga {hours} soatdan kam vaqt qoldi, bu yerdan bekor qilib boʻlmaydi. Iltimos, qoʻngʻiroq qiling: {phone}"

**Biznes bekor qildi (mijozga):**
```
❌ Afsuski, <b>{business}</b> yozilishingizni bekor qildi.
🗓 {date}, soat {time}
Sabab: {reason}

Boshqa vaqtga yozilish uchun pastdagi tugmani bosing.
```
Sabab bo'lmasa, qator chiqmaydi.

**Vaqt o'zgardi (mijozga):**
```
🔄 <b>Yozilish vaqti oʻzgardi</b>

🏠 {business}
🗓 Yangi vaqt: {date}, soat {time}
👤 {staffLabel}: {staff}

Savollar boʻlsa: {phone}
```

**Egaga — yangi yozilish:**
```
🆕 <b>Yangi yozilish</b>{pending ? " — tasdiq kutilmoqda" : ""}

👤 {client}, {clientPhone}
🔹 {service}
👨‍💼 {staff}
🗓 {date}, soat {time}
💰 {price}
🌐 Manba: {source}
💬 Izoh: {comment}
```
`source`: "Sayt" / "Telegram" / "Panel". Izoh bo'lmasa, qator chiqmaydi. PENDING bo'lsa tugmalar: "✅ Tasdiqlash", "❌ Rad etish"; har doim: "📋 Panelda ochish". Tasdiqlangach/rad etilgach xabar oxiriga "✅ Tasdiqlandi" / "❌ Rad etildi" qo'shiladi va tugmalar olib tashlanadi.

**Egaga — mijoz bekor qildi:**
```
❌ <b>Mijoz yozilishni bekor qildi</b>

👤 {client}, {clientPhone}
🔹 {service} — {staff}
🗓 {date}, soat {time}

Bu vaqt endi boʻsh.
```

**Egaga — kunlik hisobot** (08:00, faqat biznes bugun ochiq bo'lsa va obuna holati `EXPIRED`/`BLOCKED` bo'lmasa):
```
☀️ <b>Bugun, {date}</b> — {count} ta yozilish

09:00 — Aziz · Soch olish · Ali
10:30 — Dilshod · Soch + soqol · Vali

Yaxshi kun tilaymiz!
```
30 qatordan ko'p bo'lsa: "…va yana {n} ta". Yozilish yo'q bo'lsa:
```
☀️ <b>Bugun, {date}</b>
Hozircha yozilishlar yoʻq. Havolangizni mijozlarga ulashing: {link}
```

**Obuna:**
- Tugashiga 3 va 1 kun qolganda: "⚠️ Obunangiz <b>{date}</b> da tugaydi ({days} kun qoldi). Toʻlov qilish: {billingUrl}"
- Tugaganda: "⛔ Obuna muddati tugadi. Onlayn yozilish vaqtincha oʻchirildi, lekin barcha maʼlumotlaringiz saqlangan. Toʻlov qilish: {billingUrl}"
- To'lov qabul qilinganda: "✅ Toʻlov qabul qilindi! Obuna <b>{date}</b> gacha faol. Rahmat!"

**Kirish:**
```
🔐 <b>{brand} saytiga kirish</b>

Kimdir (ehtimol siz) saytda «Telegram orqali kirish» tugmasini bosdi.
Agar bu siz boʻlsangiz — «Tasdiqlash»ni bosing.

⚠️ Agar bu siz boʻlmasangiz, «Rad etish»ni bosing va bu havolani hech kimga bermang.
```
Tugmalar: "✅ Tasdiqlash", "❌ Rad etish". Keyin: "✅ Tayyor! Saytga qayting — sahifa oʻzi yangilanadi." yoki "Kirish rad etildi." Muddati o'tgan bo'lsa: "Bu havolaning muddati tugagan. Saytda qaytadan «Telegram orqali kirish»ni bosing."

**Boshqa:**
- Yozilish topilmadi: "Yozilish topilmadi yoki muddati oʻtgan."
- Faol yozilish yo'q: "Sizda hozircha faol yozilishlar yoʻq."
- Yordam: "Yordam kerakmi? Bizga yozing: @{support}"
- ID: "Sizning Telegram ID raqamingiz: <code>{id}</code>"
- Til tanlash: "Tilni tanlang / Выберите язык" — tugmalar "🇺🇿 Oʻzbekcha", "🇷🇺 Русский"; keyin "✅ Til oʻzgartirildi."

**Adminlarga (menga):**
- "🆕 Yangi biznes: {name} ({category}, {region}). Egasi: {owner} @{username}"
- "💳 {business} toʻlov qilganini aytdi. Tarif: {plan}. Tekshirish: {adminUrl}"

### 8.7. Xatolar

- Telegram `403` (foydalanuvchi botni bloklagan) → `TelegramChat.isBlocked = true`, bu chatga boshqa xabar yuborilmaydi (foydalanuvchi botga qayta yozsa, `false` bo'ladi).
- `429` (Telegram limiti) → `retry_after` bo'yicha keyingi cron'da qayta urinish.
- Boshqa xatolar log'ga yoziladi; webhook har doim 200 qaytaradi (aks holda Telegram bir xil yangilanishni qayta-qayta yuboradi).

---

## 9. Rejalashtirilgan vazifalar (cron)

Ikkala endpoint ham `Authorization: Bearer <CRON_SECRET>` sarlavhasini talab qiladi, aks holda 401.

**`GET /api/cron/reminders`** — har 5 daqiqada:
1. Vaqti kelgan eslatmalarni **atomar** egallash (bir vaqtda ikki cron ishlasa ham ikki marta yuborilmasin), raw SQL bilan:
   ```sql
   UPDATE "ScheduledMessage" SET "status" = 'SENDING', "attempts" = "attempts" + 1, "updatedAt" = now()
   WHERE "id" IN (
     SELECT "id" FROM "ScheduledMessage"
     WHERE "status" = 'PENDING' AND "sendAt" <= now()
     ORDER BY "sendAt" LIMIT 50
     FOR UPDATE SKIP LOCKED
   )
   RETURNING *;
   ```
2. Har biri uchun: yozilish hali `CONFIRMED` emasmi yoki chat bloklanganmi → `CANCELLED`. Aks holda yuborish → `SENT` + `sentAt`. Xato bo'lsa: `attempts < REMINDER_MAX_ATTEMPTS` → `PENDING` (keyingi safar), aks holda `FAILED` + `lastError`.
3. 10 daqiqadan beri `SENDING` holatida qotib qolganlarni `PENDING` ga qaytarish.
4. `CONFIRMED` va `endsAt + AUTO_COMPLETE_AFTER_HOURS < now` → `COMPLETED`.
5. `PENDING` va `startsAt < now` → `CANCELLED_BY_BUSINESS`, `cancelReason = "AUTO_EXPIRED"`.

**`GET /api/cron/daily`** — har kuni 03:00 UTC (08:00 Toshkent):
1. Biznes egalariga kunlik hisobot (8.6).
2. Obuna ogohlantirishlari (3 kun, 1 kun qolganda, tugagan kuni) — har biri faqat bir marta yuborilsin (sanani tekshir).
3. Tozalash: 1 kundan eski `LoginToken` va `RateLimit` yozuvlari.

**Rejalashtiruvchi:** cron-job.org (bepul) — ikkita vazifa, `Authorization` sarlavhasi bilan. Lokal'da: `npm run cron:dev` har daqiqada ikkala endpoint'ni chaqiradi.

---

## 10. Kirish va xavfsizlik

**Sessiya**
- Cookie nomi `nv_session`: `httpOnly`, production'da `secure`, `sameSite: "lax"`, muddati `SESSION_TTL_DAYS`.
- Ichida JWT (HS256, `SESSION_SECRET` — kamida 32 belgi): `{ uid, sv }`. Har bir so'rovda `sv === user.sessionVersion` tekshiriladi.
- `middleware.ts` `/panel/*`, `/onboarding`, `/admin/*` ni himoya qiladi (kirmagan bo'lsa → `/login`).

**Ruxsatlar**
- `requireUser()`, `requireMember(businessId)`, `requireAdmin()` — `src/lib/auth/guards.ts` da.
- Panelning barcha so'rovlari va server action'lari faqat joriy foydalanuvchi a'zo bo'lgan biznes ma'lumotlarini oladi va o'zgartiradi. **Klientdan kelgan `businessId` ga hech qachon ishonilmaydi** — a'zolik har safar tekshiriladi.
- Hozircha bitta foydalanuvchi = bitta biznes, lekin sxema bir nechta biznesni ko'taradi (keyinchalik biznes almashtirgich qo'shiladi).

**Tekshiruv ro'yxati**
- [ ] Telegram webhook maxfiy sarlavha bilan himoyalangan.
- [ ] Cron endpoint'lari `CRON_SECRET` bilan himoyalangan.
- [ ] Mini App `initData` HMAC bilan tekshiriladi.
- [ ] Barcha kiruvchi ma'lumotlar zod bilan tekshiriladi.
- [ ] Bot xabarlarida foydalanuvchi matni ekranlangan; React'da `dangerouslySetInnerHTML` foydalanuvchi matni bilan ishlatilmaydi.
- [ ] Ommaviy sahifalarda mijozlarning telefon raqamlari ko'rinmaydi.
- [ ] Yozilishga faqat `manageToken` orqali kirish mumkin (ID orqali emas).
- [ ] Login tokeni bir martalik, 10 daqiqa amal qiladi, bot orqali aniq tasdiqlanadi.
- [ ] Spam limitlari ishlaydi (6.10).
- [ ] Xavfsizlik sarlavhalari (8.5-bo'limdagi `frame-ancestors` farqi bilan).
- [ ] Log'larda token va kalitlar chiqmaydi.
- [ ] `.env*` fayllar git'da yo'q.

---

## 11. Ko'p tillilik

- next-intl, tillar: `uz` (standart), `ru`. Tilni almashtirish cookie'da eslab qolinadi.
- **O'zbek imlosi:** UI matnlarida `oʻ`, `gʻ` uchun U+02BB (`ʻ`), tutuq belgisi uchun U+02BC (`ʼ`) ishlatiladi (masalan: `maʼlumot`, `boʻsh`). Qidiruvda esa `' ʻ ‘ \` ʼ` belgilari bir xil deb hisoblanadi (taqqoslashdan oldin normallashtiriladi).
- **Sanalar** (o'zbekcha): `21-oktyabr, seshanba`; to'liq: `2026-yil 21-oktyabr`. Oylar: yanvar, fevral, mart, aprel, may, iyun, iyul, avgust, sentyabr, oktyabr, noyabr, dekabr. Hafta kunlari: dushanba, seshanba, chorshanba, payshanba, juma, shanba, yakshanba; qisqa: Du, Se, Ch, Pa, Ju, Sh, Ya. `date-fns` ning `uz` lokali natijasini tekshir — bu formatga mos kelmasa, o'zingning kichik formatlovchingni yoz.
- **Sanalar** (ruscha): `21 октября, вторник`; qisqa kunlar: Пн, Вт, Ср, Чт, Пт, Сб, Вс.
- Vaqt har doim 24 soatlik: `14:30`.
- Biznes kiritgan kontent: xizmat nomining `nameUz` majburiy, `nameRu` ixtiyoriy (bo'lmasa o'zbekchasi ko'rsatiladi).
- Bot tili `TelegramChat.locale` bo'yicha; egaga xabarlar `User.locale` bo'yicha.

---

## 12. Dizayn

- Toza, zamonaviy, ishonchli ko'rinish. Asosiy rang — to'q feruza (`#0F766E` atrofida), PENDING uchun sariq urg'u (`#F59E0B`), xatolar — qizil. Ranglar Tailwind tokenlari sifatida bir joyda.
- Yorug' mavzu (qorong'i mavzu — keyinroq).
- Bosiladigan elementlar kamida 44×44 px. Shrift o'lchami mobilda kamida 16 px (iPhone'da kiritish maydoni bosilganda sahifa kattalashib ketmasin).
- Har bir ro'yxat va sahifa uchun: yuklanish (skeleton), bo'sh holat (tushuntirish + keyingi qadam tugmasi), xato holati (toast, o'zbekcha).
- Accessibility: har bir maydonda `label`, ko'rinadigan `focus` holati, kontrast AA darajasida.
- Ommaviy biznes sahifasi uchun maqsad: Lighthouse mobile Performance ≥ 85.

---

## 13. SEO va ulashish

- Biznes sahifasi: `generateMetadata` — sarlavha "{name} — onlayn yozilish | {district}", tavsif (kategoriya, manzil, xizmatlar).
- `opengraph-image.tsx` — biznes nomi, kategoriya va manzili yozilgan rasm. Havola Telegram'da ulashilganda chiroyli oldindan ko'rinish chiqadi — bu biz uchun juda muhim.
- Biznes sahifasida JSON-LD (`LocalBusiness`: nom, manzil, telefon, ish vaqti).
- `sitemap.xml` — landing va nashr qilingan, faol bizneslar sahifalari.
- `robots.txt` — `/panel`, `/admin`, `/api`, `/onboarding`, `/login`, `/y/` yopiq.
- Landing: sarlavha "{Brand} — mijozlarni onlayn yozish tizimi".

---

## 14. `.env.example`

```bash
# --- Ma'lumotlar bazasi (Supabase → Project Settings → Database → Connection string) ---
DATABASE_URL=""        # pooler (transaction) ulanishi
DIRECT_URL=""          # to'g'ridan-to'g'ri ulanish (migratsiyalar uchun)

# --- Sayt ---
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BRAND_NAME="Navbat"
NEXT_PUBLIC_SUPPORT_TELEGRAM=""        # @ belgisiz, masalan: navbat_support

# --- Telegram ---
TELEGRAM_BOT_TOKEN=""                  # @BotFather bergan token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=""   # @ belgisiz, masalan: navbat_bot
TELEGRAM_WEBHOOK_SECRET=""             # tasodifiy, kamida 32 belgi

# --- Xavfsizlik ---
SESSION_SECRET=""                      # tasodifiy, kamida 32 belgi
CRON_SECRET=""                         # tasodifiy, kamida 32 belgi
ADMIN_TELEGRAM_IDS=""                  # vergul bilan: 123456789,987654321 (botga /id yozib bilib olinadi)

# --- To'lov ko'rsatmasi (qo'lda to'lov davri) ---
PAYMENT_INSTRUCTIONS_UZ=""
PAYMENT_INSTRUCTIONS_RU=""

# --- Faqat lokal sinov uchun ---
REMINDER_TEST_MODE="false"
```

Tasodifiy kalitlarni yaratish uchun `npm run secret` skriptini qo'sh (64 belgilik tasodifiy satr chiqaradi).

---

## 15. Testlar

`vitest` bilan unit-testlar (`npm test`):

**`slots.ts`** — kamida shu holatlar:
1. Bo'sh kun 09:00–18:00, qadam 30, xizmat 60 daq → birinchisi 09:00, oxirgisi 17:00.
2. Tanaffus 13:00–14:00, xizmat 60 daq → 12:00 bor, 12:30 yo'q, 13:00 va 13:30 yo'q, 14:00 bor.
3. Mavjud yozilish 10:00–11:00 → 09:30 (60 daq) yo'q, 09:00 bor, 11:00 bor.
4. Buffer 15: 10:00 dagi 60 daqiqalik yozilish → `blockedUntil` 11:15 → 11:00 yo'q, 11:30 bor.
5. Yangi xizmatning buffer'i keyingi yozilishga tegsa → bu vaqt yo'q.
6. Yopiq kun (yakshanba) → bo'sh ro'yxat.
7. Ustaning shaxsiy jadvali biznes jadvalini almashtiradi.
8. Butun biznes uchun `TimeOff` → bo'sh ro'yxat; faqat bitta usta uchun `TimeOff` → faqat shu usta band.
9. Bugun, hozir 10:10, `minLeadMinutes = 60` → birinchi vaqt 11:30.
10. `maxDaysAhead` dan keyingi sana → bo'sh ro'yxat.
11. Bekor qilingan yozilishlar vaqtni band qilmaydi.
12. "Farqi yo'q": vaqtlar birlashadi, `staffIds` to'g'ri; `pickStaff` eng kam band ustani tanlaydi.
13. Qadam 15, xizmat 45 daq.
14. Vaqt zonasi: natijadagi `startsAt` UTC'da to'g'ri (09:00 Toshkent = 04:00 UTC).

**Boshqa testlar:**
- `reminders.ts` — 6.5-bo'limdagi jadvaldagi barcha misollar.
- `phone.ts` — to'g'ri va noto'g'ri kiritishlar.
- `money.ts` — `150 000 soʻm`, "dan boshlab", "Bepul".
- `slug.ts` — lotin, kirill, `oʻ`, takrorlanish, taqiqlangan so'zlar, 40 belgi chegarasi.
- `schedule.ts` — noto'g'ri jadvallar rad etiladi.
- `access.ts` — barcha 5 holat.
- `init-data.ts` — to'g'ri imzo qabul qilinadi, o'zgartirilgan ma'lumot va eski `auth_date` rad etiladi.
- `bookings.ts` — ruxsat etilmagan status o'tishlari xato beradi.

`docs/QA.md` — qo'lda tekshirish ssenariylari (har bosqichda to'ldiriladi).

---

## 16. Bosqichlar

Har bir bosqich oxirida 0.1-bo'limning 4-bandidagi tartib bajariladi.

### 0-bosqich: Tayyorgarlik
- Kompyuterda Node.js (LTS) va Git borligini tekshir; yo'q bo'lsa, menga o'rnatish yo'riqnomasini ber (Windows va macOS uchun).
- Next.js loyihasi (TypeScript, Tailwind, ESLint, App Router, `src/` papkasi), Prettier, shadcn/ui, vitest, Prisma, `tsx`.
- `package.json` skriptlari: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio`, `bot:dev`, `bot:set-webhook`, `cron:dev`, `secret`.
- Fayllar: `.env.example`, `.gitignore`, `README.md`, `CLAUDE.md`, `docs/SPEC.md` (**shu hujjatning to'liq nusxasi**), `docs/PROGRESS.md` (barcha bosqichlar checklist ko'rinishida), `docs/DECISIONS.md`, `docs/QA.md`.
- `CLAUDE.md` mazmuni (qisqa): men bilan o'zbekcha gaplash; to'liq topshiriq — `docs/SPEC.md`; holat — `docs/PROGRESS.md`; sessiya boshida shularni o'qi; faqat bepul xizmatlar; kalitlar faqat `.env.local` da; bosqich oxiridagi tartib; UI matnlari faqat `messages/*.json` da; bazani o'chiradigan buyruqlar faqat ruxsat bilan.
- `git init` va birinchi commit.
- Menga keyingi bosqichlarda qaysi bepul akkauntlar kerak bo'lishini oldindan ayt: GitHub, Supabase, Telegram (@BotFather), Vercel, cron-job.org.

✅ **Tayyor bo'ldi, agar:** `npm run dev` bilan sahifa ochiladi; lint, typecheck, test va build xatosiz o'tadi.

### 1-bosqich: Ma'lumotlar bazasi va yadro logika
- Menga Supabase loyihasini yaratishni qadam-baqadam o'rgat (region: Frankfurt), ulanish satrlarini `.env.local` ga qo'yishni tushuntir.
- 5-bo'limdagi sxema, 5.2-bo'limdagi qo'shimcha migratsiya.
- `seed.ts`: demo biznes "Ali Barber" (slug `demo-barber`, `isDemo`, nashr qilingan, Toshkent shahri, Chilonzor tumani, mo'ljal bilan), 2 ta usta, 4 ta xizmat (sartaroshxona shablonidan), bugun va ertaga uchun bir nechta yozilish, `trialEndsAt` uzoq kelajakda. Seed qayta ishga tushirilsa takrorlanmasin (upsert).
- `src/lib/`: `schedule.ts`, `time.ts`, `slots.ts`, `reminders.ts`, `phone.ts`, `money.ts`, `slug.ts`, `access.ts`, `tokens.ts`, `rate-limit.ts` — testlari bilan (15-bo'lim).
- `src/config/`: barcha konfiguratsiya fayllari.

✅ **Tayyor bo'ldi, agar:** migratsiyalar o'tadi, `npm run db:seed` ishlaydi, `npm run db:studio` da demo ma'lumotlar ko'rinadi, barcha testlar yashil.

### 2-bosqich: Biznes sahifasi va onlayn yozilish
- next-intl sozlash, umumiy layout, header/footer, til almashtirgich.
- `/b/[slug]` (7.2), API'lar (6.2, 6.3), `/y/[token]` (7.3), `.ics`, spamdan himoya, OG rasm, JSON-LD.
- `notify.ts` — hozircha faqat log yozadigan versiya.

✅ **Tayyor bo'ldi, agar:** telefon kengligida (360 px) demo biznesga boshidan oxirigacha yozilish mumkin; bir vaqtni ikki oynadan band qilishga urinilsa, ikkinchisi "band bo'lib qoldi" xabarini oladi; `/y/<token>` orqali bekor qilish ishlaydi va vaqt yana bo'shaydi; ruscha versiya ishlaydi; `docs/QA.md` ga ssenariylar yozilgan.

### 3-bosqich: Kirish, onboarding va panel
- Menga @BotFather orqali **test bot** yaratishni o'rgat, tokenni `.env.local` ga qo'yish.
- Bot karkasi: `src/bot/bot.ts`, `npm run bot:dev`, webhook route, `/start login_...`, `/id`.
- Kirish (7.4), sessiya va himoya (10), onboarding (7.5), panelning barcha sahifalari (7.6), QR-poster.

✅ **Tayyor bo'ldi, agar:** yangi foydalanuvchi Telegram orqali kiradi, onboarding'ni 5 daqiqadan kamroqda tugatadi, sahifani nashr qiladi; shu sahifadan yozilish panelda darhol ko'rinadi; statuslarni o'zgartirish, qo'lda yozilish qo'shish va vaqtni ko'chirish ishlaydi; boshqa foydalanuvchi begona biznes ma'lumotlarini ko'ra olmaydi (`guards.ts` uchun test bor).

### 4-bosqich: Telegram bot to'liq
- Deep link'lar (8.2), buyruqlar va menyu (8.3), callback'lar (8.4), Mini App (8.5), barcha xabarlar (8.6), xatolar (8.7).
- `notify.ts` ning Telegram versiyasi, eslatmalar va cron endpoint'lari (9), `npm run cron:dev`, `REMINDER_TEST_MODE`.

✅ **Tayyor bo'ldi, agar:** test rejimida eslatmalar 1–2 daqiqada keladi; "Kelaman" va "Bekor qilish" ishlaydi va panelda ko'rinadi; PENDING yozilishni Telegram'dan tasdiqlash ishlaydi; bekor qilingan vaqt yana bo'shaydi; ismi `<b>test</b>` bo'lgan mijoz xabarda oddiy matn sifatida ko'rinadi (ekranlash ishlaydi); Mini App tunnel orqali Telegram ichida ochiladi va yozilish ishlaydi.

### 5-bosqich: Landing, obuna, admin, huquqiy sahifalar
- Landing (7.1), `/maxfiylik`, `/shartlar` (7.8), obuna holatlari va bannerlar (6.9), tarif limitlari, `/panel/obuna` va "Toʻladim", admin panel (7.7), obuna ogohlantirishlari (9).

✅ **Tayyor bo'ldi, agar:** admin panelda sinov muddatini o'tgan qilib qo'ysam, ommaviy sahifada "Onlayn yozilish vaqtincha mavjud emas" chiqadi; admin to'lov qo'shsa, yozilish qayta ishlaydi va egaga Telegram xabari keladi; landing telefonda chiroyli ko'rinadi.

### 6-bosqich: Internetga chiqarish
- `docs/SETUP_UZ.md` ni to'liq yoz (17-bo'lim) va meni har bir qadamda yo'naltir: GitHub (private repo), Vercel (import, env o'zgaruvchilari, region `fra1`), production bazada `npm run db:deploy`, **asosiy bot** yaratish, `npm run bot:set-webhook` (webhook, buyruqlar, bot tavsifi), cron-job.org vazifalari, admin ID'sini qo'shish.
- `Dockerfile` (zaxira variant: keyin boshqa serverga ko'chish uchun).
- Production'da to'liq tekshiruv: `docs/QA.md` dagi barcha ssenariylar.

✅ **Tayyor bo'ldi, agar:** production manzil ishlaydi; bot webhook orqali javob beradi; eslatmalar cron-job.org orqali keladi; ommaviy sahifada Lighthouse mobile Performance ≥ 85.

---

## 17. `docs/SETUP_UZ.md` talablari

Men uchun, sodda o'zbek tilida, raqamlangan qadamlar bilan:

1. Kerakli dasturlar: Node.js (LTS), Git, VS Code — qayerdan yuklab olish va qanday o'rnatish.
2. GitHub: akkaunt, private repository, kodni yuklash.
3. Supabase: loyiha yaratish (region Frankfurt), baza parolini xavfsiz saqlash, ulanish satrlarini olish, bepul tarif cheklovlari (masalan, faol bo'lmagan loyihani to'xtatib qo'yishi) va zaxira nusxa olish.
4. Telegram: @BotFather → `/newbot` (test va asosiy bot), token, bot rasmi (`/setuserpic`), botga `/id` yozib o'z ID'ingni bilish.
5. Vercel: GitHub orqali kirish, loyihani import qilish, env o'zgaruvchilarini kiritish, funksiyalar regionini `fra1` qilish, deploy.
6. Webhook: `npm run bot:set-webhook` ni production sozlamalari bilan ishga tushirish.
7. cron-job.org: akkaunt, ikkita vazifa (URL, jadval, `Authorization` sarlavhasi).
8. Domen (ixtiyoriy, keyinroq): `.uz` domen olish va Vercel'ga ulash.
9. Ishga tushgandan keyingi tekshiruv ro'yxati.
10. Ko'p uchraydigan muammolar va yechimlari (bot javob bermayapti, eslatma kelmayapti, baza ulanmayapti).

---

## 18. Keyingi funksiyalar (hozir QILINMAYDI)

Bularni faqat men alohida so'raganimda qilasan. Hozirgi kod ularni keyin qo'shishga xalaqit bermasin:

- Katalog: `/katalog`, `/katalog/[viloyat]/[kategoriya]`, qidiruv, SEO sahifalar, pullik "TOP" o'rinlar (`featuredUntil`).
- Sharhlar va reyting (tashrifdan keyin botda 1–5 baho so'rash).
- Logotip va portfolio rasmlarini yuklash.
- Bitta tashrifda bir nechta xizmat.
- Ustalar uchun shaxsiy kirish va o'z yozilishlarini Telegram'da olish (`Staff.telegramId`).
- Panelni Telegram Mini App sifatida ochish (cookie va `iframe` cheklovlarini hisobga olib).
- Click/Payme orqali avtomatik to'lov (YaTT yoki yuridik shaxs va merchant shartnomasi kerak).
- Mijozlarga aksiya xabarlarini yuborish (pullik qo'shimcha, spamga qarshi limitlar bilan).
- Referal dastur (`referralCode`): taklif qilingan biznes to'lasa — 1 oy bepul.
- Biznesning o'z boti (white-label) — Premium.
- SMS eslatmalar (mahalliy SMS provayder orqali, pullik qo'shimcha).
- O'zbek kirill tili, qorong'i mavzu, filiallar, kutish ro'yxati, statistika grafiklari.

---

## 19. Huquqiy va hosting eslatmalari

- **Vercel:** bepul Hobby tarifi faqat **shaxsiy, notijorat** foydalanish uchun. Ishlab chiqish va bepul sinov (pilot) davrida Hobby'da ishlaymiz. Bizneslardan pul olishni boshlaganimizda Vercel Pro'ga o'tamiz yoki loyihani boshqa serverga (masalan, `Dockerfile` bilan VPS'ga) ko'chiramiz. Shuning uchun kod Vercel'ga xos pullik funksiyalarga bog'lanmasligi kerak.
- **Shaxsiy ma'lumotlar:** O'zbekistonning "Shaxsga doir ma'lumotlar to'g'risida"gi qonuni bo'yicha mijozlarning roziligi kerak (yozilish formasidagi belgi) va ma'lumotlarni qayerda saqlash bo'yicha talablar bor. 2026-yil martida bu talablar yumshatildi, lekin shartlar saqlanib qoldi. Bizneslardan pul olishni boshlashdan oldin men yurist bilan maslahatlashaman. Arxitektura buni hisobga oladi: baza oddiy PostgreSQL, uni istalgan vaqtda O'zbekistondagi serverga ko'chirish mumkin.
- **Soliq:** pul tusha boshlaganda YaTT ochiladi. IT Park rezidentligi imtiyozlari keyinroq o'rganiladi.
