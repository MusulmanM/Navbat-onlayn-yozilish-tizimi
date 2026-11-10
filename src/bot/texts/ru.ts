// Russian bot texts (spec 8.6, natural translation). Values are escaped via html``.
import { html } from "@/bot/html";
import type { BotTexts } from "@/bot/texts/types";

export const ru: BotTexts = {
  welcome: (p) =>
    html`Здравствуйте, ${p.firstName}! 👋 Я — бот ${p.brand}. Через меня вы: • видите и отменяете
    свои записи; • получаете напоминания перед визитом. У вас свой бизнес? Принимайте клиентов
    онлайн: ${p.appUrl}`,

  businessCard: (p) =>
    html`<b>${p.name}</b> ${p.category} 📍 ${p.address}` +
    (p.landmark ? html` Ориентир: ${p.landmark}` : "") +
    html` 🕘 Сегодня: ${p.todayHours ?? "выходной"} 📞 ${p.phone}`,

  bookingConfirmed: (p) =>
    html`✅ <b>Вы записаны!</b>

      🏠 ${p.business} 🔹 ${p.service} 👤 ${p.staffLabel}: ${p.staff} 🗓 ${p.date}, в ${p.time} 💰
      ${p.price} 📍 ${p.address} Напомню за 1 день и за 2 часа до визита.`,

  bookingPending: (p) =>
    html`⏳ <b>Заявка отправлена!</b>

      🏠 ${p.business} 🔹 ${p.service} 👤 ${p.staffLabel}: ${p.staff} 🗓 ${p.date}, в ${p.time}
      Сообщу, как только бизнес подтвердит запись.`,

  businessConfirmed: (p) =>
    html`✅ <b>${p.business} подтвердил вашу запись!</b>

      🗓 ${p.date}, в ${p.time} 🔹 ${p.service} — ${p.staff} Напомню перед визитом.`,

  reminder24: (p) =>
    html`⏰ <b>Напоминание</b>

      ${p.dayWord} в ${p.time} вас ждут в <b>${p.business}</b>. 🔹 ${p.service} — ${p.staff} 📍
      ${p.address} Вы придёте?`,

  reminder2: (p) =>
    html`⏰ Через 2 часа, в ${p.time}, вас ждут в <b>${p.business}</b>. 🔹 ${p.service} — ${p.staff}
      📍 ${p.address}` + (p.landmark ? html` Ориентир: ${p.landmark}` : ""),

  comingThanks: "✅ Спасибо! Ждём вас.",
  cancelAsk: "Точно отменить запись?",
  cancelledByClient: `❌ Ваша запись отменена.

Чтобы записаться на другое время, нажмите кнопку ниже.`,
  tooLateToCancel: (p) =>
    html`До визита осталось меньше ${p.hours} ч, отменить здесь нельзя. Пожалуйста, позвоните:
    ${p.phone}`,
  cancelledByBusiness: (p) =>
    html`❌ К сожалению, <b>${p.business}</b> отменил вашу запись. 🗓 ${p.date}, в ${p.time}` +
    (p.reason ? html` Причина: ${p.reason}` : "") +
    `\n\nЧтобы записаться на другое время, нажмите кнопку ниже.`,
  rescheduled: (p) =>
    html`🔄 <b>Время записи изменилось</b>

      🏠 ${p.business} 🗓 Новое время: ${p.date}, в ${p.time} 👤 ${p.staffLabel}: ${p.staff} Вопросы:
      ${p.phone}`,

  ownerNewBooking: (p) =>
    `🆕 <b>Новая запись</b>${p.pending ? " — ждёт подтверждения" : ""}

` +
    html`👤 ${p.client}, ${p.clientPhone} 🔹 ${p.service} 👨‍💼 ${p.staff} 🗓 ${p.date}, в ${p.time} 💰
    ${p.price} 🌐 Источник: ${ru.sources[p.source]}` +
    (p.comment ? html` 💬 Комментарий: ${p.comment}` : ""),
  ownerClientCancelled: (p) =>
    html`❌ <b>Клиент отменил запись</b>

      👤 ${p.client}, ${p.clientPhone} 🔹 ${p.service} — ${p.staff} 🗓 ${p.date}, в ${p.time} Это
      время теперь свободно.`,
  ownerConfirmedSuffix: "\n\n✅ Подтверждено",
  ownerRejectedSuffix: "\n\n❌ Отклонено",

  dailyReport: (p) =>
    html`☀️ <b>Сегодня, ${p.date}</b> — записей: ${p.count} ` +
    p.lines.join("\n") +
    (p.more > 0 ? html` …и ещё ${p.more}` : "") +
    "\n\nХорошего дня!",
  dailyReportEmpty: (p) =>
    html`☀️ <b>Сегодня, ${p.date}</b> Записей пока нет. Поделитесь ссылкой с клиентами: ${p.link}`,
  todayEmpty: "Сегодня записей нет.",
  todayHeader: (p) => html`📊 <b>${p.business}</b> — ${p.date}, записей: ${p.count}`,

  billingWarning: (p) =>
    html`⚠️ Подписка заканчивается <b>${p.date}</b> (осталось дней: ${p.days}). Оплатить:
      ${p.billingUrl}`,
  billingExpired: (p) =>
    html`⛔ Подписка закончилась. Онлайн-запись временно отключена, но все ваши данные сохранены.
    Оплатить: ${p.billingUrl}`,
  paymentReceived: (p) => html`✅ Оплата получена! Подписка активна до <b>${p.date}</b>. Спасибо!`,

  loginRequest: (p) =>
    html`🔐 <b>Вход на сайт ${p.brand}</b>

      Кто-то (вероятно, вы) нажал «Войти через Telegram» на сайте. Если это вы — нажмите
      «Подтвердить». ⚠️ Если это не вы, нажмите «Отклонить» и никому не передавайте эту ссылку.`,
  loginDone: "✅ Готово! Вернитесь на сайт — страница обновится сама.",
  loginRejected: "Вход отклонён.",
  loginExpired: "Срок действия ссылки истёк. Нажмите «Войти через Telegram» на сайте ещё раз.",

  bookingNotFound: "Запись не найдена или устарела.",
  noActiveBookings: "У вас пока нет активных записей.",
  myBookingsHeader: "🗓 <b>Мои записи</b>",
  myBookingLine: (p) =>
    html`<b>${p.business}</b> 🗓 ${p.date}, в ${p.time} 🔹 ${p.service} · ${p.status}`,
  help: (p) => html`Нужна помощь? Напишите нам: @${p.support}`,
  yourId: (p) => `Ваш Telegram ID: <code>${p.id}</code>`,
  chooseLanguage: "Tilni tanlang / Выберите язык",
  languageChanged: "✅ Язык изменён.",
  unknown: "Не понял 🙂 Воспользуйтесь кнопками ниже.",
  linked: "🔔 Напоминания будут приходить в этот чат.",
  notAllowed: "Это действие не для вас.",

  adminNewBusiness: (p) =>
    html`🆕 Новый бизнес: ${p.name} (${p.category}, ${p.region}). Владелец: ${p.owner}` +
    (p.username ? html` @${p.username}` : ""),
  adminPaymentClaim: (p) =>
    html`💳 ${p.business} сообщил об оплате. Тариф: ${p.plan}. Проверить: ${p.adminUrl}`,

  statusLabels: {
    PENDING: "ждёт подтверждения",
    CONFIRMED: "подтверждена",
    COMPLETED: "завершена",
    NO_SHOW: "не пришёл",
    CANCELLED_BY_CLIENT: "отменена",
    CANCELLED_BY_BUSINESS: "отменена",
  },
  dayWords: { today: "Сегодня", tomorrow: "Завтра" },
  sources: { WEB: "Сайт", TELEGRAM: "Telegram", PANEL: "Панель" },
  dayOff: "выходной",
  buttons: {
    book: "📅 Записаться",
    map: "🗺 Открыть на карте",
    cancel: "❌ Отменить",
    details: "🔗 Подробнее",
    yesComing: "✅ Да, приду",
    yesCancel: "Да, отменить",
    noKeep: "Нет, оставить",
    rebook: "📅 Записаться снова",
    confirm: "✅ Подтвердить",
    reject: "❌ Отклонить",
    openInPanel: "📋 Открыть в панели",
    loginConfirm: "✅ Подтвердить",
    loginReject: "❌ Отклонить",
    myBookings: "🗓 Мои записи",
    language: "🌐 Til / Язык",
    today: "📊 Расписание на сегодня",
    openPanel: "⚙️ Открыть панель",
    uz: "🇺🇿 Oʻzbekcha",
    ru: "🇷🇺 Русский",
  },
  commands: {
    start: "Начать",
    yozilishlarim: "Мои записи",
    bugun: "Расписание на сегодня (для владельцев)",
    til: "Сменить язык",
    yordam: "Помощь",
  },
  description:
    "Бот онлайн-записи: смотрите и отменяйте свои записи, получайте напоминания перед визитом.",
  shortDescription: "Онлайн-запись и напоминания",
};
