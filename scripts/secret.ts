// Prints a random 64-character secret for SESSION_SECRET, CRON_SECRET and TELEGRAM_WEBHOOK_SECRET.
// base64url uses only A-Z a-z 0-9 _ - which Telegram accepts for the webhook secret token.
import { randomBytes } from "node:crypto";

console.log(randomBytes(48).toString("base64url"));
