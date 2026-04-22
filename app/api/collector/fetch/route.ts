import { NextResponse } from "next/server";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import https from "https";
import { supabaseServer } from "@/lib/supabase-server";
import { extractArticleDetails } from "@/lib/collector-extract";
import {
  normalizeTitle,
  stripHtml,
  makeDedupeTitle,
  isSimilarTitle,
  cleanTitle,
} from "@/lib/collector-normalize";

export const dynamic = "force-dynamic";

const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
      ["description", "description"],
      ["guid", "guid"],
    ],
  },
});

const SOURCES = [
  {
    name: "عكاظ",
    url: "https://www.okaz.com.sa/rssFeed/1",
  },
  {
    name: "المدينة",
    url: "https://www.al-madina.com/rssFeed/1",
  },
  {
     name: "سبق",
    url: "https://sabq.org/api/rss/articles",
   },
  {
    name: "العربية",
    url: "https://www.alarabiya.net/feed/rss2/ar/saudi-today.xml",
  },
  {
    name: "الرياضية",
    url: "https://arriyadiyah.com/rss",
  },
  {
    name: "سبورت 24",
    url: "https://www.akhbaar24.com/rssFeed/18",
  },
  {
    name: "اخبار24",
    url: "https://www.akhbaar24.com/rssFeed/15",
  },
];

const KEYWORDS = [
  "ينبع",
  "المدينة المنورة",
  "الهيئة الملكية بينبع",
  "محافظة ينبع",
  "الهيئة الملكية",
  "ينبع الصناعية",
  "ينبع البحر",
  "السعودية",
  "محليات",
  "محلي",
  "المدينة",
  "مكة",
  "الرياض",
  "جدة",
];

type FeedSource = {
  name: string;
  url: string;
};

type ParsedFeedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  description?: string;
  contentEncoded?: string;
  enclosure?: { url?: string };
  mediaContent?: Array<{ $?: { url?: string }; url?: string }>;
  mediaThumbnail?: Array<{ $?: { url?: string }; url?: string }>;
  guid?: string;
  id?: string;
};

type CollectedNewsRow = {
  source_name: string;
  title: string;
  original_title: string;
  normalized_title: string;
  url: string;
  description: string;
  full_text: string;
  image_url: string;
  image_hd: string;
  published_at: string | null;
  matched_keywords: string[];
  status: string;
  source_article_id: string;
};

function extractImageFromHtml(html: string = ""): string {
  if (!html) return "";
  const $ = cheerio.load(html);
  return (
    $("img").first().attr("src") ||
    $("img").first().attr("data-src") ||
    $("img").first().attr("data-lazy-src") ||
    ""
  );
}

function matchKeywords(text: string) {
  const normalized = text.toLowerCase();
  return KEYWORDS.filter((keyword) =>
    normalized.includes(keyword.toLowerCase())
  );
}

function toIsoDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function pickFeedImage(item: ParsedFeedItem): string {
  const enclosureImage = item.enclosure?.url || "";

  const mediaContentImage = Array.isArray(item.mediaContent)
    ? item.mediaContent?.[0]?.$?.url || item.mediaContent?.[0]?.url || ""
    : "";

  const mediaThumbImage = Array.isArray(item.mediaThumbnail)
    ? item.mediaThumbnail?.[0]?.$?.url || item.mediaThumbnail?.[0]?.url || ""
    : "";

  const htmlImage =
    extractImageFromHtml(item.contentEncoded || "") ||
    extractImageFromHtml(item.description || "");

  return enclosureImage || mediaContentImage || mediaThumbImage || htmlImage || "";
}

