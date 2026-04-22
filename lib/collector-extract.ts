import * as cheerio from "cheerio";
import https from "https";
import http from "http";
import { stripHtml } from "./collector-normalize";

function sanitizeArticleUrl(url: string = ""): string {
  return url
    .trim()
    .replace(/^>/, "")
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "")
    .trim();
}

function absolutizeUrl(url: string | undefined | null, baseUrl: string) {
  if (!url) return "";
  try {
    if (url.startsWith("//")) {
      url = "https:" + url;
    }
    return new URL(url, baseUrl).toString();
  } catch {
    return "";
  }
}

function firstFromSrcset(srcset: string | undefined | null) {
  if (!srcset) return "";
  return (
    srcset
      .split(",")
      .map((part) => part.trim().split(/\s+/)[0])
      .find(Boolean) || ""
  );
}

function scoreImage(url: string) {
  let s = 0;
  const value = (url || "").toLowerCase();

  if (!value) return -100;

  if (
    value.includes("logo") ||
    value.includes("icon") ||
    value.includes("avatar") ||
    value.includes("sprite") ||
    value.includes("placeholder") ||
    value.includes("banner")
  ) {
    s -= 50;
  }

  if (value.includes("news-cover")) s += 20;
  if (value.includes("media/original")) s += 20;

  if (/1200|1280|1600|1920|2048/.test(value)) s += 8;
  if (/800|900|1024/.test(value)) s += 5;
  if (/large|original|full|master/.test(value)) s += 6;

  // لا نعاقب thumb في الرياضية
  if (value.includes("arriyadiyah.com") && value.includes("thumb")) {
    s += 5;
  } else if (/thumb|thumbnail|150x|100x|75x/.test(value)) {
    s -= 10;
  }

  return s;
}

function pickBestImage(images: string[]) {
  const cleaned = images
    .map((u) => (u || "").trim())
    .filter(Boolean)
    .filter((u, i, arr) => arr.indexOf(u) === i);

  if (!cleaned.length) return "";

  cleaned.sort((a, b) => scoreImage(b) - scoreImage(a));
  return cleaned[0];
}

function extractJsonLdImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const images: string[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() || "";
      if (!raw.trim()) return;

      const parsed = JSON.parse(raw);

      const pushImage = (value: any) => {
        if (!value) return;

        if (typeof value === "string") {
          const abs = absolutizeUrl(value, baseUrl);
          if (abs) images.push(abs);
          return;
        }

        if (Array.isArray(value)) {
          value.forEach(pushImage);
          return;
        }

        if (typeof value === "object") {
          if (value.url) pushImage(value.url);
          if (value.contentUrl) pushImage(value.contentUrl);
          if (value.image) pushImage(value.image);
        }
      };

      const walk = (node: any) => {
        if (!node) return;

        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }

        if (typeof node !== "object") return;

        if (node.image) pushImage(node.image);

        if (node["@graph"] && Array.isArray(node["@graph"])) {
          node["@graph"].forEach(walk);
        }
      };

      walk(parsed);
    } catch {
      // تجاهل
    }
  });

  return images.filter(Boolean);
}

function collectParagraphs($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const parts = $(selector)
      .map((_, el) => stripHtml($(el).text()))
      .get()
      .map((t) => t.trim())
      .filter((t) => t.length > 35);

    if (parts.length >= 3) {
      return parts.join("\n\n").trim();
    }
  }

  return "";
}

function extractTextBlocks($: cheerio.CheerioAPI, safeUrl: string) {
  const isMadinah =
    safeUrl.includes("al-madina.com") || safeUrl.includes("al-madina");
  const isRiyadh =
    safeUrl.includes("alriyadh.com") || safeUrl.includes("www.alriyadh.com");
  const isRiyadiyah = safeUrl.includes("arriyadiyah.com");

  const sourceSpecificSelectors: string[] = [];

  if (isMadinah) {
    sourceSpecificSelectors.push(
      ".article-body p",
      ".articleBody p",
      ".news-details p",
      ".news-content p",
      ".entry-content p",
      ".post-content p",
      ".article-content p",
      "[itemprop='articleBody'] p",
      ".td-post-content p",
      ".single-post-content p",
      ".story-content p",
      ".field-name-body p",
      ".node__content p"
    );
  }

  if (isRiyadh) {
    sourceSpecificSelectors.push(
      ".article-body p",
      ".articleBody p",
      ".news-content p",
      ".entry-content p",
      ".post-content p",
      ".article-content p",
      "[itemprop='articleBody'] p",
      ".td-post-content p",
      ".single-post-content p",
      ".story-content p",
      ".field-name-body p",
      ".node__content p",
      ".imgcontent p",
      "#article-body p",
      "#articleBody p"
    );
  }

  if (isRiyadiyah) {
    sourceSpecificSelectors.push(
      ".article-body p",
      ".articleBody p",
      ".news-content p",
      ".article-content p",
      "[itemprop='articleBody'] p",
      "article p",
      "main p"
    );
  }

  const generalSelectors = [
    "article p",
    "main article p",
    "main p",
    ".article-body p",
    ".articleBody p",
    ".entry-content p",
    ".post-content p",
    ".article-content p",
    ".single-content p",
    "[itemprop='articleBody'] p",
    ".content p",
    ".td-post-content p",
    ".single-post-content p",
    ".story-content p",
    ".field-name-body p",
    ".node__content p",
  ];

  const sourceSpecific = collectParagraphs($, sourceSpecificSelectors);
  if (sourceSpecific) return sourceSpecific;

  const general = collectParagraphs($, generalSelectors);
  if (general) return general;

  const biggestContainerSelectors = [
    ".article-body",
    ".articleBody",
    ".news-content",
    ".entry-content",
    ".post-content",
    ".article-content",
    "[itemprop='articleBody']",
    ".td-post-content",
    ".single-post-content",
    ".story-content",
    ".field-name-body",
    ".node__content",
    "article",
    "main",
  ];

  for (const selector of biggestContainerSelectors) {
    const node = $(selector).first();
    if (!node.length) continue;

    const raw = stripHtml(node.text());
    const cleaned = raw
      .split(/(?<=\.)\s+|(?<=؟)\s+|(?<=!)\s+|\n+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 35)
      .join("\n\n")
      .trim();

    if (cleaned.length > 250) {
      return cleaned;
    }
  }

  return "";
}

