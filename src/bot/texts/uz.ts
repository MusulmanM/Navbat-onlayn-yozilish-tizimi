// Uzbek bot texts (spec 8.6). Every interpolated value goes through html`` (escaped).
import { html } from "@/bot/html";
import type { BotTexts } from "@/bot/texts/types";

export const uz: BotTexts = {
  welcome: (p) =>
    html`Assalomu alaykum, ${p.firstName}! 👋 Men — ${p.brand} boti. Men orqali: •
    yozilishlaringizni koʻrasiz va bekor qilasiz; • tashrifdan oldin eslatma olasiz. Biznesingiz
    bormi? Mijozlaringizni onlayn yozib olish uchun: ${p.appUrl}`,

  businessCard: (p) =>
    html`<b>${p.name}</b> ${p.category} 📍 ${p.address}` +
    (p.landmark ? html` Moʻljal: ${p.landmark}` : "") +
    html` 🕘 Bugun: ${p.todayHours ?? "dam olish kuni"} 📞 ${p.phone}`,

  bookingConfirmed: (p) =>
    html`✅ <b>Siz yozildingiz!</b>

      🏠 ${p.business} 🔹 ${p.service} 👤 ${p.staffLabel}: ${p.staff} 🗓 ${p.date}, soat ${p.time} 💰
      ${p.price} 📍 ${p.address} Tashrifdan 1 kun va 2 soat oldin eslatib qoʻyaman.`,

  bookingPending: (p) =>
    html`⏳ <b>Soʻrovingiz yuborildi!</b>

      🏠 ${p.business} 🔹 ${p.service} 👤 ${p.staffLabel}: ${p.staff} 🗓 ${p.date}, soat ${p.time}
      Biznes tasdiqlashi bilan sizga xabar beraman.`,

  businessConfirmed: (p) =>
    html`✅ <b>${p.business} yozilishingizni tasdiqladi!</b>

      🗓 ${p.date}, soat ${p.time} 🔹 ${p.service} — ${p.staff} Tashrifdan oldin eslatib qoʻyaman.`,

  reminder24: (p) =>
    html`⏰ <b>Eslatma</b>

      ${p.dayWord} soat ${p.time} da <b>${p.business}</b> sizni kutadi. 🔹 ${p.service} — ${p.staff}
      📍 ${p.address} Kelasizmi?`,

  reminder2: (p) =>
    html`⏰ 2 soatdan keyin, soat ${p.time} da <b>${p.business}</b> sizni kutadi. 🔹 ${p.service} —
      ${p.staff} 📍 ${p.address}` + (p.landmark ? html` Moʻljal: ${p.landmark}` : ""),

  comingThanks: "✅ Rahmat! Sizni kutamiz.",
  cancelAsk: "Rostdan ham bekor qilasizmi?",
  cancelledByClient: `❌ Yozilishingiz bekor qilindi.

Boshqa vaqtga yozilish uchun pastdagi tugmani bosing.`,
  tooLateToCancel: (p) =>
    html`Tashrifga ${p.hours} soatdan kam vaqt qoldi, bu yerdan bekor qilib boʻlmaydi. Iltimos,
    qoʻngʻiroq qiling: ${p.phone}`,
  cancelledByBusiness: (p) =>
    html`❌ Afsuski, <b>${p.business}</b> yozilishingizni bekor qildi. 🗓 ${p.date}, soat ${p.time}` +
    (p.reason ? html` Sabab: ${p.reason}` : "") +
    `\n\nBoshqa vaqtga yozilish uchun pastdagi tugmani bosing.`,
  rescheduled: (p) =>
    html`🔄 <b>Yozilish vaqti oʻzgardi</b>

      🏠 ${p.business} 🗓 Yangi vaqt: ${p.date}, soat ${p.time} 👤 ${p.staffLabel}: ${p.staff}
      Savollar boʻlsa: ${p.phone}`,

  ownerNewBooking: (p) =>
    `🆕 <b>Yangi yozilish</b>${p.pending ? " — tasdiq kutilmoqda" : ""}

` +
    html`👤 ${p.client}, ${p.clientPhone} 🔹 ${p.service} 👨‍💼 ${p.staff} 🗓 ${p.date}, soat ${p.time}
    💰 ${p.price} 🌐 Manba: ${uz.sources[p.source]}` +
    (p.comment ? html` 💬 Izoh: ${p.comment}` : ""),
  ownerClientCancelled: (p) =>
    html`❌ <b>Mijoz yozilishni bekor qildi</b>

      👤 ${p.client}, ${p.clientPhone} 🔹 ${p.service} — ${p.staff} 🗓 ${p.date}, soat ${p.time} Bu
      vaqt endi boʻsh.`,
  ownerConfirmedSuffix: "\n\n✅ Tasdiqlandi",
  ownerRejectedSuffix: "\n\n❌ Rad etildi",

  dailyReport: (p) =>
    html`☀️ <b>Bugun, ${p.date}</b> — ${p.count} ta yozilish ` +
    p.lines.join("\n") +
    (p.more > 0 ? html` …va yana ${p.more} ta` : "") +
    "\n\nYaxshi kun tilaymiz!",
  dailyReportEmpty: (p) =>
    html`☀️ <b>Bugun, ${p.date}</b> Hozircha yozilishlar yoʻq. Havolangizni mijozlarga ulashing:
      ${p.link}`,
  todayEmpty: "Bugun yozilishlar yoʻq.",
  todayHeader: (p) => html`📊 <b>${p.business}</b> — ${p.date}, ${p.count} ta yozilish`,

  billingWarning: (p) =>
    html`⚠️ Obunangiz <b>${p.date}</b> da tugaydi (${p.days} kun qoldi). Toʻlov qilish:
      ${p.billingUrl}`,
  billingExpired: (p) =>
    html`⛔ Obuna muddati tugadi. Onlayn yozilish vaqtincha oʻchirildi, lekin barcha
    maʼlumotlaringiz saqlangan. Toʻlov qilish: ${p.billingUrl}`,
  paymentReceived: (p) => html`✅ Toʻlov qabul qilindi! Obuna <b>${p.date}</b> gacha faol. Rahmat!`,

  loginRequest: (p) =>
    html`🔐 <b>${p.brand} saytiga kirish</b>

      Kimdir (ehtimol siz) saytda «Telegram orqali kirish» tugmasini bosdi. Agar bu siz boʻlsangiz —
      «Tasdiqlash»ni bosing. ⚠️ Agar bu siz boʻlmasangiz, «Rad etish»ni bosing va bu havolani hech
      kimga bermang.`,
  loginDone: "✅ Tayyor! Saytga qayting — sahifa oʻzi yangilanadi.",
  loginRejected: "Kirish rad etildi.",
  loginExpired: "Bu havolaning muddati tugagan. Saytda qaytadan «Telegram orqali kirish»ni bosing.",

  bookingNotFound: "Yozilish topilmadi yoki muddati oʻtgan.",
  noActiveBookings: "Sizda hozircha faol yozilishlar yoʻq.",
  myBookingsHeader: "🗓 <b>Mening yozilishlarim</b>",
  myBookingLine: (p) =>
    html`<b>${p.business}</b> 🗓 ${p.date}, soat ${p.time} 🔹 ${p.service} · ${p.status}`,
  help: (p) => html`Yordam kerakmi? Bizga yozing: @${p.support}`,
  yourId: (p) => `Sizning Telegram ID raqamingiz: <code>${p.id}</code>`,
  chooseLanguage: "Tilni tanlang / Выберите язык",
  languageChanged: "✅ Til oʻzgartirildi.",
  unknown: "Tushunmadim 🙂 Quyidagi tugmalardan foydalaning.",
  linked: "🔔 Eslatmalar shu chatga keladi.",
  notAllowed: "Bu amal siz uchun emas.",

  adminNewBusiness: (p) =>
    html`🆕 Yangi biznes: ${p.name} (${p.category}, ${p.region}). Egasi: ${p.owner}` +
    (p.username ? html` @${p.username}` : ""),
  adminPaymentClaim: (p) =>
    html`💳 ${p.business} toʻlov qilganini aytdi. Tarif: ${p.plan}. Tekshirish: ${p.adminUrl}`,

  statusLabels: {
    PENDING: "tasdiq kutilmoqda",
    CONFIRMED: "tasdiqlangan",
    COMPLETED: "yakunlangan",
    NO_SHOW: "kelmagan",
    CANCELLED_BY_CLIENT: "bekor qilingan",
    CANCELLED_BY_BUSINESS: "bekor qilingan",
  },
  dayWords: { today: "Bugun", tomorrow: "Ertaga" },
  sources: { WEB: "Sayt", TELEGRAM: "Telegram", PANEL: "Panel" },
  dayOff: "dam olish kuni",
  buttons: {
    book: "📅 Yozilish",
    map: "🗺 Xaritada ochish",
    cancel: "❌ Bekor qilish",
    details: "🔗 Batafsil",
    yesComing: "✅ Ha, kelaman",
    yesCancel: "Ha, bekor qilaman",
    noKeep: "Yoʻq, qolsin",
    rebook: "📅 Qayta yozilish",
    confirm: "✅ Tasdiqlash",
    reject: "❌ Rad etish",
    openInPanel: "📋 Panelda ochish",
    loginConfirm: "✅ Tasdiqlash",
    loginReject: "❌ Rad etish",
    myBookings: "🗓 Mening yozilishlarim",
    language: "🌐 Til / Язык",
    today: "📊 Bugungi jadval",
    openPanel: "⚙️ Panelni ochish",
    uz: "🇺🇿 Oʻzbekcha",
    ru: "🇷🇺 Русский",
  },
  commands: {
    start: "Boshlash",
    yozilishlarim: "Mening yozilishlarim",
    bugun: "Bugungi jadval (biznes egalari uchun)",
    til: "Tilni oʻzgartirish",
    yordam: "Yordam",
  },
  description:
    "Onlayn yozilish boti: yozilishlaringizni koʻrasiz, bekor qilasiz va tashrifdan oldin eslatma olasiz.",
  shortDescription: "Onlayn yozilish va eslatmalar",
};
