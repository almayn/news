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
] as const;

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

const MAX_ITEMS_PER_SOURCE = 10;
const FEED_TIMEOUT_MS = 8000;
const ARTICLE_TIMEOUT_MS = 7000;

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

type ExistingState = {
  collectedUrls: Set<string>;
  publishedUrls: Set<string>;
  collectedTitles: string[];
  publishedTitles: string[];
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

function cleanUrl(value: string = ""): string {
  return value
    .trim()
    .replace(/^>/, "")
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "")
    .trim();
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

async function fetchXml(url: string, sourceName: string): Promise<string> {
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

    const res = await withTimeout(
      fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
      }),
      FEED_TIMEOUT_MS
    );

    if (res.ok) {
      const xml = await withTimeout(res.text(), FEED_TIMEOUT_MS);
      if (xml?.trim()) return xml;
    }

    if (
      sourceName !== "الرياض" &&
      sourceName !== "العربية" &&
      sourceName !== "الرياضية"
    ) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    // fallback to https.get below
  }

  return new Promise((resolve, reject) => {
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

    const req = https.get(
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
    );

    req.setTimeout(FEED_TIMEOUT_MS, () => {
      req.destroy(new Error(`Timeout after ${FEED_TIMEOUT_MS}ms`));
    });

    req.on("error", reject);
  });
}

async function loadExistingState(): Promise<ExistingState> {
  const [{ data: existingCollectedRows }, { data: existingPublishedRows }] =
    await Promise.all([
      supabaseServer.from("collected_news").select("url, normalized_title"),
      supabaseServer
        .from("news_posts")
        .select("source_url, normalized_title, title"),
    ]);

  return {
    collectedUrls: new Set(
      (existingCollectedRows || [])
        .map((row) => (row.url || "").trim())
        .filter(Boolean)
    ),
    publishedUrls: new Set(
      (existingPublishedRows || [])
        .map((row) => (row.source_url || "").trim())
        .filter(Boolean)
    ),
    collectedTitles: (existingCollectedRows || [])
      .map((row) => makeDedupeTitle(row.normalized_title || ""))
      .filter(Boolean),
    publishedTitles: (existingPublishedRows || [])
      .map((row) => makeDedupeTitle(row.normalized_title || row.title || ""))
      .filter(Boolean),
  };
}

function isDuplicateAgainstLists(
  rawUrl: string,
  normalizedTitle: string,
  existing: ExistingState,
  localUrls: Set<string>,
  localTitles: string[]
) {
  if (
    existing.collectedUrls.has(rawUrl) ||
    existing.publishedUrls.has(rawUrl) ||
    localUrls.has(rawUrl)
  ) {
    return true;
  }

  const dedupeTitle = makeDedupeTitle(normalizedTitle);
  if (!dedupeTitle) return false;

  const duplicateInCollected = existing.collectedTitles.some((title) =>
    isSimilarTitle(title, dedupeTitle)
  );

  if (duplicateInCollected) return true;

  const duplicateInPublished = existing.publishedTitles.some((title) =>
    isSimilarTitle(title, dedupeTitle)
  );

  if (duplicateInPublished) return true;

  const duplicateLocally = localTitles.some((title) =>
    isSimilarTitle(title, dedupeTitle)
  );

  return duplicateLocally;
}

