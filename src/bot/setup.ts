// Bot commands and descriptions in both languages (spec 8.3).
import type { Api } from "grammy";
import { ru } from "@/bot/texts/ru";
import { uz } from "@/bot/texts/uz";

const COMMANDS = ["start", "yozilishlarim", "bugun", "til", "yordam"] as const;

export async function configureBotProfile(api: Api): Promise<void> {
  await api.setMyCommands(
    COMMANDS.map((command) => ({ command, description: uz.commands[command] })),
  );
  await api.setMyCommands(
    COMMANDS.map((command) => ({ command, description: ru.commands[command] })),
    { language_code: "ru" },
  );
  await api.setMyDescription(uz.description);
  await api.setMyDescription(ru.description, { language_code: "ru" });
  await api.setMyShortDescription(uz.shortDescription);
  await api.setMyShortDescription(ru.shortDescription, { language_code: "ru" });
}
