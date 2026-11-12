# Qo'lda tekshirish ssenariylari

Har bosqichda to'ldiriladi. Telefon kengligini sinash uchun brauzerda F12 → telefon belgisi (Device toolbar) → kenglik 360.

## 0-bosqich: Tayyorgarlik

1. Terminalda loyiha papkasida `npm run dev` ni ishga tushiring.
2. Brauzerda http://localhost:3000 ni oching.
3. Kutiladigan natija: brend nomi ("Navbat") va "Loyiha tayyorlanmoqda" matni bilan feruza rangli sahifa. 360 px kenglikda matn sig'adi, gorizontal aylantirish yo'q.
4. Terminalda `npm run secret` — 64 belgilik tasodifiy satr chiqadi.

## 2-bosqich: Biznes sahifasi va onlayn yozilish

Oldin: baza ulangan va `npm run db:seed` bajarilgan bo'lsin (demo biznes `demo-barber`).

1. **Sahifa:** http://localhost:3000/b/demo-barber (360 px). Ko'rinadi: "Demo sahifa" yozuvi, "AB" avatar, "Ali Barber", "Sartaroshxona", "Hozir ochiq/yopiq …" qatori, manzil + mo'ljal, "Qo'ng'iroq qilish", "Xaritada ochish", "Ish vaqti" (bosilsa ochiladi, bugungi kun ajratilgan), 4 ta xizmat.
2. **Yozilish:** "Soch + soqol" → "Yozilish". Oyna ochiladi: "Ustani tanlang", "2-qadam, jami 4", yuqorida progress chiziq.
3. "Farqi yo'q — birinchi bo'sh usta" → kunlar tasmasi va vaqtlar. Yakshanba kulrang va bosilmaydi. Boshqa kunni bossangiz, vaqtlar yangilanadi (yuklanayotganda kulrang "skelet").
4. Vaqtni bosing → "Ma'lumotlaringiz". Bo'sh holda "Yozilish" bosilsa, har bir maydon ostida qizil izoh chiqadi.
5. Ism, telefon (`90 123 45 67` ko'rinishida yoziladi, `+998` o'zgarmaydi), rozilik belgisi → "Yozilish" → "Siz yozildingiz!", kim (usta), qachon, narx, manzil; "📅 Kalendarga qo'shish" `.ics` faylni yuklaydi; "Yozilishni boshqarish" `/y/...` ni ochadi.
6. **Telefonning "orqaga" tugmasi** har qadamda bitta orqaga qaytaradi; muvaffaqiyatdan keyin oynani yopadi.
7. **Band vaqt:** ikki brauzer oynasida bir xil xizmat, usta va vaqtni tanlang, ikkalasida ham "Yozilish" ni bosing. Ikkinchisi "Bu vaqt hozirgina band bo'ldi" xabari bilan vaqt tanlashga qaytadi, ro'yxat yangilanadi.
8. **Bekor qilish:** `/y/<token>` → "Yozilishni bekor qilish" → sabab (ixtiyoriy) → "Ha, bekor qilaman". Status "Bekor qilingan" bo'ladi, shu vaqt biznes sahifasida yana bo'sh.
9. **Kech bekor qilish:** tashrifga 2 soatdan kam qolgan yozilishda tugma o'rniga "Bekor qilish uchun qo'ng'iroq qiling: …" chiqadi.
10. **Limit:** bitta raqamdan 4-yozilish "Sizda bu yerda allaqachon 3 ta faol yozilish bor" xabarini oladi.
11. **Rus tili:** yuqoridagi "RU" → `/ru/b/demo-barber`, barcha matnlar ruscha. "UZ" bosilsa qaytadi. Tanlov eslab qolinadi.
12. **Havola ulashish:** Telegram'da `https://<sayt>/b/demo-barber` yuborilsa, nom, kategoriya va manzil yozilgan rasm chiqadi (faqat internetga chiqqandan keyin).
13. **?s= havola:** `/b/demo-barber?s=demo-service-1` — sahifa ochilishi bilan "Soch olish" tanlangan holda yozilish oynasi ochiladi.
14. **Noma'lum biznes:** `/b/yoq-biznes` → "Sahifa topilmadi" (404).

## 3-bosqich: Kirish, onboarding va panel

Oldin: test bot yaratilgan, `.env.local` da `TELEGRAM_BOT_TOKEN` va `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` bor, `npm run dev` va boshqa terminalda `npm run bot:dev` ishlayapti.

