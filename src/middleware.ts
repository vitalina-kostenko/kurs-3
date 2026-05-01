import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/pkg/i18n/routing";
import { getSessionPayloadFromRequest } from "@/pkg/auth/session-from-request";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const i18nRes = intlMiddleware(req);

  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0] ?? "en";

  const localeRegex = new RegExp(`^\\/(${routing.locales.join("|")})`);
  const strippedPath = pathname.replace(localeRegex, "") || "/";

  const isSignIn = strippedPath === "/auth/sign-in";
  const isSignUp = strippedPath === "/auth/sign-up";
  const isAuthPage = isSignIn || isSignUp;

  const user = await getSessionPayloadFromRequest(req);

  if (!isAuthPage && !user) {
    return NextResponse.redirect(new URL(`/${locale}/auth/sign-in`, req.url));
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  return i18nRes;
}

export const config = {
  matcher: ["/", "/(de|en)/:path*"],
};
