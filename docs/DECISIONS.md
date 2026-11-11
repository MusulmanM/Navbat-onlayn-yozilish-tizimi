# Qabul qilingan kichik qarorlar

Format: sana — qaror — sabab.

- 2026-11-10 — Ish `develop` branch'ida boradi, `main` ga 6-bosqichda birlashtiriladi — `main` deploy uchun toza qoladi.
- 2026-11-10 — Node.js 26 (joriy LTS), `package.json` da `engines.node >= 24` — Prisma 7 va Next.js 16 talablariga mos.
- 2026-11-10 — Prisma 7.10.1 — npm'dagi "latest" yorlig'i 8.0.0-rc (sinov versiyasi), topshiriq esa barqaror versiyani talab qiladi.
- 2026-11-10 — TypeScript 6.0.x, 7.x emas — ESLint'ning TypeScript plagini (typescript-eslint) hozircha 6.1 dan past versiyalarnigina qo'llab-quvvatlaydi.
- 2026-11-10 — Eski `.gitignore` (Python shabloni) Next.js uchun yozilgani bilan almashtirildi — u `lib/` papkalarni, ya'ni `src/lib/` ni ham chetlab qo'yardi.
- 2026-11-10 — 0-bosqichdagi vaqtinchalik bosh sahifa matnni `messages/uz.json` dan to'g'ridan-to'g'ri o'qiydi — next-intl 2-bosqichda ulanadi.
- 2026-11-10 — `bot:dev`, `bot:set-webhook`, `cron:dev` skriptlari hozircha tushuntirish chiqaradigan "zaglushka" — tegishli bosqichlarda to'ldiriladi.
- 2026-11-10 — Qo'shimcha `npm run format` skripti (Prettier) — kod ko'rinishi bir xil bo'lishi uchun.
- 2026-11-10 — Faqat yorug' mavzu: shadcn'ning `.dark` ranglari olib tashlandi, `dark:` varianti faqat `.dark` klassiga bog'langan — telefon qorong'i rejimda bo'lsa ham sahifa buzilmasin.
- 2026-11-10 — Vitest 4.1 + Vite 7, Vitest 5 emas — egasining kompyuteri protsessorida (Intel Celeron N4020) AVX yo'q, Vitest 5 ishlatadigan rolldown esa "Illegal instruction" bilan yiqiladi. Rolldown AVX'siz versiya chiqarsa, qayta ko'rib chiqiladi.
- 2026-11-10 — shadcn/ui: standart `base-nova` uslubi (Base UI asosida), rang tokenlari feruza (`#0F766E`) ga, shrift Geist o'rniga Inter ga almashtirildi (topshiriq 2-bo'lim).
- 2026-11-10 — Tugma o'lchamlari: sensorli ekranda hammasi kamida 44 px; kichik o'lchamlar (`sm`, `xs`, `icon-sm`) faqat sichqoncha bilan ishlaganda kichrayadi (`pointer-fine`).
- 2026-11-10 — `shadcn` paketi `devDependencies` ga o'tkazildi — undan faqat CSS fayl build vaqtida olinadi; production paketlarida zaiflik qolmadi (`npm audit --omit=dev` toza).
- 2026-11-10 — Input chegarasi rangi `#8391a7` (oq fonda 3.2:1) — WCAG talabi bo'yicha maydon chegarasi kamida 3:1 bo'lishi kerak.
- 2026-11-10 — `messages` uchun test: uz/ru kalitlari bir xil va o'zbekcha matnda ASCII apostrof yo'q (faqat `ʻ`/`ʼ`) — imlo xatolari avtomatik ushlanadi.

## 1-bosqich