function fetchXml(url: string, sourceName: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const headers: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "Accept-Language": "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7",
      };

      if (sourceName === "العربية") {
        headers.Referer = "https://www.alarabiya.net/";
        headers.Origin = "https://www.alarabiya.net";
      }

      if (sourceName === "الرياض") {
        headers.Referer = "https://www.alriyadh.com/";
      }

      if (sourceName === "الرياضية") {
        headers.Referer = "https://arriyadiyah.com/";
      }

      const res = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (res.ok) {
        const xml = await res.text();
        return resolve(xml);
      }

      if (
        sourceName !== "الرياض" &&
        sourceName !== "العربية" &&
        sourceName !== "الرياضية"
      ) {
        return reject(new Error(`HTTP ${res.status}`));
      }
    } catch {
      // fallback
    }

    try {
      const agent = new https.Agent({
        rejectUnauthorized: sourceName === "الرياض" ? false : true,
      });

      const fallbackHeaders: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "Accept-Language": "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7",
      };

      if (sourceName === "العربية") {
        fallbackHeaders.Referer = "https://www.alarabiya.net/";
      }

      if (sourceName === "الرياض") {
        fallbackHeaders.Referer = "https://www.alriyadh.com/";
      }

      if (sourceName === "الرياضية") {
        fallbackHeaders.Referer = "https://arriyadiyah.com/";
      }

      https
        .get(
          url,
          {
            agent,
            headers: fallbackHeaders,
          },
          (res) => {
            if (!res.statusCode || res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}`));
              return;
            }

            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });

            res.on("end", () => {
              resolve(data);
            });
          }
        )
        .on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

function cleanUrl(value: string = ""): string {
  return value
    .trim()
    .replace(/^>/, "")
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "")
    .trim();
}

async function alreadyPublished(url: string, normalizedTitle: string) {
  if (url) {
    const { data: byUrl } = await supabaseServer
      .from("news_posts")
      .select("id")
      .eq("source_url", url)
      .maybeSingle();

    if (byUrl) return true;
  }

  if (normalizedTitle) {
    const { data: byTitle } = await supabaseServer
      .from("news_posts")
      .select("id")
      .eq("normalized_title", normalizedTitle)
      .maybeSingle();

    if (byTitle) return true;
  }

  return false;
}

function isDuplicateAgainstLists(
  rawUrl: string,
  normalizedTitle: string,
  existingUrls: Set<string>,
  existingCollectedTitles: string[],
  existingPublishedTitles: string[]
) {
  if (existingUrls.has(rawUrl)) {
    return true;
  }

  const dedupeTitle = makeDedupeTitle(normalizedTitle);

  if (!dedupeTitle) return false;

  const duplicateInCollected = existingCollectedTitles.some((title) =>
    isSimilarTitle(title, dedupeTitle)
  );

  if (duplicateInCollected) {
    return true;
  }

  const duplicateInPublished = existingPublishedTitles.some((title) =>
    isSimilarTitle(title, dedupeTitle)
  );

  if (duplicateInPublished) {
    return true;
  }

  return false;
}

async function fetchSource(source: FeedSource): Promise<CollectedNewsRow[]> {
  try {
    const xml = await fetchXml(source.url, source.name);
    const feed = await parser.parseString(xml);
    const collected: CollectedNewsRow[] = [];

    const { data: existingCollectedRows } = await supabaseServer
      .from("collected_news")
      .select("url, normalized_title");

    const { data: existingPublishedRows } = await supabaseServer
      .from("news_posts")
      .select("source_url, normalized_title, title");

    const existingUrls = new Set(
      (existingCollectedRows || [])
        .map((row) => (row.url || "").trim())
        .filter(Boolean)
    );

    const existingCollectedTitles = (existingCollectedRows || [])
      .map((row) => makeDedupeTitle(row.normalized_title || ""))
      .filter(Boolean);

    const existingPublishedTitles = (existingPublishedRows || [])
      .map((row) =>
        makeDedupeTitle(row.normalized_title || row.title || "")
      )
      .filter(Boolean);

    for (const rawItem of (feed.items || []) as ParsedFeedItem[]) {
      try {
        const rawTitle = stripHtml(rawItem.title || "");
        const rawUrl = cleanUrl(rawItem.link || "");

        if (!rawTitle || !rawUrl) continue;

        const rawDescription = stripHtml(
          rawItem.contentSnippet ||
            rawItem.description ||
            rawItem.contentEncoded ||
            ""
        );

        const feedImage = pickFeedImage(rawItem);

        let extractedTitle = cleanTitle(rawTitle, source.name);
        let extractedDescription = rawDescription;
        let extractedFullText = stripHtml(
          rawItem.contentEncoded || rawItem.description || ""
        );
        let extractedImageHd = feedImage;

        try {
          if (/^https?:\/\//i.test(rawUrl)) {
            const details = await extractArticleDetails(rawUrl);

            if (details.title) {
  extractedTitle = cleanTitle(details.title, source.name);
}
            if (details.description) extractedDescription = details.description;
            if (details.fullText) extractedFullText = details.fullText;
            if (details.image) extractedImageHd = details.image;
          }
        } catch (pageError) {
          console.log(`⚠️ تعذر تحليل صفحة الخبر: ${source.name}`);
          console.error(pageError);
        }

        const combinedText =
          `${extractedTitle} ${extractedDescription} ${extractedFullText}`.trim();

        const matches = matchKeywords(combinedText);
        if (matches.length === 0) continue;

        const normalized = normalizeTitle(extractedTitle);

        const isPublished = await alreadyPublished(rawUrl, normalized);
        if (isPublished) continue;

        const isDuplicate = isDuplicateAgainstLists(
          rawUrl,
          normalized,
          existingUrls,
          existingCollectedTitles,
          existingPublishedTitles
        );

        if (isDuplicate) continue;

        collected.push({
          source_name: source.name,
          title: extractedTitle,
          original_title: rawTitle,
          normalized_title: normalized,
          url: rawUrl,
          description: extractedDescription || "",
          full_text: extractedFullText || "",
          image_url: feedImage || "",
          image_hd: extractedImageHd || "",
          published_at: toIsoDate(rawItem.pubDate),
          matched_keywords: matches,
          status: "new",
          source_article_id: rawItem.guid || rawItem.id || rawUrl,
        });

        existingUrls.add(rawUrl);

        const dedupeTitle = makeDedupeTitle(normalized);
        if (dedupeTitle) {
          existingCollectedTitles.push(dedupeTitle);
        }
      } catch (itemError) {
        console.log(`⚠️ خطأ في عنصر من ${source.name}`);
        console.error(itemError);
      }
    }

    return collected;
  } catch (error) {
    console.log(`❌ فشل المصدر ${source.name}`);
    console.error(error);
    return [];
  }
}

export async function POST() {
  try {
    const allResults = await Promise.all(SOURCES.map(fetchSource));
    const collected = allResults.flat();

    const uniqueMap = new Map<string, CollectedNewsRow>();
    for (const item of collected) {
      if (!uniqueMap.has(item.url)) {
        uniqueMap.set(item.url, item);
      }
    }

    const uniqueCollected = Array.from(uniqueMap.values());

    if (uniqueCollected.length > 0) {
      const { error: upsertError } = await supabaseServer
        .from("collected_news")
        .upsert(uniqueCollected, {
          onConflict: "url",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        return NextResponse.json(
          {
            success: false,
            error: upsertError.message,
          },
          { status: 500 }
        );
      }
    }

    const { data: rows, error: selectError } = await supabaseServer
      .from("collected_news")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (selectError) {
      return NextResponse.json(
        {
          success: false,
          error: selectError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted_now: uniqueCollected.length,
      count: rows?.length || 0,
      data: rows || [],
    });
  } catch (error) {
    console.error("COLLECTOR FETCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "فشل في جلب الأخبار",
      },
      { status: 500 }
    );
  }
}