import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { cleanNewsBody, normalizeTitle } from "@/lib/collector-normalize";
import { extractTweetUrl } from "@/lib/collector-normalize";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawId = body?.id;
    const category = (body?.category || "").trim();

    const id = Number(rawId);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, error: "id غير صالح" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { ok: false, error: "اختر التصنيف أولًا" },
        { status: 400 }
      );
    }

    const { data: item, error: itemError } = await supabaseServer
      .from("collected_news")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (itemError) {
      return NextResponse.json(
        { ok: false, error: itemError.message },
        { status: 500 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { ok: false, error: `الخبر غير موجود في collected_news (id=${id})` },
        { status: 404 }
      );
    }

    const finalTitle = (item.title || "").trim();
    const finalDescription = (item.description || "").trim();

    const rawBody =
      (item.full_text || "").trim() ||
      finalDescription ||
      "";

    const finalBody = cleanNewsBody(rawBody, item.source_name || "");
    const tweetUrl = extractTweetUrl(
  item.full_text || item.description || item.title || ""
);

    const finalImage =
      (item.image_hd || "").trim() ||
      (item.image_url || "").trim() ||
      "";

    const finalUrl = (item.url || "").trim();
    const finalNormalizedTitle = normalizeTitle(
      item.normalized_title || finalTitle
    );

    if (!finalTitle) {
      return NextResponse.json(
        { ok: false, error: "عنوان الخبر فارغ" },
        { status: 400 }
      );
    }

    if (!finalBody) {
      return NextResponse.json(
        { ok: false, error: "نص الخبر فارغ بعد التنظيف" },
        { status: 400 }
      );
    }

    if (finalUrl) {
      const { data: duplicateByUrl, error: duplicateUrlError } =
        await supabaseServer
          .from("news_posts")
          .select("id")
          .eq("source_url", finalUrl)
          .maybeSingle();

      if (duplicateUrlError) {
        return NextResponse.json(
          { ok: false, error: duplicateUrlError.message },
          { status: 500 }
        );
      }

      if (duplicateByUrl) {
        const { error: deleteCollectedError } = await supabaseServer
          .from("collected_news")
          .delete()
          .eq("id", id);

        if (deleteCollectedError) {
          return NextResponse.json(
            {
              ok: false,
              error: deleteCollectedError.message,
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          ok: false,
          duplicate: true,
          message: "هذا الخبر منشور سابقًا بنفس الرابط وتمت إزالته من الجامع",
          postId: duplicateByUrl.id,
        });
      }
    }

    if (finalNormalizedTitle) {
      const { data: duplicateByTitle, error: duplicateTitleError } =
        await supabaseServer
          .from("news_posts")
          .select("id")
          .eq("normalized_title", finalNormalizedTitle)
          .maybeSingle();

      if (duplicateTitleError) {
        return NextResponse.json(
          { ok: false, error: duplicateTitleError.message },
          { status: 500 }
        );
      }

      if (duplicateByTitle) {
        const { error: deleteCollectedError } = await supabaseServer
          .from("collected_news")
          .delete()
          .eq("id", id);

        if (deleteCollectedError) {
          return NextResponse.json(
            {
              ok: false,
              error: deleteCollectedError.message,
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          ok: false,
          duplicate: true,
          message: "هذا الخبر منشور سابقًا بعنوان مطابق وتمت إزالته من الجامع",
          postId: duplicateByTitle.id,
        });
      }
    }

const insertPayload = {
  title: finalTitle,
  sub_title: "",
  body: finalBody,
  image_url: finalImage,
  category,
  source: item.source_name || "",
  source_url: finalUrl || null,
  tweet_url: tweetUrl || null, // 🔥 هذا السطر الجديد
  collector_news_id: item.id,
  original_title: item.original_title || finalTitle,
  normalized_title: finalNormalizedTitle || null,
};

    const { data: inserted, error: insertError } = await supabaseServer
      .from("news_posts")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        {
          ok: false,
          error: insertError?.message || "فشل إدخال الخبر في news_posts",
        },
        { status: 500 }
      );
    }

    const { error: deleteCollectedError } = await supabaseServer
      .from("collected_news")
      .delete()
      .eq("id", id);

    if (deleteCollectedError) {
      return NextResponse.json({
        ok: true,
        warning: deleteCollectedError.message,
        message: "تم النشر في news_posts لكن تعذر حذف الخبر من الجامع",
        postId: inserted.id,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "تم نشر الخبر بنجاح وحذفه من الجامع",
      postId: inserted.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "حدث خطأ غير معروف أثناء النشر",
      },
      { status: 500 }
    );
  }
}