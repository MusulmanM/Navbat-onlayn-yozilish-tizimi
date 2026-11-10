// All notifications go through this interface (spec 3). Without a bot token the log version
// is used; with TELEGRAM_BOT_TOKEN the Telegram version sends real messages.
import { after } from "next/server";

export interface Notifier {
  /** Client confirmation + message to the owners. */
  bookingCreated(bookingId: string): Promise<void>;
  /** PENDING → CONFIRMED: message to the client. */
  bookingConfirmed(bookingId: string): Promise<void>;
  bookingCancelled(bookingId: string, by: "client" | "business"): Promise<void>;
  bookingRescheduled(bookingId: string): Promise<void>;
}

export const logNotifier: Notifier = {
  async bookingCreated(id) {
    console.info(`[notify] bookingCreated ${id}`);
  },
  async bookingConfirmed(id) {
    console.info(`[notify] bookingConfirmed ${id}`);
  },
  async bookingCancelled(id, by) {
    console.info(`[notify] bookingCancelled ${id} by ${by}`);
  },
  async bookingRescheduled(id) {
    console.info(`[notify] bookingRescheduled ${id}`);
  },
};

/** Telegram version when a bot token is configured, otherwise the log version. */
export async function getNotifier(): Promise<Notifier> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return logNotifier;
  const { telegramNotifier } = await import("@/bot/notifier");
  return telegramNotifier;
}

/**
 * Runs work after the response is sent (Next.js `after`). Outside a request (bot polling,
 * scripts) it simply runs in the background. Errors are logged and never break the caller.
 */
export function runInBackground(task: () => Promise<void>): void {
  const safe = async () => {
    try {
      await task();
    } catch (error) {
      console.error("[background] task failed", error);
    }
  };
  try {
    after(safe);
  } catch {
    void safe();
  }
}

/** Shortcut: notify in the background. */
export function notifyLater(send: (notifier: Notifier) => Promise<void>): void {
  runInBackground(async () => send(await getNotifier()));
}
