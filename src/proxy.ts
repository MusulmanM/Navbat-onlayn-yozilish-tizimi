// Runs before every page: locale routing (next-intl) + login protection (spec 10).
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/config/site";
import { verifySession } from "@/lib/auth/jwt";
import { routing } from "@/i18n/routing";

const intl = createMiddleware(routing);

const PROTECTED = /^\/(?:ru\/)?(?:panel|onboarding|admin)(?:\/|$)/;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PROTECTED.test(pathname)) {
    const session = await verifySession(
      request.cookies.get(SESSION_COOKIE)?.value,
      process.env.SESSION_SECRET ?? "",
    );
    if (!session) {
      const prefix = pathname.startsWith("/ru/") || pathname === "/ru" ? "/ru" : "";
      const url = new URL(`${prefix}/login`, request.url);
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
  }

  // Uzbek is the main language: the browser's Accept-Language must not switch a visitor to
  // Russian automatically. The choice is only remembered via the locale cookie.
  const headers = new Headers(request.headers);
  headers.delete("accept-language");
  return intl(new NextRequest(request, { headers }));
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
