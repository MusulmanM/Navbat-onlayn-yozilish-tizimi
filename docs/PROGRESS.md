# Bosqichlar holati

Joriy bosqich: **6 — Internetga chiqarish: kod tayyor, egasining qo'lda qadamlari qoldi** (`docs/SETUP_UZ.md`)
Batafsil talablar: `docs/SPEC.md`, 16-bo'lim.

## 0-bosqich: Tayyorgarlik

- [x] Node.js va Git tekshirildi (Git bor; Node.js yo'q edi — o'rnatish yo'riqnomasi `README.md` da)
- [x] Next.js (App Router, TypeScript, Tailwind, ESLint, `src/`), Prettier, shadcn/ui, vitest, Prisma, tsx
- [x] `package.json` skriptlari: dev, build, start, lint, typecheck, test, db:\*, bot:dev, bot:set-webhook, cron:dev, secret
- [x] `.env.example`, `.gitignore`, `README.md`, `CLAUDE.md`
- [x] `docs/SPEC.md` (to'liq nusxa), `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/QA.md`
- [x] Dizayn asoslari: rang tokenlari, Inter shrifti, 16 px / 44 px qoidalari
- [x] lint, typecheck, test, build xatosiz
- [x] Commit

## 1-bosqich: Ma'lumotlar bazasi va yadro logika

- [ ] Supabase loyihasi (Frankfurt) — egasi qiladi (`docs/SETUP_UZ.md`); hozircha lokal PostgreSQL bilan sinaldi
- [x] Prisma sxemasi (5.1) va `booking_no_overlap` migratsiyasi (5.2)
- [x] `seed.ts`: demo "Ali Barber" (`demo-barber`), takrorlanmaydigan
- [x] `src/lib/`: schedule, time, slots, reminders, phone, money, slug, access, tokens, rate-limit + testlar
- [x] `src/lib/env.ts` (env tekshiruvi), `src/config/*`
- [x] Bosqich tekshiruvi va commit

## 2-bosqich: Biznes sahifasi va onlayn yozilish

- [x] next-intl, umumiy layout, header/footer, til almashtirgich
- [x] `/b/[slug]` (7.2), slots/days/bookings API (6.2, 6.3)
- [x] `/y/[token]` (7.3), `.ics`, bekor qilish
- [x] Spamdan himoya, OG rasm, JSON-LD
- [x] `notify.ts` (log versiyasi; bot tokeni bo'lsa Telegram versiyasi)
- [x] `docs/QA.md` ssenariylari, bosqich tekshiruvi va commit

## 3-bosqich: Kirish, onboarding va panel

- [ ] Test bot (@BotFather) — egasi qiladi (`docs/SETUP_UZ.md`)
- [x] Bot: `src/bot/` (deep link'lar, buyruqlar, callback'lar, uz/ru matnlar), `npm run bot:dev`, webhook route, `npm run bot:set-webhook`
- [x] Kirish (7.4): login token API'lari, `/login` (QR, taymer, avtomatik tekshirish), sessiya (jose), `proxy.ts`, guards
- [x] Onboarding (7.5) — 5 qadam, har qadam saqlanadi
- [x] Panel: Bugun, Kalendar (kun/hafta, tafsilotlar, ko'chirish), Yozilishlar, Mijozlar + mijoz kartasi, Xizmatlar, Ustalar (+dam olish), Sozlamalar (5 tab), QR-poster, "Yana"
- [x] "Yozilish qo'shish" oynasi (qidiruv/yangi mijoz, ish vaqtidan tashqari, mijozga xabar matni)
- [x] `guards` testlari + bazali izolyatsiya testlari
- [x] Brauzerda sinov (360 px): login → onboarding → panel; bosqich tekshiruvi va commit

## 4-bosqich: Telegram bot to'liq

- [x] Deep link'lar, buyruqlar, menyu, callback'lar (8.2–8.4)
- [x] Mini App (8.5): `?src=tg`, `initData` tekshiruvi, BackButton, "Yopish"
- [x] Barcha xabarlar (8.6), xatolar (8.7): 403 → bloklangan, 429 → qayta urinish
- [x] `notify.ts` Telegram versiyasi, eslatmalar, cron endpoint'lari (9), `npm run cron:dev`, `npm run bot:set-webhook`, `REMINDER_TEST_MODE`
- [x] Bot va cron uchun integratsiya testlari (soxta Telegram API bilan)
- [ ] Haqiqiy Telegram'da qo'lda sinov (test bot + tunnel) — egasi qiladi, `docs/QA.md`

## 5-bosqich: Landing, obuna, admin, huquqiy sahifalar

- [x] Landing (7.1), `/maxfiylik`, `/shartlar` (7.8), sitemap.xml, robots.txt
- [x] Obuna holatlari, bannerlar, tarif limitlari (6.9), `/panel/obuna`, "Toʻladim"
- [x] Admin panel (7.7): statistika, bizneslar (filtr, qidiruv), to'lov qo'shish, bloklash, TOP, sinov sanasi
- [x] Obuna ogohlantirishlari (9) — 4-bosqich cron'ida
- [x] Brauzerda sinov: sinov tugatildi → sahifada yozilish o'chdi → to'lov → yana ishlaydi; bosqich tekshiruvi va commit

## 6-bosqich: Internetga chiqarish

- [x] `docs/SETUP_UZ.md` (17-bo'lim): botlar, Supabase, `.env.production.local`, GitHub, Vercel, webhook, admin ID, cron-job.org, domen, tekshiruv ro'yxati, zaxira nusxa, muammolar
- [x] Production buyruqlari: `db:deploy:prod`, `db:seed:prod`, `db:backup:prod`, `bot:set-webhook` (faqat `.env.production.local`, avval tekshiruv) — lokal bazada sinaldi
- [x] `vercel.json` (`fra1`, `develop` deploy qilinmaydi), `/api/health`, ishga tushishda sozlamalar tekshiruvi, favicon
- [x] `Dockerfile` + `.dockerignore` (standalone server lokal'da sinaldi; Docker'ning o'zi bu kompyuterda yo'q)
- [x] Yengillashtirish: xabarlar build paytida kompilyatsiya qilinadi (biznes sahifasida JS ~16 KB kam, TBT 2,7 s → 1,3 s), til almashtirgich a11y
- [x] Lokal Lighthouse (mobil): biznes sahifasi 76/100/100, landing 74/100/100 — sekin kompyuterda; haqiqiy o'lchov production'da
- [x] `develop` → `main` (lokal'da birlashtirildi)
- [x] `main` GitHub'ga yuklandi (egasi, 2026-11-11)
- [x] Supabase (Frankfurt, Data API o'chirilgan) ulandi (2026-11-12): `prisma migrate deploy` — 2 ta migratsiya, `btree_gist` va `Booking_no_overlap` SQL bilan tasdiqlandi; demo seed (`demo-barber`, 2 usta, 4 xizmat); vaqt zonasi UTC; lokal `npm run dev` shu bazada ishlaydi, bo'sh vaqtlar API orqali tekshirildi
- [ ] Vercel, asosiy bot, webhook, cron-job.org, admin ID — egasi qiladi (`docs/SETUP_UZ.md`)
- [ ] Production'da `docs/QA.md` 6-bo'lim ssenariylari, pagespeed.web.dev mobile ≥ 85 — egasi qiladi

## Tuzatishlar (6-bosqichdan keyin)

- [x] Havola rasmi (OG) Google shriftlari yuklanmasa ham chiqadi
- [x] Bir vaqtga bir paytda kelgan yozilishlarda baza to'qnashuvi (deadlock) qayta urinish bilan hal qilinadi — 20 parallel so'rovli sinovda tasdiqlandi
