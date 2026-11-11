# Navbat — onlayn yozilish tizimi

Kichik xizmat bizneslari (sartaroshxona, salon, klinika, avtoservis va h.k.) uchun onlayn navbat: biznes sahifasi, egasi uchun panel va Telegram bot (tasdiq va eslatmalar).

"Navbat" — ishchi nom. Saytdagi nom `.env.local` dagi `NEXT_PUBLIC_BRAND_NAME` dan olinadi.

To'liq topshiriq: [docs/SPEC.md](docs/SPEC.md) · Holat: [docs/PROGRESS.md](docs/PROGRESS.md) · **Internetga chiqarish: [docs/SETUP_UZ.md](docs/SETUP_UZ.md)**

## 1. Kerakli dasturlar

- **Git** — kodni saqlash uchun.
- **Node.js (LTS)** — loyihani ishga tushiradigan dastur (LTS — uzoq qo'llab-quvvatlanadigan barqaror versiya).

Tekshirish: terminalda `node -v` (`v24` yoki undan yuqori chiqishi kerak) va `git --version`.

### Node.js o'rnatish

**Linux (Kali, Ubuntu)**, parolsiz, faqat sizning foydalanuvchingiz uchun:

1. Terminalni oching (VS Code'da: yuqori menyu → Terminal → New Terminal).
2. Quyidagini nusxalab qo'ying va Enter bosing:
   ```
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.41.0/install.sh | bash
   ```
3. Terminalni yoping va yangisini oching.
4. `nvm install --lts` ni yozing va Enter bosing.
5. `node -v` — `v26...` chiqsa, tayyor.

**Windows:** https://nodejs.org → "LTS" yozuvli yashil tugma → yuklangan `.msi` faylni oching → hamma oynada "Next". Keyin VS Code'ni qayta oching.

**macOS:** https://nodejs.org → "LTS" → yuklangan `.pkg` faylni oching → "Continue" → "Install".

## 2. Ishga tushirish

```
npm install          # kutubxonalarni yuklab olish (bir marta)
npm run dev          # saytni ishga tushirish
```

So'ng brauzerda http://localhost:3000 ni oching. To'xtatish: terminalda `Ctrl + C`.

Sozlamalar `.env.local` faylida saqlanadi. Agar u yo'q bo'lsa, `.env.example` dan nusxa oling va nomini `.env.local` qiling. Bu fayl git'ga tushmaydi.

## 3. Buyruqlar

| Buyruq                        | Nima qiladi                                                      |
| ----------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                 | Saytni kompyuteringizda ishga tushiradi                          |
| `npm run build` / `npm start` | Production versiyasini yig'adi / ishga tushiradi                 |
| `npm run lint`                | Kod uslubini tekshiradi                                          |
| `npm run typecheck`           | TypeScript turlarini tekshiradi                                  |
| `npm test`                    | Avtomatik testlarni ishga tushiradi                              |
| `npm run format`              | Kodni bir xil ko'rinishga keltiradi (Prettier)                   |
| `npm run secret`              | 64 belgilik tasodifiy maxfiy kalit chiqaradi                     |
| `npm run db:migrate`          | Bazaga yangi o'zgarishlarni qo'llaydi (ishlab chiqishda)         |
| `npm run db:seed`             | Demo ma'lumotlarni qo'shadi                                      |
| `npm run db:studio`           | Bazani brauzerda ko'rish                                         |
| `npm run bot:dev`             | Test botni kompyuterda ishga tushiradi                           |
| `npm run cron:dev`            | Eslatmalar va kunlik vazifalarni lokal'da har daqiqada chaqiradi |

### Production (haqiqiy sayt) buyruqlari

Bular faqat `.env.production.local` faylidagi sozlamalarni ishlatadi (`.env.local` hisobga olinmaydi). Batafsil: [docs/SETUP_UZ.md](docs/SETUP_UZ.md).

| Buyruq                    | Nima qiladi                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `npm run db:deploy:prod`  | Production bazada jadvallarni yaratadi/yangilaydi (migratsiyalar) |
| `npm run db:seed:prod`    | Production bazaga demo biznesni qo'shadi ("Demoni ko'rish" uchun) |
| `npm run db:backup:prod`  | Production bazadan zaxira nusxa oladi (`backups/` papkasiga)      |
| `npm run bot:set-webhook` | Asosiy botni saytga ulaydi, buyruqlar va tavsifni o'rnatadi       |

Server holati: `/api/health` (baza ulanishi va UTC tekshiruvi). Docker varianti: `Dockerfile` boshidagi izohlar.