async function fetchHtmlWithFallback(url: string): Promise<string> {
  const safeUrl = sanitizeArticleUrl(url);

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
  };

  if (safeUrl.includes("arriyadiyah.com")) {
    headers.Referer = "https://arriyadiyah.com/";
  } else if (safeUrl.includes("alriyadh.com")) {
    headers.Referer = "https://www.alriyadh.com/";
  }

  try {
    const res = await fetch(safeUrl, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  } catch (error: any) {
    const isRiyadh = safeUrl.includes("alriyadh.com");
    const isCertError =
      error?.cause?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
      error?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE";

    const shouldFallback = isRiyadh || safeUrl.includes("arriyadiyah.com");

    if (!shouldFallback && !isCertError) {
      throw error;
    }

    return await new Promise<string>((resolve, reject) => {
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      const client = safeUrl.startsWith("http://") ? http : https;

      client
        .get(
          safeUrl,
          {
            agent: safeUrl.startsWith("https://") ? agent : undefined,
            headers,
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
    });
  }
}

function extractImageCandidates($: cheerio.CheerioAPI, safeUrl: string) {
  const candidates: string[] = [];

  const push = (value?: string | null) => {
    const abs = absolutizeUrl(value, safeUrl);
    if (abs) candidates.push(abs);
  };

  // 1) JSON-LD
  extractJsonLdImages($, safeUrl).forEach((img) => push(img));

  // 2) Meta tags
  push($("meta[property='og:image']").attr("content"));
  push($("meta[name='twitter:image']").attr("content"));
  push($("meta[property='og:image:url']").attr("content"));
  push($("meta[name='twitter:image:src']").attr("content"));
  push($("[itemprop='image']").attr("content"));
  push($("link[rel='image_src']").attr("href"));

  // 3) picture/source + srcset
  $("picture source").each((_, el) => {
    push(firstFromSrcset($(el).attr("srcset")));
  });

  $(
    ".article-image source, .main-image source, .news-img source, .img-holder source"
  ).each((_, el) => {
    push(firstFromSrcset($(el).attr("srcset")));
  });

  // 4) Selectors خاصة
  push($(".article-image img").first().attr("src"));
  push(firstFromSrcset($(".article-image source").first().attr("srcset")));
  push($(".main-image img").first().attr("src"));
  push(firstFromSrcset($(".main-image source").first().attr("srcset")));
  push($(".news-img img").first().attr("src"));
  push(firstFromSrcset($(".news-img source").first().attr("srcset")));
  push($(".img-holder img").first().attr("src"));
  push(firstFromSrcset($(".img-holder source").first().attr("srcset")));
  push($(".article img").first().attr("src"));

  // الرياضية
  push($("img.news-cover-img").first().attr("src"));
  push(firstFromSrcset($("img.news-cover-img").first().attr("srcset")));
  push($(".img-fluid.news-cover-img").first().attr("src"));
  push(firstFromSrcset($(".img-fluid.news-cover-img").first().attr("srcset")));

  // 5) fallback عام
  $("img").each((_, el) => {
    const node = $(el);
    push(node.attr("data-src"));
    push(firstFromSrcset(node.attr("data-srcset")));
    push(firstFromSrcset(node.attr("srcset")));
    push(node.attr("src"));
    push(node.attr("data-lazy-src"));
    push(node.attr("data-original"));
  });

  return candidates;
}

export async function extractArticleDetails(url: string) {
  const safeUrl = sanitizeArticleUrl(url);
  const html = await fetchHtmlWithFallback(safeUrl);
  const $ = cheerio.load(html);

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("meta[name='twitter:title']").attr("content") ||
    $("title").text() ||
    $("h1").first().text() ||
    "";

  const description =
    $("meta[name='description']").attr("content") ||
    $("meta[property='og:description']").attr("content") ||
    $("meta[name='twitter:description']").attr("content") ||
    "";

  const imageCandidates = extractImageCandidates($, safeUrl);
  const image = pickBestImage(imageCandidates);
  const fullText = extractTextBlocks($, safeUrl);

  return {
    title: stripHtml(title),
    description: stripHtml(description),
    image,
    fullText,
  };
}