# Saytni internetga chiqarish — qadam-baqadam yo'riqnoma

Bu yo'riqnoma dasturchi bo'lmagan odam uchun yozilgan. Qadamlarni **tartib bilan** bajaring: har bir bo'lim oldingisidan foydalanadi. Hammasi **bepul** (faqat 11-bo'limdagi domen pullik va ixtiyoriy).

Taxminiy vaqt: birinchi marta 2–3 soat.

**Kerak bo'ladigan bepul akkauntlar:** GitHub, Supabase, Telegram (@BotFather), Vercel, cron-job.org.

> **Muhim qoida.** Parol, token va maxfiy kalitlarni hech kimga yubormang, chatga yozmang, skrinshot qilmang. Ular faqat ikki joyda turadi: kompyuteringizdagi `.env.production.local` faylida va Vercel sozlamalarida.

---

## Mundarija

1. Kerakli dasturlar
2. Telegram botlar
3. Supabase (ma'lumotlar bazasi)
4. `.env.production.local` fayli
5. Bazani tayyorlash
6. GitHub (kodni yuklash)
7. Vercel (saytni ishga tushirish)
8. Botni saytga ulash (webhook)
9. Admin ID'ni qo'shish
10. cron-job.org (eslatmalar)
11. Domen (ixtiyoriy, pullik)
12. Ishga tushgandan keyingi tekshiruv
13. Zaxira nusxa (backup)
14. Ko'p uchraydigan muammolar
15. Muhim eslatmalar (Vercel tarifi, Docker varianti)

---

## 1. Kerakli dasturlar

| Dastur      | Nima uchun                           | Qayerdan                                  |
| ----------- | ------------------------------------ | ----------------------------------------- |
| **Node.js** | Loyihani ishga tushiradi             | `README.md` → "Node.js o'rnatish" bo'limi |
| **Git**     | Kodni saqlaydi va GitHub'ga yuklaydi | https://git-scm.com/downloads             |
| **VS Code** | Fayllarni ochish va terminal         | https://code.visualstudio.com             |

- **Windows:** Git'ni o'rnatishda hamma oynada "Next" bosing (standart sozlamalar to'g'ri).
- **macOS:** terminalda `git --version` yozing — Git yo'q bo'lsa, macOS o'zi o'rnatishni taklif qiladi.
- **Linux:** Git odatda bor.

Tekshirish — VS Code'da loyiha papkasini oching (File → Open Folder), keyin Terminal → New Terminal va yozing:

```
node -v
git --version
```

`v24` yoki undan yuqori va `git version ...` chiqsa — tayyor. Keyin bir marta:

```
npm install
```

---

## 2. Telegram botlar

Ikkita bot kerak:

- **test bot** — kompyuteringizda sinash uchun (`npm run bot:dev`);
- **asosiy bot** — mijozlar ishlatadigan haqiqiy bot.

Ular bir-biriga xalaqit bermasligi uchun alohida.

1. Telegram'da **@BotFather** ni oching va **Start** bosing.
2. `/newbot` yozing.
3. Bot nomini yozing (odamlarga ko'rinadi), masalan: `Navbat`.
4. Bot username'ini yozing — `bot` bilan tugashi shart, masalan: `navbat_uz_bot`.
5. BotFather **token** beradi (`123456789:AAE...` ko'rinishida). Bu — botning paroli. Uni hozircha xavfsiz joyga yozib qo'ying, 4-bo'limda faylga qo'yasiz.
6. Rasm qo'yish: `/setuserpic` → botni tanlang → kvadrat rasm yuboring (masalan, logotip).
7. Xuddi shunday **test bot** yarating (masalan, `navbat_test_uz_bot`). Uning tokeni kompyuterdagi `.env.local` fayliga qo'yiladi (lokal sinov uchun).

> Bot buyruqlari va tavsifini qo'lda yozish shart emas — 8-bo'limdagi buyruq ularni o'zi o'rnatadi.

---

## 3. Supabase (ma'lumotlar bazasi)

### 3.1. Loyiha yaratish

1. https://supabase.com → **Start your project** → **Continue with GitHub** (avval 6-bo'limdagi GitHub akkauntini oching) yoki email bilan ro'yxatdan o'ting.
2. **New project** bosing:
   - **Name:** `navbat`
   - **Database Password:** **Generate a password** bosing. Parolni darhol parollar menejeriga yoki daftarga yozing — keyin uni ko'rib bo'lmaydi. Agar parolni o'zingiz yozsangiz, faqat lotin harflari va raqamlardan foydalaning (`@`, `#`, `/` kabi belgilar ulanish satrini buzadi).
   - **Region:** **Central EU (Frankfurt)** — O'zbekistonga eng yaqin va Vercel bilan bir joyda.
   - **Plan:** Free.
3. **Create new project** bosing va 1–2 daqiqa kuting.

### 3.2. Ulanish satrlari

1. Loyiha sahifasining yuqorisidagi **Connect** tugmasini bosing.
2. **Connection String** bo'limida ikkita satr kerak:

| Nomi                   | Port   | Qayerga yoziladi |
| ---------------------- | ------ | ---------------- |
| **Transaction pooler** | `6543` | `DATABASE_URL`   |
| **Session pooler**     | `5432` | `DIRECT_URL`     |

3. Ikkalasida ham `[YOUR-PASSWORD]` o'rniga 3.1 dagi parolni qo'ying (kvadrat qavslarsiz).
4. Oxiriga shifrlash sozlamasini qo'shing:
   - `DATABASE_URL` oxiriga: `?uselibpqcompat=true&sslmode=require`
   - `DIRECT_URL` oxiriga: `?sslmode=require`

Natija taxminan shunday bo'ladi (sizdagi harflar boshqa):

```
DATABASE_URL="postgresql://postgres.abcdefgh:PAROL@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?uselibpqcompat=true&sslmode=require"
DIRECT_URL="postgresql://postgres.abcdefgh:PAROL@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

### 3.3. Bepul tarif cheklovlari

- Baza hajmi 500 MB gacha. Bu minglab bizneslar uchun yetadi.
- **7 kun faollik bo'lmasa, loyiha to'xtatib qo'yiladi (pause).** Bizning cron (10-bo'lim) har 5 daqiqada bazaga murojaat qiladi, shuning uchun odatda to'xtamaydi. Agar to'xtasa: Supabase → loyiha → **Restore project**.
- Bepul tarifda Supabase'ning o'zi zaxira nusxani yuklab berish imkonini bermaydi. Shuning uchun haftasiga bir marta o'zingiz nusxa oling (13-bo'lim).

---

## 4. `.env.production.local` fayli

Bu fayl production (haqiqiy sayt) sozlamalarini saqlaydi. U faqat sizning kompyuteringizda turadi va GitHub'ga tushmaydi.

1. VS Code'da `.env.example` faylini oching, hammasini nusxalang.
2. Loyiha papkasida yangi fayl yarating: **`.env.production.local`** (nuqta bilan boshlanadi). Nusxani unga qo'ying.
3. Qiymatlarni to'ldiring:

| O'zgaruvchi                               | Nima yoziladi                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`, `DIRECT_URL`              | 3.2 dagi ikki satr                                                              |
| `NEXT_PUBLIC_APP_URL`                     | Sayt manzili. Hozircha `https://LOYIHA-NOMI.vercel.app` (7-bo'limda aniqlaysiz) |
| `NEXT_PUBLIC_BRAND_NAME`                  | Saytdagi nom, masalan `Navbat`                                                  |
| `NEXT_PUBLIC_SUPPORT_TELEGRAM`            | Yordam uchun Telegram username'ingiz, `@` belgisiz                              |
| `TELEGRAM_BOT_TOKEN`                      | **Asosiy** botning tokeni                                                       |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`       | Asosiy bot username'i, `@` belgisiz, masalan `navbat_uz_bot`                    |
| `TELEGRAM_WEBHOOK_SECRET`                 | Tasodifiy kalit (pastga qarang)                                                 |
| `SESSION_SECRET`                          | Tasodifiy kalit (boshqa)                                                        |
| `CRON_SECRET`                             | Tasodifiy kalit (yana boshqa)                                                   |
| `ADMIN_TELEGRAM_IDS`                      | Hozircha bo'sh qoldiring — 9-bo'limda to'ldirasiz                               |
| `PAYMENT_INSTRUCTIONS_UZ` / `_RU`         | Obuna uchun to'lov ko'rsatmasi (karta raqami va h.k.), o'zbekcha va ruscha      |
| `REMINDER_TEST_MODE`, `TEST_DATABASE_URL` | O'chirib tashlang yoki bo'sh qoldiring (faqat lokal sinov uchun)                |

**Tasodifiy kalitlar:** terminalda `npm run secret` yozing — 64 belgilik kalit chiqadi. Uch marta ishga tushiring va har birini alohida o'zgaruvchiga qo'ying. Bitta kalitni ikki joyga qo'ymang.

4. Faylni saqlang (Ctrl+S).

> Bu fayl yo'qolsa, uni Vercel sozlamalaridan qayta tiklash mumkin. Baribir nusxasini parollar menejerida saqlang.

---

## 5. Bazani tayyorlash

Terminalda ketma-ket yozing:

```
npm run db:deploy:prod
```

Bu bazada jadvallarni yaratadi. Avval `▶ Production sozlamalari ..., baza: ...pooler.supabase.com:5432` chiqadi, oxirida `All migrations have been successfully applied`.

```
npm run db:seed:prod
```

Bu demo biznes "Ali Barber" ni qo'shadi. U landing'dagi **"Demoni ko'rish"** tugmasi uchun kerak. Oxirida `✅ Demo biznes tayyor` chiqadi. Qayta ishga tushirsangiz, takror qo'shilmaydi.

Agar `❌ .env.production.local da xato` chiqsa — ro'yxatdagi o'zgaruvchilarni to'g'rilang va qaytadan urinib ko'ring.

---

## 6. GitHub (kodni yuklash)

### 6.1. Repository

Bu loyiha papkasi GitHub'dagi repository'ingizga allaqachon ulangan. Tekshirish uchun terminalda `git remote -v` yozing — `origin https://github.com/...` chiqadi.

**Repository private ekanini tekshiring:**

1. GitHub'da repository'ni oching.
2. **Settings → General** → eng pastdagi **Danger Zone**.
3. "Change repository visibility" yonida **Private** yozuvi turishi kerak. **Public** bo'lsa → **Change visibility → Make private**.

> Agar yangi repository kerak bo'lsa: GitHub'da o'ng yuqoridagi **+** → **New repository** → **Private** → README va boshqalarni belgilamang → **Create**. Keyin terminalda: `git remote set-url origin YANGI_MANZIL`.

### 6.2. Kodni yuklash

VS Code terminalida:

```
git push -u origin main develop
```

Birinchi marta VS Code **"Sign in with GitHub"** oynasini chiqarishi mumkin → **Allow** → brauzerda tasdiqlang.

- `main` — saytda ishlaydigan versiya. Vercel faqat shundan yangilanadi.
- `develop` — ish davom etadigan joy. Yangi o'zgarishlar avval shu yerda tayyorlanadi va tekshiriladi, keyin `main` ga qo'shilib, `git push` qilinadi.

---

## 7. Vercel (saytni ishga tushirish)

1. https://vercel.com → **Sign Up** → **Hobby** → **Continue with GitHub**.
2. **Add New… → Project**. Ro'yxatda `navbat` ko'rinmasa: **Adjust GitHub App Permissions** → `navbat` repository'ga ruxsat bering.
3. `navbat` yonidagi **Import** bosing.
4. **Project Name:** noyob nom bering, masalan `navbat-uz`. Sayt manzili `https://navbat-uz.vercel.app` bo'ladi.
5. **Framework Preset:** Next.js (o'zi tanlanadi). Boshqa sozlamalarga tegmang.
6. **Environment Variables:**
   - `.env.production.local` faylining **butun matnini** nusxalab, birinchi **Key** maydoniga qo'ying — Vercel hammasini o'zi bo'lib oladi.
   - `NEXT_PUBLIC_APP_URL` ni 4-qadamdagi manzilga to'g'rilang: `https://navbat-uz.vercel.app`, oxirida `/` siz.
7. **Deploy** bosing va 2–4 daqiqa kuting. "Congratulations!" chiqsa — sayt ishlayapti.
8. **Region'ni tekshiring:** Project → **Settings → Functions → Function Region** = **Frankfurt (fra1)**. Bu loyihadagi `vercel.json` orqali o'zi qo'yiladi; boshqacha bo'lsa, Frankfurt'ni tanlang.
9. **Manzilni tekshiring:** Project → **Settings → Domains**. Agar manzil 4-qadamdagidan farq qilsa:
   - Settings → Environment Variables → `NEXT_PUBLIC_APP_URL` ni to'g'rilang;
   - `.env.production.local` da ham to'g'rilang;
   - **Deployments** → oxirgi deploy yonidagi **⋯** → **Redeploy**.

> **Eslatma:** Vercel'da biror o'zgaruvchini o'zgartirsangiz, u faqat **Redeploy** dan keyin kuchga kiradi.

Tekshirish — brauzerda oching: `https://SAYT/api/health`. Natija `{"ok":true,"database":true,"utc":true,...}` bo'lishi kerak.

---

## 8. Botni saytga ulash (webhook)

Webhook — Telegram botga kelgan xabarlarni saytingizga yuboradigan manzil. Terminalda:

```
npm run bot:set-webhook
```

Natija: `✅ @navbat_uz_bot: webhook ulandi → https://.../api/telegram/webhook`. Bu buyruq botning buyruqlar menyusini va tavsifini (o'zbek va rus tilida) ham o'rnatadi.

Tekshirish: asosiy botga `/start` yozing — bot salomlashishi kerak.

> Sayt manzili o'zgarsa (masalan, domen ulasangiz), bu buyruqni qaytadan ishga tushiring.

---

## 9. Admin ID'ni qo'shish

Admin panel (`/admin`) faqat ID'si ro'yxatda bo'lgan odamlarga ochiladi.

1. Asosiy botga `/id` yozing — bot raqam yuboradi, masalan `123456789`.
2. Vercel → Project → **Settings → Environment Variables** → `ADMIN_TELEGRAM_IDS` → raqamni yozing. Bir nechta admin bo'lsa, vergul bilan: `123456789,987654321`.
3. `.env.production.local` da ham shu qiymatni yozing.
4. **Deployments → ⋯ → Redeploy**.
5. Saytda **Kirish** → Telegram orqali kiring → `https://SAYT/admin` ochilishi kerak.

---

## 10. cron-job.org (eslatmalar va kunlik vazifalar)

Cron — belgilangan vaqtda saytni o'zi "chaqirib turadigan" xizmat. Shu tufayli eslatmalar va kunlik hisobotlar yuboriladi.

1. https://cron-job.org → **Sign up** → emailni tasdiqlang.
2. **Dashboard → Cronjobs → Create cronjob**.

**1-vazifa: eslatmalar**

- **Title:** `Navbat eslatmalar`
- **URL:** `https://SAYT/api/cron/reminders`
- **Execution schedule:** **Every 5 minutes**
- **Advanced** tab → **Headers** → **Add header**:
  - Key: `Authorization`
  - Value: `Bearer CRON_SECRET_QIYMATI` — `Bearer`, bitta probel, keyin `.env.production.local` dagi `CRON_SECRET`.
- **Request method:** `GET`
- **Create** bosing.

**2-vazifa: kunlik hisobot va obuna ogohlantirishlari**

- **Title:** `Navbat kunlik`
- **URL:** `https://SAYT/api/cron/daily`
- **Execution schedule:** **Every day at 08:00**, time zone **Asia/Tashkent** (yoki UTC bo'yicha 03:00).
- **Headers:** 1-vazifadagi kabi `Authorization: Bearer ...`
- **Create** bosing.

**Tekshirish:** vazifa yonidagi **Test run** → javob kodi **200** bo'lishi kerak.

- **401** — kalit noto'g'ri. `Bearer` va probelni tekshiring.
- **404** — URL noto'g'ri.

**Tavsiya:** har bir vazifada **Notifications → Notify me when execution fails** ni yoqing.

---

## 11. Domen (ixtiyoriy, keyinroq — PULLIK)

`.vercel.app` manzili bepul va to'liq ishlaydi. O'z domeningiz (masalan `navbat.uz`) yiliga pul turadi — xohlasangiz keyinroq oling.

1. `.uz` domenni akkreditatsiyalangan registratordan sotib oling (ro'yxat: https://cctld.uz).
2. Vercel → Project → **Settings → Domains** → **Add** → domeningizni yozing.
3. Vercel ko'rsatgan DNS yozuvlarini (A yoki CNAME) registrator sahifasidagi DNS sozlamalariga aynan ko'chiring. Bir necha soat ichida ishlaydi.
4. So'ng:
   - `NEXT_PUBLIC_APP_URL` ni yangi domenga o'zgartiring (Vercel'da va `.env.production.local` da) → **Redeploy**;
   - `npm run bot:set-webhook` ni qaytadan ishga tushiring;
   - cron-job.org'dagi ikki URL'ni yangilang.

---

## 12. Ishga tushgandan keyingi tekshiruv

Telefoningizda (Wi-Fi'siz, mobil internetda) birma-bir tekshiring:

- [ ] `https://SAYT/api/health` → `"ok":true`.
- [ ] Bosh sahifa ochiladi, **"Demoni ko'rish"** → demo biznes sahifasi ochiladi.
- [ ] UZ/RU tugmasi tilni almashtiradi.
- [ ] **Kirish** → Telegram → botda **Start** → saytga qaytib, panelga kirdingiz.
- [ ] Onboarding'ni tugatdingiz: biznes nomi, xizmat, ish vaqti, havola tayyor.
- [ ] Boshqa telefondan (yoki do'stingiz) biznes sahifangizdan yozildi → sizga botda xabar keldi → **Tasdiqlash** bosdingiz → mijozga xabar bordi.
- [ ] Kunduzi taxminan 2,5 soatdan keyingi vaqtga yozilib, tasdiqlang. Uchrashuvdan 2 soat oldin mijozga eslatma keladi — bu cron ishlayotganini ko'rsatadi.
- [ ] cron-job.org → har ikki vazifa tarixida **200**.
- [ ] `https://SAYT/admin` ochiladi (9-bo'lim).
- [ ] Panel → **QR** → poster chop etiladi, QR kod telefonda biznes sahifasini ochadi.
- [ ] https://pagespeed.web.dev → biznes sahifangiz manzili → **Mobile** natijasi 85 yoki yuqori.
- [ ] `docs/QA.md` dagi ssenariylarni production'da bir marta o'tkazing.

---

## 13. Zaxira nusxa (backup)

Haftasiga bir marta (va katta o'zgarishdan oldin) bazadan nusxa oling.

### 13.1. Bir marta: PostgreSQL vositalarini o'rnatish

- **Windows:**
  - https://www.postgresql.org/download/windows → **Download the installer** → eng yangi versiya.
  - O'rnatishda faqat **Command Line Tools** ni belgilang.
  - Keyin "Edit the system environment variables" → Path ga `C:\Program Files\PostgreSQL\17\bin` ni qo'shing (raqam versiyaga qarab).
- **macOS:** https://brew.sh dan Homebrew o'rnating, keyin `brew install libpq && brew link --force libpq`.
- **Linux (Ubuntu/Kali):** `sudo apt install postgresql-client`.

Tekshirish: `pg_dump --version`. Nusxa olishda `server version mismatch` xatosi chiqsa, xatoda ko'rsatilgan versiyani (yoki yangirog'ini) o'rnating.

### 13.2. Nusxa olish

```
npm run db:backup:prod
```

Nusxa `backups/navbat-SANA.dump` fayliga tushadi. Uni Google Drive yoki fleshkaga ko'chiring.

> Bu faylda mijozlarning ism va telefonlari bor. Uni hech kimga bermang. GitHub'ga tushmaydi.

### 13.3. Tiklash

Bazani nusxadan tiklash **mavjud ma'lumotlarni o'chiradi**. Buni o'zingiz qilmang — dasturchi bilan birga qiling.

---

## 14. Ko'p uchraydigan muammolar

### Bot javob bermayapti

1. `npm run bot:set-webhook` ni qayta ishga tushiring.
   - `Oxirgi xato:` qatori chiqsa, uni o'qing.
   - `401 Unauthorized` — token noto'g'ri.
   - `Wrong response from the webhook: 401` — `TELEGRAM_WEBHOOK_SECRET` Vercel'da va faylda bir xil emas.
2. Vercel'dagi `TELEGRAM_BOT_TOKEN` **asosiy** botniki ekanini tekshiring (test botniki emas).
3. Vercel → Project → **Logs** → qizil xatolarni qidiring.
4. Test bot asosiy bot o'rniga javob bersa: test bot faqat `npm run bot:dev` bilan kompyuterda ishlaydi, u bilan adashtirmang.

### "Telegram orqali kirish" ishlamayapti

- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` asosiy bot username'iga teng bo'lishi kerak (`@` siz).
- O'zgartirgan bo'lsangiz — **Redeploy**. `NEXT_PUBLIC_` bilan boshlanadigan o'zgaruvchilar faqat yangi deploy'da kuchga kiradi.

### Eslatmalar kelmayapti

1. cron-job.org → vazifa tarixi:
   - **401** — `Authorization` sarlavhasi noto'g'ri;
   - **404** — URL noto'g'ri;
   - **500/503** — Vercel Logs'ni ko'ring.
2. Mijoz botda **Start** bosmagan bo'lsa, unga Telegram xabar borolmaydi. Bu Telegram qoidasi: bot birinchi bo'lib yozolmaydi.
3. Kechasi (22:00–07:00) eslatma yuborilmaydi — bu normal:
   - 24 soatlik eslatma kechqurun 20:00 ga suriladi;
   - tunga to'g'ri kelgan 2 soatlik eslatma yuborilmaydi.

### Baza ulanmayapti (`/api/health` → `"database":false`)

1. Supabase loyihasi to'xtatilganmi (paused)? → **Restore project**.
2. `DATABASE_URL` dagi parol to'g'rimi? `[YOUR-PASSWORD]` qavslari olib tashlanganmi?
3. Parolda maxsus belgilar bo'lsa, Supabase → Settings → Database → **Reset database password** → faqat harf va raqamli parol qo'ying. Keyin uni Vercel'da, faylda va 3.2 dagi satrlarda yangilang.

### `/api/health` → `"utc":false`

Supabase → **SQL Editor** → quyidagini yozib **Run** bosing:

```
alter database postgres set timezone to 'UTC';
```

So'ng Vercel'da **Redeploy** qiling.

### Sayt ochilmayapti, Logs'da "Sozlamalarda xato"

Xatoda qaysi o'zgaruvchi yo'qligi yozilgan (masalan `CRON_SECRET — topilmadi`). Vercel → Environment Variables'da qo'shing → **Redeploy**.

### `npm run db:deploy:prod` xato berdi

- `P1001 Can't reach database` — `DIRECT_URL` noto'g'ri yoki loyiha to'xtatilgan.
- `P1000 Authentication failed` — parol noto'g'ri.

---

## 15. Muhim eslatmalar

### Vercel tarifi

Vercel'ning bepul **Hobby** tarifi faqat **shaxsiy, notijorat** foydalanish uchun. Bepul sinov (pilot) davrida shu tarifda ishlaymiz.

Bizneslardan pul olishni boshlaganda ikki yo'l bor:

- Vercel **Pro** ga o'tish (pullik);
- saytni boshqa serverga ko'chirish (pastdagi Docker varianti).

Kod Vercel'ga bog'lanmagan, shuning uchun ko'chirish oson.

### Docker varianti (VPS, masalan O'zbekistondagi server)

Loyihada tayyor `Dockerfile` bor. Har qanday Linux serverda (Docker o'rnatilgan bo'lsa):

```
docker build -t navbat \
  --build-arg NEXT_PUBLIC_APP_URL=https://navbat.uz \
  --build-arg NEXT_PUBLIC_BRAND_NAME=Navbat \
  --build-arg NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=navbat_uz_bot \
  --build-arg NEXT_PUBLIC_SUPPORT_TELEGRAM=navbat_support .
docker run -d --name navbat -p 3000:3000 --env-file .env.production.local --restart unless-stopped navbat
```

- Server oldiga HTTPS beradigan proxy kerak (masalan Caddy — bepul va sertifikatni o'zi oladi).
- Baza Supabase'da qolishi yoki serverdagi PostgreSQL'ga ko'chirilishi mumkin (13-bo'limdagi nusxa orqali).
- Cron va webhook xuddi Vercel'dagidek ishlaydi: manzilni yangilab, `npm run bot:set-webhook` ni qayta ishga tushirasiz.
- Buni birinchi marta dasturchi bilan birga qilish tavsiya etiladi.

### Shaxsiy ma'lumotlar

Mijozlarning ismi va telefoni saqlanadi. Bizneslardan pul olishni boshlashdan oldin yurist bilan maslahatlashing ("Shaxsga doir ma'lumotlar to'g'risida"gi qonun). Kerak bo'lsa, baza oddiy PostgreSQL bo'lgani uchun uni O'zbekistondagi serverga ko'chirish mumkin.
