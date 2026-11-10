import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

// Locale-aware Link, redirect and router: <Link href="/panel"> becomes /ru/panel in Russian.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
