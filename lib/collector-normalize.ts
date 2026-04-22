export function stripHtml(html: string = ""): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeArabic(text: string = ""): string {
  return text
    .toLowerCase()
    .replace(/[أإآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTitle(title: string = ""): string {
  return normalizeArabic(stripHtml(title));
}

function removeArabicListenerNotice(text: string): string {
  return text
    .replace(/استمع للمقال\s*النص المسموع تلقائي ناتج عن نظام آلي/gi, "")
    .replace(/استمع للمقال/gi, "")
    .replace(/النص المسموع تلقائي ناتج عن نظام آلي/gi, "")
    .trim();
}

function dedupeLeadingParagraph(text: string): string {
  const parts = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length < 2) return text.trim();

  const first = normalizeArabic(parts[0]);
  const second = normalizeArabic(parts[1]);

  if (!first || !second) return text.trim();

  if (first === second || second.startsWith(first) || first.startsWith(second)) {
    parts.splice(0, 1);
  }

  return parts.join("\n\n").trim();
}

function cutOkazEnglishBlock(text: string): string {
  const normalized = text.replace(/\r/g, "").trim();

  if (!normalized) return "";

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!paragraphs.length) return normalized;

  let sawArabicParagraph = false;
  const kept: string[] = [];

  for (const paragraph of paragraphs) {
    const arabicChars = (paragraph.match(/[\u0600-\u06FF]/g) || []).length;
    const latinChars = (paragraph.match(/[A-Za-z]/g) || []).length;
    const totalChars = paragraph.replace(/\s/g, "").length;

    const hasArabic = arabicChars > 0;

    const englishRatio =
      totalChars > 0 ? latinChars / totalChars : 0;

    const looksEnglishParagraph =
      !hasArabic &&
      latinChars >= 20 &&
      englishRatio >= 0.45;

    if (hasArabic) {
      sawArabicParagraph = true;
      kept.push(paragraph);
      continue;
    }

    if (sawArabicParagraph && looksEnglishParagraph) {
      break;
    }

    kept.push(paragraph);
  }

  return kept.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function cleanNewsBody(text: string = "", sourceName: string = ""): string {
  let value = (text || "").trim();

  if (!value) return "";

  value = value.replace(/\r/g, "");
  value = value.replace(/[ \t]+\n/g, "\n");
  value = value.replace(/\n[ \t]+/g, "\n");
  value = value.replace(/\n{3,}/g, "\n\n");
  value = value.replace(/[ \t]{2,}/g, " ");
  value = value.trim();

  value = removeArabicListenerNotice(value);
  value = value.replace(/\n{3,}/g, "\n\n").trim();

  value = dedupeLeadingParagraph(value);

  if (sourceName === "عكاظ") {
    value = cutOkazEnglishBlock(value);
  }

  return value.replace(/\n{3,}/g, "\n\n").trim();
}
const STOP_WORDS = [
  "اليوم",
  "عاجل",
  "رسمي",
  "رسميًا",
  "شاهد",
  "فيديو",
  "تفاصيل",
  "بالصور",
  "بعد",
  "سبب",
  "بسبب",
  "حول",
  "الى",
  "إلى",
  "في",
  "من",
  "على",
  "عن",
  "مع",
  "هذا",
  "هذه",
  "ذلك",
];

export function makeDedupeTitle(title: string = ""): string {
  const clean = normalizeTitle(title);

  return clean
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.includes(word))
    .slice(0, 8)
    .join(" ");
}

export function isSimilarTitle(a: string, b: string): boolean {
  if (!a || !b) return false;

  const aWords = a.split(" ").filter(Boolean);
  const bWords = b.split(" ").filter(Boolean);

  const common = aWords.filter((w) => bWords.includes(w));

  return common.length >= 4;
}
export function cleanTitle(title: string = "", sourceName: string = "") {
  let value = title.trim();

  if (!value) return "";

  const pattern = new RegExp(
    `\\s*[-–—|]\\s*(${sourceName}|صحيفة\\s*${sourceName})\\s*$`,
    "i"
  );

  value = value.replace(pattern, "");

  return value.trim();
}
export function extractTweetUrl(text: string = ""): string | null {
  const match = text.match(
    /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\s]+\/status\/\d+/i
  );

  return match ? match[0] : null;
}