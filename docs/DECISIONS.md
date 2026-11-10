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
