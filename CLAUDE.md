# Navbat — Claude uchun qoidalar

Sessiya boshida avval shu faylni, keyin `docs/PROGRESS.md` ni o'qi va qolgan joydan davom et.

- To'liq texnik topshiriq: `docs/SPEC.md` (asosiy manba).
- Bosqichlar holati: `docs/PROGRESS.md`. Kichik qarorlar: `docs/DECISIONS.md`. Qo'lda tekshirish: `docs/QA.md`.
- Next.js'ning joriy hujjatlari: `node_modules/next/dist/docs/` (`AGENTS.md` ga qarang).

## Muloqot

- Loyiha egasi dasturchi emas. U bilan har doim o'zbek tilida (lotin), sodda tilda gaplash; texnik atamani bir jumla bilan tushuntir.
- U qo'lda qiladigan ishlar (akkaunt, token, sozlama) uchun raqamlangan qadamlar ber va u tayyor bo'lguncha kut.
- Kalitlarni chatga yozishni so'rama — egasi ularni o'zi `.env.local` ga qo'yadi.

## Ish tartibi

- Ish `docs/SPEC.md` 16-bo'limidagi bosqichlar bo'yicha boradi, bir vaqtda faqat bitta bosqich. O'tkazib yuborma, birlashtirma.
- Bosqich oxirida:
  1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — hammasi xatosiz o'tsin;
  2. nima qilinganini qisqa tushuntir va egasi o'zi nimani tekshirishini yoz (manzil, nimani bosish, nima ko'rinishi kerak);
  3. `docs/PROGRESS.md` va `docs/QA.md` ni yangila, inglizcha commit qil (`feat: ...`);
  4. keyingi bosqichdan oldin ruxsat so'ra ("davom et").
- Ish `develop` branch'ida boradi; `main` ga 6-bosqichda (deploy) birlashtiriladi.

## Qat'iy qoidalar

- Faqat bepul xizmatlar va ochiq kodli kutubxonalar. Pullik narsa chiqsa — to'xta va so'ra.
- Maxfiy kalitlar faqat `.env.local` da. `.env.example` da faqat nomlar va izohlar. Boshqa `.env*` fayllar git'ga tushmaydi.
- Bazani o'chiradigan yoki tozalaydigan buyruqlar (`prisma migrate reset`, `DROP`, `TRUNCATE`, `db push --force-reset`) — faqat egasining ruxsati bilan.
- UI matnlari faqat `messages/uz.json` va `messages/ru.json` da; bot matnlari `src/bot/texts/` da. O'zbekcha matnda `oʻ`/`gʻ` uchun `ʻ` (U+02BB), tutuq belgisi uchun `ʼ` (U+02BC).
- Brend nomi kodda yozilmaydi — faqat `NEXT_PUBLIC_BRAND_NAME` orqali.
- TypeScript `strict`, `any` taqiqlangan. Serverga keladigan har bir ma'lumot `zod` bilan tekshiriladi.
- Biznes-logika `src/lib/` da: bazaga murojaat qilmaydigan toza funksiyalar + vitest testlari. Kod izohlari inglizcha, qisqa.
- Kutubxonalarning eng so'nggi barqaror versiyalari; eskirgan (deprecated) API'lardan foydalanma, shubha bo'lsa rasmiy hujjatni tekshir.
- Skriptlar Windows, macOS va Linux'da bir xil ishlasin: bash'ga bog'lanma, TypeScript skriptlar `tsx` bilan.
- Hostingga bog'lanma: faqat standart Next.js imkoniyatlari (keyin Docker/VPS'ga ko'chirish oson bo'lsin).
- Kichik qarorlarni `docs/DECISIONS.md` ga bir qatordan yoz; katta qarorlar (arxitektura, pullik xizmat, ma'lumot o'chirish, xavfsizlikni susaytirish) uchun so'ra.

## UX/UI — egasining asosiy talabi: "qulay bo'lsin"

- Mobil birinchi: 360 px kenglikda mukammal, keyin planshet va kompyuter.
- Bosiladigan elementlar kamida 44×44 px, mobilda shrift kamida 16 px.
- Har ekran oddiy: bitta asosiy harakat aniq ko'rinadi, matn minimal, katta tugmalar.
- Har ro'yxat va sahifada: yuklanish (skeleton), bo'sh holat (tushuntirish + keyingi qadam tugmasi), xato holati (toast).
- Ommaviy sahifalar yengil: server-render, kam JavaScript, og'ir kutubxonalarsiz.
- Ranglar faqat `src/app/globals.css` dagi tokenlardan. Har maydonda `label`, ko'rinadigan focus, AA kontrast.
