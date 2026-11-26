import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "almas_admin_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname === "/editor" || pathname.startsWith("/editor/") ||\n    pathname === "/compact" || pathname.startsWith("/compact/");

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  const validSession = process.env.ADMIN_PANEL_SESSION;

  if (!validSession || sessionCookie !== validSession) {
    const loginUrl = new URL("/secret-entry", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/editor/:path*", "/compact/:path*"],
};