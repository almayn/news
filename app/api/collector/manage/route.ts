import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractTweetUrl } from "@/lib/collector-normalize";
export const dynamic = "force-dynamic";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("supabaseUrl is required.");
}

if (!supabaseKey) {
  throw new Error("supabaseKey is required.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

function extractOgImage(html: string) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function htmlToPlainText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+/g, " ")
    .trim();
}

export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("collected_news")
      .update({ status })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشل في تحديث الحالة" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data: item, error: fetchError } = await supabase
      .from("collected_news")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: fetchError?.message || "الخبر غير موجود" },
        { status: 404 }
      );
    }

    let imageUrl = "";

    try {
      const pageRes = await fetch(item.url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        imageUrl = extractOgImage(html) || "";
      }
    } catch (error) {
      console.log("تعذر جلب صورة الخبر من المصدر");
    }

    const bodyText = htmlToPlainText(item.description || "") || item.title;
    const tweetUrl = extractTweetUrl(bodyText);

    const { data: inserted, error: insertError } = await supabase
      .from("news_posts")
      .insert([
        {
          title: item.title,
          sub_title: item.source_name ? `من ${item.source_name}` : null,
          body: bodyText,
          image_url: imageUrl || null,
          category: "عام",
          tweet_url: tweetUrl,
          source: item.source_name || "جامع الأخبار",
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("collected_news")
      .update({ status: "published" })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      insertedId: inserted?.id || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشل في النشر" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    const deleteAll = body?.deleteAll === true;
    if (deleteAll) {
      const { error } = await supabase
        .from("collected_news")
        .delete()
        .not("id", "is", null);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, deletedAll: true });
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("collected_news")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشل في الحذف" },
      { status: 500 }
    );
  }
}