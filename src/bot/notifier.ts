// Telegram implementation of the Notifier interface (spec 3, 8.6).
import {
  cardData,
  chatLocale,
  clientBookingText,
  loadBookingForMessages,
  ownerData,
  ownerRecipients,
  serviceNameFor,
  whenFor,
} from "@/bot/booking-messages";
import { clientBookingKeyboard, ownerBookingKeyboard, rebookKeyboard } from "@/bot/keyboards";
import { sendMessage, sendToMany } from "@/bot/send";
import { botTexts } from "@/bot/texts";
import type { Locale } from "@/config/locales";
import type { Notifier } from "@/lib/notify";
import { adminTelegramIds } from "@/lib/env";
import { formatPhone } from "@/lib/phone";

export const telegramNotifier: Notifier = {
  async bookingCreated(bookingId) {
    const b = await loadBookingForMessages(bookingId);
    if (!b) return;
    if (b.client.telegramId !== null) {
      const locale = await chatLocale(b.client.telegramId);
      await sendMessage(
        b.client.telegramId,
        clientBookingText(b, locale),
        clientBookingKeyboard(botTexts(locale), b.id, b.manageToken),
      );
    }
    if (b.source === "PANEL") return; // the owner created it themselves
    for (const owner of await ownerRecipients(b.businessId)) {
      const t = botTexts(owner.locale);
      await sendMessage(
        owner.chatId,
        t.ownerNewBooking(ownerData(b, owner.locale)),
        ownerBookingKeyboard(t, b.id, b.status === "PENDING"),
      );
    }
  },

  async bookingConfirmed(bookingId) {
    const b = await loadBookingForMessages(bookingId);
    if (!b || b.client.telegramId === null) return;
    const locale = await chatLocale(b.client.telegramId);
    const t = botTexts(locale);
    const { date, time } = whenFor(b, locale);
    await sendMessage(
      b.client.telegramId,
      t.businessConfirmed({
        business: b.business.name,
        date,
        time,
        service: serviceNameFor(b, locale),
        staff: b.staff.name,
      }),
      clientBookingKeyboard(t, b.id, b.manageToken),
    );
  },

  async bookingCancelled(bookingId, by) {
    const b = await loadBookingForMessages(bookingId);
    if (!b) return;
    if (by === "client") {
      for (const owner of await ownerRecipients(b.businessId)) {
        const t = botTexts(owner.locale);
        const data = ownerData(b, owner.locale);
        await sendMessage(
          owner.chatId,
          t.ownerClientCancelled({
            client: data.client,
            clientPhone: data.clientPhone,
            service: data.service,
            staff: data.staff,
            date: data.date,
            time: data.time,
          }),
        );
      }
      return;
    }
    if (b.client.telegramId === null || b.cancelReason === "AUTO_EXPIRED") return;
    const locale = await chatLocale(b.client.telegramId);
    const t = botTexts(locale);
    const { date, time } = whenFor(b, locale);
    await sendMessage(
      b.client.telegramId,
      t.cancelledByBusiness({ business: b.business.name, date, time, reason: b.cancelReason }),
      rebookKeyboard(t, b.business.slug),
    );
  },

  async bookingRescheduled(bookingId) {
    const b = await loadBookingForMessages(bookingId);
    if (!b || b.client.telegramId === null) return;
    const locale = await chatLocale(b.client.telegramId);
    const t = botTexts(locale);
    const data = cardData(b, locale);
    await sendMessage(
      b.client.telegramId,
      t.rescheduled({
        business: data.business,
        date: data.date,
        time: data.time,
        staffLabel: data.staffLabel,
        staff: data.staff,
        phone: formatPhone(b.business.phone),
      }),
      clientBookingKeyboard(t, b.id, b.manageToken),
    );
  },
};

/** Messages to platform admins (spec 8.6), always in Uzbek. */
export async function notifyAdmins(render: (locale: Locale) => string): Promise<void> {
  const ids = adminTelegramIds();
  if (ids.length === 0 || !process.env.TELEGRAM_BOT_TOKEN) return;
  await sendToMany(ids, render("uz"));
}