1. **Kirish:** http://localhost:3000/login → "Telegram orqali kirish" → "Telegramni ochish" → botda "Start" → "✅ Tasdiqlash". Sayt o'zi yangilanib, onboarding'ga o'tadi. Kompyuterda QR kodni telefon bilan skanerlash ham ishlaydi. 10 daqiqadan keyin "Havola muddati tugadi" chiqadi.
2. **Rad etish:** yangi login'da botda "❌ Rad etish" → saytda "Kirish rad etildi".
3. **Onboarding:** 1-qadamda bo'sh "Davom etish" → maydonlar ostida qizil izoh. To'ldiring → 2-qadam (ish vaqti: kunni o'chirish, tanaffus qo'shish, "Barcha kunlarga nusxalash") → 3-qadam (tayyor xizmatlar, narx/vaqtni o'zgartiring, keraksizini ✕) → 4-qadam (usta = sizning ismingiz) → 5-qadam (havola, QR, "Sahifani nashr qilish"). Sahifani yangilasangiz ham ma'lumot yo'qolmaydi.
4. **Bugun:** statistika kartochkalari; yozilish yo'q bo'lsa "Bugun yozilishlar yoʻq" va 2 ta tugma.
5. **➕ Yozilish qo'shish:** yangi mijoz (ism + telefon) → xizmat → vaqt → "Saqlash" → "Assalomu alaykum! Siz … yozildingiz" matni va "Nusxalash".
6. **Kalendar:** yozilish bloki ko'rinadi; bosilsa tafsilotlar; "Vaqtini oʻzgartirish" → yangi vaqt → blok ko'chadi. Bo'sh joy bosilsa shu usta va vaqt bilan "Yozilish qo'shish" ochiladi. "Hafta" — 7 kun.
7. **Statuslar:** tashrif vaqti kelganda "Keldi"/"Kelmadi"; "Bekor qilish" → sabab → bekor bo'ladi va vaqt bo'shaydi.
8. **Ommaviy sahifadan yozilish** (2-bosqich) → panelda darhol ko'rinadi.
9. **Xizmatlar / Ustalar:** qo'shish, tahrirlash, ↑↓ tartib, arxivlash. Ustaga "O'zining jadvali" va dam olish kuni qo'shilsa, o'sha kunlar sahifada band bo'ladi.
10. **Sozlamalar:** 5 tab; "Havola va QR" da sahifani yashirish → `/b/<slug>` 404 beradi; qayta nashr qilish.
11. **QR-poster:** "Chop etish" → faqat poster chiqadi (menyular yo'q), A5/A4.
12. **Chiqish:** "Yana" → "Barcha qurilmalardan chiqish" → boshqa brauzerdagi kirish ham bekor bo'ladi.
13. **Ruxsat:** boshqa Telegram akkaunt bilan kirgan ega birinchi biznesning yozilishlarini ko'ra olmaydi (avtomatik test: `src/server/isolation.int.test.ts`).

## 4-bosqich: Telegram bot

Oldin: `.env.local` da test bot tokeni, `REMINDER_TEST_MODE="true"`; uchta terminal: `npm run dev`, `npm run bot:dev`, `npm run cron:dev`.

1. **Eslatmalar:** saytda yozilib, tasdiq ekranida "📲 Telegram orqali eslatma olish" → botda "Start". "✅ Siz yozildingiz!" keladi. Test rejimida 1 daqiqadan keyin 24 soatlik, 2 daqiqadan keyin 2 soatlik eslatma keladi.
2. **"Kelaman":** eslatmadagi "✅ Ha, kelaman" → xabar oxirida "✅ Rahmat! Sizni kutamiz.", tugmalar yo'qoladi; panelda mijoz yonida ✅ belgisi.
3. **Bekor qilish:** "❌ Bekor qilish" → "Rostdan ham bekor qilasizmi?" → "Ha, bekor qilaman" → panelda "Mijoz bekor qildi", egaga xabar keladi, vaqt saytda yana bo'sh.
4. **Tasdiqlash:** Sozlamalarda "Avtomatik tasdiqlash"ni o'chiring, saytdan yoziling → egaga "🆕 Yangi yozilish — tasdiq kutilmoqda" + "✅ Tasdiqlash" → mijozga "✅ … yozilishingizni tasdiqladi!".
5. **Ekranlash:** ismi `<b>test</b>` bo'lgan mijoz bilan yoziling → egaga kelgan xabarda ism aynan `<b>test</b>` ko'rinishida (qalin emas).
6. **Buyruqlar:** `/yozilishlarim`, `/bugun` (ega uchun), `/til` → 🇷🇺 → bot ruscha javob beradi, `/yordam`, `/id`.
7. **Mini App:** bepul tunnel (`cloudflared tunnel --url http://localhost:3000`) manzilini `NEXT_PUBLIC_APP_URL` ga qo'ying, dev serverni qayta ishga tushiring → botda `/start biz_demo-barber` → "📅 Yozilish" → sahifa Telegram ichida ochiladi (header yo'q), ism o'zi to'ldirilgan, Android "orqaga" bir qadam orqaga qaytaradi, yakunda "Yopish" va botdan darhol tasdiq xabari.
8. **Bot bloklangan:** botni Telegram'da bloklang va yozilish yarating → eslatma yuborilmaydi, xato yo'q; botga qayta yozsangiz yana ishlaydi.

## 5-bosqich: Landing, obuna, admin

Oldin: `.env.local` da `ADMIN_TELEGRAM_IDS` ga o'z ID'ingiz (botga `/id` yozing).

1. **Landing:** http://localhost:3000 — telefonda: sarlavha, ikki tugma ("14 kun bepul boshlash" → kirish, "Demoni koʻrish" → demo), telefon maketi, muammolar, 3 qadam, 6 imkoniyat, narxlar (Start 99 000, Pro 199 000), savollar (bosilsa ochiladi), yakuniy tugma, footer. `/ru` — ruscha.
2. **Huquqiy:** footer'dagi "Maxfiylik siyosati" va "Foydalanish shartlari" — tepada sariq "Loyiha matni…" yozuvi.
3. **Obuna:** panel → "Yana" → "Obuna": holat, kun qoldi, tariflar, to'lov ko'rsatmasi (`PAYMENT_INSTRUCTIONS_UZ`), "Toʻladim" → "Rahmat!…", adminga Telegram xabari.
4. **Admin:** http://localhost:3000/admin — statistika, "Toʻlov qilganini aytganlar". "Bizneslar" → biznesni oching.
5. **Obuna tugashi:** admin kartasida "Sinov tugash sanasi"ni 10 kun oldingi sanaga qo'yib saqlang → `/b/<slug>` da "Onlayn yozilish vaqtincha mavjud emas. Qoʻngʻiroq qiling: …", panelda qizil banner.
6. **To'lov:** "Toʻlov qoʻshish" (Pro, 199 000, 30 kun, Click) → "Toʻlovni saqlash" → sahifada yozilish yana ishlaydi, egaga "✅ Toʻlov qabul qilindi!" keladi, obuna sahifasida to'lov tarixi.
7. **Ruxsat:** admin bo'lmagan akkaunt bilan `/admin` → "Sahifa topilmadi".
8. **Limit:** Start tarifida ikkinchi faol usta qo'shib bo'lmaydi → "Tarif boʻyicha 1 ta faol usta mumkin" va "Tarifni oshirish".

## 6-bosqich: Internetga chiqarish (production)

Oldin: `docs/SETUP_UZ.md` dagi 1–10 bo'limlar bajarilgan. `SAYT` — sizning manzilingiz (masalan `https://navbat-uz.vercel.app`).

1. **Holat:** `SAYT/api/health` → `{"ok":true,"database":true,"utc":true,…}`.
2. **Landing va SEO:** `SAYT` va `SAYT/ru` ochiladi; `SAYT/robots.txt` va `SAYT/sitemap.xml` ochiladi, ichidagi manzillar `SAYT` bilan boshlanadi (localhost emas).
3. **Demo:** "Demoni koʻrish" → `SAYT/b/demo-barber` → xizmat → usta → kun → vaqt → ism va telefon → "Yozilish" → "Tayyor!" sahifasi.
4. **Kirish:** "Kirish" → "Telegram orqali kirish" → asosiy botda Start → saytga qaytib panel ochiladi (yoki onboarding).
5. **Bot:** asosiy botda `/start`, `/yordam`, `/til` ishlaydi; menyuda buyruqlar o'zbekcha (Telegram tili ruscha bo'lsa — ruscha).
6. **Yozilish → xabar:** boshqa telefondan biznes sahifangizdan yozilish → egaga botda "Yangi yozilish" + "Tasdiqlash/Rad etish" → "Tasdiqlash" → mijozga "tasdiqlandi" xabari (mijoz botda Start bosgan bo'lsa).
7. **Mini App:** telefonda biznes sahifangizdagi Telegram orqali yozilish havolasini bosing (`t.me/BOT?start=biz_<slug>`) → botda biznes kartasi → "📅 Yozilish" sahifani Telegram ichida ochadi; yozilgandan keyin "Yopish".
8. **Cron:** cron-job.org → ikkala vazifa "Test run" → 200; 2,5 soat keyingi yozilish uchun 2 soatlik eslatma keladi; ertasi kuni 08:00 da egaga kunlik hisobot.
9. **Admin:** `SAYT/admin` ochiladi (sizning ID'ingiz `ADMIN_TELEGRAM_IDS` da), boshqa akkauntda — "Sahifa topilmadi".
10. **Xavfsizlik:** `SAYT/api/cron/reminders` ni brauzerda ochish → 401 (kalitsiz ishlamaydi).
11. **Tezlik:** https://pagespeed.web.dev → `SAYT/b/<slug>` va `SAYT` → Mobile: Performance, Accessibility, Best Practices, SEO — har biri 85+.
12. **Zaxira:** `npm run db:backup:prod` → `backups/` da yangi fayl.

## Tuzatishlar (6-bosqichdan keyin)

1. **Havola rasmi:** `SAYT/b/demo-barber/opengraph-image` ni oching → biznes nomi yozilgan yashil rasm chiqadi (xato sahifa emas). Havolani Telegram'da yuborsangiz ham shu rasm ko'rinadi.
2. **Bir vaqtga ikki kishi:** ikki xil telefon/brauzerda bir xil vaqtni tanlab, "Tasdiqlash" ni deyarli bir paytda bosing → biri yoziladi, ikkinchisiga "Bu vaqt band" chiqadi (umumiy xato emas).
