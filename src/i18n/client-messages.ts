// Only the namespaces a client component needs are sent to the browser (keeps pages light).
import type { AbstractIntlMessages } from "next-intl";
import { getMessages } from "next-intl/server";

export async function pickMessages(namespaces: string[]): Promise<AbstractIntlMessages> {
  const all = await getMessages();
  return Object.fromEntries(namespaces.filter((ns) => ns in all).map((ns) => [ns, all[ns]]));
}
