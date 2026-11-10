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
