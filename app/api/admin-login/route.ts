import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "almas_admin_session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = String(body?.password || "");

    const panelPassword = process.env.ADMIN_PANEL_PASSWORD;
    const sessionValue = process.env.ADMIN_PANEL_SESSION;

    if (!panelPassword || !sessionValue) {
      return NextResponse.json(
        { success: false, message: "إعدادات لوحة التحكم غير مكتملة في ملف البيئة." },
        { status: 500 }
      );
    }

    if (password !== panelPassword) {
      return NextResponse.json(
        { success: false, message: "كلمة المرور غير صحيحة." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "تعذر تسجيل الدخول." },
      { status: 500 }
    );
  }
}