- 2026-11-10 — Prisma 7: generator `prisma-client` (yangi, tavsiya etilgan; `prisma-client-js` eskirgan), mijoz kodi `src/generated/prisma` ga yoziladi (git'ga tushmaydi, `postinstall` da yaratiladi). Ulanish: `@prisma/adapter-pg`; ulanish manzillari `prisma.config.ts` da (Prisma 7 talabi). Migratsiyalar `DIRECT_URL`, ilova `DATABASE_URL` (pooler) ishlatadi.
- 2026-11-10 — Baza sessiyasi har doim UTC (`-c TimeZone=UTC`) — Prisma'ning pg adapteri vaqtni zonasiz yuboradi; server zonasi UTC bo'lmasa (masalan lokal kompyuter) vaqtlar siljib saqlanardi. Sinab tasdiqlangan.
- 2026-11-10 — Sxemaga qo'shimcha maydonlar: `Business.onboardingStep` (onboarding qayerda to'xtagani), `Business.lastBillingNotice` (obuna ogohlantirishi ikki marta ketmasligi uchun), `Business.paymentClaimedAt` ("To'ladim" bosilgani); qo'shimcha indekslar: `Booking(status, startsAt)`, `StaffService(serviceId)`, `LoginToken(createdAt)`, `RateLimit(windowStart)` — cron va panel so'rovlari tez ishlashi uchun.
- 2026-11-10 — Rate limit bitta atomar SQL (`INSERT … ON CONFLICT DO UPDATE`) bilan — ikki parallel so'rov eski hisoblagichni o'qib qolmaydi.
- 2026-11-10 — Slug 3 belgidan qisqa yoki taqiqlangan so'z bo'lsa avtomatik `-biznes` qo'shiladi (`ab` → `ab-biznes`, `admin` → `admin-biznes`); egasi qo'lda kiritsa — xato ko'rsatiladi.
- 2026-11-10 — "Keldi/Kelmadi" tashrifdan ko'pi bilan 1 soat oldin bosilishi mumkin (mijoz ertaroq kelgan holat uchun); undan oldin — `TOO_EARLY`.
- 2026-11-10 — Panelda `ignoreLeadTime` sana oralig'i va "hozirdan keyin" cheklovini ham o'chiradi — ega o'tib ketgan tashrifni ham qayd eta olsin (to'qnashuv baribir taqiqlangan).
- 2026-11-10 — `db` klienti "dangasa" (lazy): import qilinganda bazaga ulanmaydi — bazasiz sahifalar (landing, huquqiy) baza sozlanmagan bo'lsa ham ochiladi.
- 2026-11-10 — `.env.local` lokal sinov uchun to'ldirildi: lokal PostgreSQL manzili va tasodifiy `SESSION_SECRET`/`CRON_SECRET`/`TELEGRAM_WEBHOOK_SECRET`. Supabase ulanganda manzillar almashtiriladi.

## 2-bosqich

