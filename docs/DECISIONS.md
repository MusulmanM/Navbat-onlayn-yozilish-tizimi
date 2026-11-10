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
