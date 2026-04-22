import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

function sanitizeText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export async function GET(request: NextRequest) {
  try {
    const articleId = request.nextUrl.searchParams.get("article_id");
    const adminView = request.nextUrl.searchParams.get("admin") === "1";

    let query = supabaseServer
     .from("comments")
.select(`
  *,
  news_posts!comments_article_id_fkey (
    id,
    title
  )
`)
      .order("created_at", { ascending: false });

    if (articleId) {
      query = query.eq("article_id", Number(articleId));
    }

    if (!adminView) {
      query = query.eq("status", "approved");
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments: data || [] });
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const articleId = Number(body?.article_id);
    const authorName = sanitizeText(body?.author_name);
    const commentBody = sanitizeText(body?.body);

    if (!articleId || Number.isNaN(articleId)) {
      return NextResponse.json(
        { error: "article_id is required" },
        { status: 400 }
      );
    }

    if (!authorName || authorName.length < 2) {
      return NextResponse.json(
        { error: "الاسم يجب أن يكون حرفين على الأقل" },
        { status: 400 }
      );
    }

    if (!commentBody || commentBody.length < 3) {
      return NextResponse.json(
        { error: "نص التعليق قصير جدًا" },
        { status: 400 }
      );
    }

    if (authorName.length > 40) {
      return NextResponse.json(
        { error: "الاسم طويل جدًا" },
        { status: 400 }
      );
    }

    if (commentBody.length > 1000) {
      return NextResponse.json(
        { error: "التعليق طويل جدًا" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer.from("comments").insert([
      {
        article_id: articleId,
        author_name: authorName,
        body: commentBody,
        status: "pending",
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "تم إرسال تعليقك وسيظهر بعد المراجعة",
    });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Number(body?.id);
    const status = sanitizeText(body?.status);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("comments")
      .update({ status })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/comments error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = Number(request.nextUrl.searchParams.get("id"));

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabaseServer.from("comments").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/comments error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}