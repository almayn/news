import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =======================
// GET → جلب المناسبات
// =======================
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("year", { ascending: true })
      .order("month", { ascending: true })
      .order("day", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return NextResponse.json({ events: [] }, { status: 500 });
    }

    return NextResponse.json({ events: data || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}

// =======================
// POST → إضافة مناسبة
// =======================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { error } = await supabase.from("events").insert([body]);

    if (error) {
      console.error(error);
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// =======================
// PUT → تعديل مناسبة
// =======================
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const { id, ...rest } = body;

    const { error } = await supabase
      .from("events")
      .update(rest)
      .eq("id", id);

    if (error) {
      console.error(error);
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// =======================
// DELETE → حذف مناسبة
// =======================
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}