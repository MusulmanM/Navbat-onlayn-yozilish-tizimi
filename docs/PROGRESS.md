# Bosqichlar holati

Joriy bosqich: **3 — Kirish, onboarding va panel (jarayonda, to'xtatilgan)**
Keyingi qadam: onboarding, so'ng panelning qolgan sahifalari. Messages: `messages/*.json` da `Services`, `StaffPage`, `Schedule`, `Settings`, `Qr`, `Billing`, `Onboarding` bo'limlari hali yo'q.
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

## 3-bosqich: Kirish, onboarding va panel (jarayonda — 2026-11-10 da to'xtatildi)

- [ ] Test bot (@BotFather) — egasi qiladi
- [x] Bot: `src/bot/` (start/login/biz/bk deep link'lar, buyruqlar, callback'lar, matnlar uz/ru), `npm run bot:dev`, webhook route, `npm run bot:set-webhook`
- [x] Kirish (7.4): login token API'lari, `/login` sahifasi (QR, taymer, so'rov), sessiya (jose), `proxy.ts` himoyasi, guards
- [x] Panel qobig'i: yon menyu / pastki menyu, obuna va nashr bannerlari, "Yozilish qo'shish" oynasi
- [x] `/panel` — Bugun (statistika, tasdiq kutayotganlar, bugungi ro'yxat, tezkor amallar)
- [x] `/panel/kalendar` — kun/hafta, ustunlar, tafsilotlar, vaqtni ko'chirish, izoh (yozildi, brauzerda hali sinalmagan)
- [ ] Onboarding (7.5) — 5 qadam
- [ ] `/panel/yozilishlar` (filtrlar, sahifalash)
- [ ] `/panel/mijozlar` va mijoz sahifasi
- [ ] `/panel/xizmatlar`, `/panel/ustalar` (dam olish kunlari bilan)
- [ ] `/panel/sozlamalar` (5 tab), `/panel/qr`, `/panel/yana`
- [ ] `guards.ts` testlari, brauzerda to'liq sinov, bosqich tekshiruvi va commit

## 4-bosqich: Telegram bot to'liq

- [ ] Deep link'lar, buyruqlar, menyu, callback'lar (8.2–8.4)
- [ ] Mini App (8.5), barcha xabarlar (8.6), xatolar (8.7)
- [ ] `notify.ts` Telegram versiyasi, eslatmalar, cron endpoint'lari (9), `npm run cron:dev`, `npm run bot:set-webhook`
- [ ] Bosqich tekshiruvi va commit

## 5-bosqich: Landing, obuna, admin, huquqiy sahifalar

- [ ] Landing (7.1), `/maxfiylik`, `/shartlar` (7.8)
- [ ] Obuna holatlari, bannerlar, tarif limitlari (6.9), `/panel/obuna`, "Toʻladim"
- [ ] Admin panel (7.7), obuna ogohlantirishlari (9)
- [ ] Bosqich tekshiruvi va commit

## 6-bosqich: Internetga chiqarish

- [ ] `docs/SETUP_UZ.md` (17-bo'lim)
- [ ] GitHub, Vercel (`fra1`), `npm run db:deploy`, asosiy bot, webhook, cron-job.org, admin ID
- [ ] `Dockerfile`
- [ ] Production'da `docs/QA.md` ssenariylari, Lighthouse mobile ≥ 85
