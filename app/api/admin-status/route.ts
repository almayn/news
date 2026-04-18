import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "almas_admin_session";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  const validSession = process.env.ADMIN_PANEL_SESSION;

  const isAdmin = !!validSession && sessionCookie === validSession;

  return NextResponse.json({ isAdmin });
}