async function fetchSource(
  source: FeedSource,
  existing: ExistingState
): Promise<{
  source: string;
  items: CollectedNewsRow[];
  error?: string;
}> {
  try {
    const xml = await fetchXml(source.url, source.name);
    const feed = await parser.parseString(xml);
    const collected: CollectedNewsRow[] = [];

    const localUrls = new Set<string>();
    const localTitles: string[] = [];

    const sourceItems = ((feed.items || []) as ParsedFeedItem[]).slice(
      0,
      MAX_ITEMS_PER_SOURCE
    );

    for (const rawItem of sourceItems) {
      try {
        const rawTitle = stripHtml(rawItem.title || "");
        const rawUrl = cleanUrl(rawItem.link || "");

        if (!rawTitle || !rawUrl || !/^https?:\/\//i.test(rawUrl)) continue;

        const rawDescription = stripHtml(
          rawItem.contentSnippet ||
            rawItem.description ||
            rawItem.contentEncoded ||
            ""
        );

        const feedImage = pickFeedImage(rawItem);

        const initialKeywordMatches = matchKeywords(
          `${rawTitle} ${rawDescription}`
        );

        if (initialKeywordMatches.length === 0) {
          continue;
        }

        let extractedTitle = cleanTitle(rawTitle, source.name);
        let extractedDescription = rawDescription;
        let extractedFullText = stripHtml(
          rawItem.contentEncoded || rawItem.description || ""
        );
        let extractedImageHd = feedImage;

        try {
          const details = await withTimeout(
            extractArticleDetails(rawUrl),
            ARTICLE_TIMEOUT_MS
          );

          if (details.title) {
            extractedTitle = cleanTitle(details.title, source.name);
          }
          if (details.description) extractedDescription = details.description;
          if (details.fullText) extractedFullText = details.fullText;
          if (details.image) extractedImageHd = details.image;
        } catch (pageError) {
          console.log(`⚠️ تعذر تحليل صفحة الخبر: ${source.name}`);
          console.error(pageError);
        }

        const combinedText =
          `${extractedTitle} ${extractedDescription} ${extractedFullText}`.trim();

        const matches = matchKeywords(combinedText);
        if (matches.length === 0) continue;

        const normalized = normalizeTitle(extractedTitle);

        const isDuplicate = isDuplicateAgainstLists(
          rawUrl,
          normalized,
          existing,
          localUrls,
          localTitles
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

        localUrls.add(rawUrl);

        const dedupeTitle = makeDedupeTitle(normalized);
        if (dedupeTitle) {
          localTitles.push(dedupeTitle);
        }
      } catch (itemError) {
        console.log(`⚠️ خطأ في عنصر من ${source.name}`);
        console.error(itemError);
      }
    }

    return {
      source: source.name,
      items: collected,
    };
  } catch (error) {
    console.log(`❌ فشل المصدر ${source.name}`);
    console.error(error);

    return {
      source: source.name,
      items: [],
      error: error instanceof Error ? error.message : "فشل غير معروف",
    };
  }
}

function dedupeCollectedItems(items: CollectedNewsRow[]) {
  const uniqueByUrl = new Map<string, CollectedNewsRow>();

  for (const item of items) {
    if (!uniqueByUrl.has(item.url)) {
      uniqueByUrl.set(item.url, item);
    }
  }

  const dedupedByTitle: CollectedNewsRow[] = [];
  const seenTitles: string[] = [];

  for (const item of uniqueByUrl.values()) {
    const dedupeTitle = makeDedupeTitle(item.normalized_title || item.title || "");

    if (!dedupeTitle) {
      dedupedByTitle.push(item);
      continue;
    }

    const exists = seenTitles.some((title) => isSimilarTitle(title, dedupeTitle));
    if (exists) continue;

    seenTitles.push(dedupeTitle);
    dedupedByTitle.push(item);
  }

  return dedupedByTitle;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sourceKey =
      typeof body?.source === "string" && body.source.trim()
        ? body.source.trim()
        : "all";

    const selectedSources =
      sourceKey === "all"
        ? [...SOURCES]
        : SOURCES.filter((source) => source.name === sourceKey);

    if (selectedSources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "المصدر المطلوب غير موجود",
        },
        { status: 400 }
      );
    }

    const existing = await loadExistingState();

    const settled = await Promise.allSettled(
      selectedSources.map((source) => fetchSource(source, existing))
    );

    const failed: Array<{ source: string; error: string }> = [];
    const collected: CollectedNewsRow[] = [];

    for (const result of settled) {
      if (result.status === "fulfilled") {
        collected.push(...result.value.items);

        if (result.value.error) {
          failed.push({
            source: result.value.source,
            error: result.value.error,
          });
        }
      } else {
        failed.push({
          source: "unknown",
          error:
            result.reason instanceof Error
              ? result.reason.message
              : "فشل غير معروف",
        });
      }
    }

    const uniqueCollected = dedupeCollectedItems(collected);

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
            failed,
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
          failed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      source: sourceKey,
      inserted_now: uniqueCollected.length,
      count: rows?.length || 0,
      failed,
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