- 2026-11-10 — `cacheComponents` o'chirildi (klassik server-render) — panelning hamma sahifasi cookie va bazaga bog'liq; Cache Components har bir murojaatni maxsus o'rashni talab qiladi, foydasi esa bu loyihada kichik. Sahifalar baribir serverda tez chiziladi.
- 2026-11-10 — Brauzer tili (`Accept-Language`) hisobga olinmaydi, faqat tanlangan til cookie'da eslab qolinadi — asosiy til o'zbek; ko'p telefonlar ruscha sozlangan bo'lsa ham, mijoz o'zbekcha sahifani ko'radi va xohlasa RU ni bosadi.
- 2026-11-10 — Yozilish qadamlari to'liq ekranli oynada (telefonda) / markazdagi oynada (kompyuterda); "Kun" va "Vaqt" bitta ekranda (kun tanlansa vaqtlar pastda chiqadi) — kamroq bosish. Har qadam brauzer tarixiga yoziladi, telefonning "orqaga" tugmasi bir qadam orqaga qaytaradi.
- 2026-11-10 — Ommaviy sahifada toast kutubxonasi ishlatilmaydi, xatolar oynaning o'zida (role="alert") ko'rsatiladi — sahifa JS hajmi kichik bo'lsin. Toast panelda ishlatiladi.
- 2026-11-10 — Brauzerga faqat kerakli tarjima bo'limlari yuboriladi (`pickMessages`) — ommaviy sahifa yengil.
- 2026-11-10 — Mijoz ismi va telefoni brauzerda (localStorage) eslab qolinadi — keyingi safar avtomatik to'ldiriladi. Telegram Mini App'da ism Telegram'dan olinadi.
- 2026-11-10 — Qayta yozilgan mijozning bazadagi ismi o'zgartirilmaydi (biznes uni tahrirlagan bo'lishi mumkin); faqat Telegram ID qo'shiladi.
- 2026-11-10 — "Farqi yo'q" tanlanganda tasdiq ekranida qaysi usta tayinlangani ko'rsatiladi (API javobida `staffName`).
- 2026-11-10 — JSON-LD `dangerouslySetInnerHTML` orqali (Next.js rasmiy usuli), `<` belgisi `<` ga almashtiriladi — foydalanuvchi matni teg yopa olmaydi.
- 2026-11-10 — OG rasm uchun Inter shrifti Google Fonts'dan faqat kerakli harflar bilan yuklanadi; yuklanmasa standart shrift ishlatiladi.
- 2026-11-10 — `telegram-web-app.js` faqat `?src=tg` bo'lganda yuklanadi — oddiy mijozlar uchun ortiqcha skript yo'q.
- 2026-11-10 — "Ish vaqti" bloki `<details>` bilan (JS'siz ochiladi/yopiladi); "Hozir ochiq" holati tanaffus va bayram kunlarini hisobga oladi.

## 3-bosqich

- 2026-11-11 — Bot to'liq shu bosqichda yozildi (login uchun bot baribir kerak edi): deep link'lar, buyruqlar, callback'lar, Telegram bildirishnomalari. 4-bosqichda cron va eslatmalar qo'shiladi.
- 2026-11-11 — Botning asosiy menyusi doimiy "reply" klaviatura (pastdagi tugmalar); "⚙️ Panelni ochish" URL tugmasi alohida xabarda — Telegram reply klaviaturada URL tugmani qo'llamaydi.
- 2026-11-11 — Panelda ega o'zi qo'shgan yozilish (manba PANEL) haqida egaga Telegram xabari yuborilmaydi — u buni o'zi qildi.
- 2026-11-11 — Login'dan keyin `?next=` faqat panel/onboarding/admin ichidagi yo'lga ruxsat beradi (boshqa saytga yo'naltirib bo'lmaydi).
- 2026-11-11 — Onboarding 5-qadamida panel ochiq (QR-poster chop etish uchun); 1–4 qadam tugamaguncha panel onboarding'ga qaytaradi. `?step=` orqali oldingi qadamga qaytish mumkin.
- 2026-11-11 — Onboarding'da ro'yxatdan olib tashlangan xizmat/usta: yozilishlari bo'lsa arxivlanadi, bo'lmasa o'chiriladi (5.5-bo'lim).
- 2026-11-11 — Kalendar: 1 soat = 64 px, bo'sh joy bosilsa vaqt 15 daqiqaga yaxlitlanadi; tanlangan vaqt ish vaqtidan tashqarida bo'lsa "Ish vaqtidan tashqari" o'zi yoqiladi. Telefonda bitta ustun + usta tanlash tugmalari.
- 2026-11-11 — Mijoz qidiruvi SQL `translate()` bilan: `ʻ ʼ ‘ ’ ' \`` bir xil hisoblanadi ("Go'zal" → "Goʻzal" topiladi), registrga bog'liq emas.
- 2026-11-11 — Yozilishlar filtri va mijozlar qidiruvi oddiy GET forma (JavaScript'siz ham ishlaydi, filtr havolada saqlanadi).
- 2026-11-11 — Dam olish/bayram kunlari butun kunlar bilan kiritiladi (biznes vaqt zonasida 00:00 dan keyingi kun 00:00 gacha).
- 2026-11-11 — Ruxsat (guards) testlari ikki qismli: toza unit testlar har doim, bazali izolyatsiya testlari `TEST_DATABASE_URL` berilganda (alohida, tashlab yuboriladigan baza).
- 2026-11-11 — Server action'lar `{ ok, data }` qaytaradi; muvaffaqiyat yoki xato kerak bo'lgan joylarda `runOk()` (natija `null` bo'lsa ham muvaffaqiyatni yo'qotmaydi — brauzer sinovida topilgan xato).
