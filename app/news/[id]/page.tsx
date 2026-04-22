import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabase";
import ShareButtons from "../../components/ShareButtons";
import AdminEditButton from "../../components/AdminEditButton";
import ArticleBackButton from "../../components/ArticleBackButton";
import type { Metadata } from "next";
import ArticleComments from "../../components/ArticleComments";
import XEmbed from "../../components/XEmbed";

interface Article {
  id: string;
  title: string;
  sub_title?: string | null;
  body: string;
  image_url?: string | null;
  author_image?: string | null;
  extra_images?: string[] | null;
  created_at: string;
  category: string;
  source?: string | null;
  source_url?: string | null;
  author?: string | null;
  is_poem?: boolean | null;
  table_html?: string | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const { data } = await supabase
    .from("news_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    return {
      title: "خبر غير موجود | أخبار الماس",
      description: "الخبر المطلوب غير موجود.",
    };
  }

  const cleanText = (data.body || "")
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();

  const title = data.title?.trim() || "أخبار الماس";
  const description =
    data.sub_title?.trim() ||
    cleanText.slice(0, 160) ||
    "تابع الخبر كاملًا عبر أخبار الماس.";

  const image =
    data.image_url?.trim() ||
    data.author_image?.trim() ||
    "https://almasyn.com/default-news.jpg";

  const url = `https://almasyn.com/news/${id}`;

  return {
    metadataBase: new URL("https://almasyn.com"),
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "أخبار الماس",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "ar_SA",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function renderPoem(body: string) {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="poem-wrapper">
      {lines.map((line, index) => {
        const [sadr, ajuz] = line.split("|").map((part) => part?.trim() || "");

        return (
          <div key={index} className="poem-line-block">
            <div className="poem-sadr">{sadr}</div>
            {ajuz ? <div className="poem-ajuz">{ajuz}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

function renderArticleTable(tableHtml?: string | null) {
  if (!tableHtml || !tableHtml.trim()) return null;

  return (
    <div
      className="article-table-wrap mt-10"
      dangerouslySetInnerHTML={{ __html: tableHtml }}
    />
  );
}

function extractTweetUrlFromBody(body: string = ""): string | null {
  const plain = body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const match = plain.match(
    /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\s/]+\/status\/\d+/i
  );

  return match ? match[0] : null;
}


function removeTweetUrlFromBody(body: string = ""): string {
  return body.replace(
    /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\s<]+\/status\/\d+[^\s<]*/gi,
    ""
  );
}

async function getArticle(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    category: data.category || "عام",
    body: data.body || data.content || "لا يوجد تفاصيل للخبر.",
    source: data.source || "أخبار الماس",
    source_url: data.source_url || null,
    is_poem: data.is_poem || false,
  };
}

export default async function NewsDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  const embeddedTweetUrl = extractTweetUrlFromBody(article.body || "");
  const bodyWithoutTweetUrl = removeTweetUrlFromBody(article.body || "");


  const formattedDate = new Date(article.created_at).toLocaleDateString(
    "ar-SA",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-5 md:mb-7">
          <ArticleBackButton />
        </div>

        <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          {article.category !== "مقالات" && article.image_url && (
            <div className="relative overflow-hidden border-b border-slate-200 bg-slate-100">
              <img
                src={article.image_url}
                alt={article.title}
                className="h-[240px] w-full object-cover md:h-[420px] lg:h-[500px]"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

              <img
                src="https://gjryvqpwncnkpghaiytl.supabase.co/storage/v1/object/public/fonts/almassslogo.png"
                alt="علامة مائية"
                className="pointer-events-none absolute bottom-4 left-4 z-20 w-[74px] opacity-80 drop-shadow-[0_10px_20px_rgba(0,0,0,0.28)] md:bottom-6 md:left-6 md:w-[95px]"
              />
            </div>
          )}

          <div className="p-5 md:p-8 lg:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-2.5 text-xs font-black md:gap-3 md:text-sm">
              <span className="rounded-full border border-[#c8a96b]/25 bg-amber-50 px-3.5 py-2 text-amber-700">
                {article.category}
              </span>

              <span className="rounded-full bg-slate-100 px-3.5 py-2 text-slate-500">
                {formattedDate}
              </span>

              <span className="rounded-full bg-slate-100 px-3.5 py-2 text-slate-600">
                {article.source || "أخبار الماس"}
              </span>
            </div>

            {article.category === "مقالات" && (
              <div className="mb-7 flex items-center gap-4 rounded-[24px] border border-[#c8a96b]/20 bg-gradient-to-l from-amber-50/80 to-white p-4 md:p-5">
                <div className="shrink-0">
                  {article.author_image ? (
                    <img
                      src={article.author_image}
                      alt={article.author || "صورة الكاتب"}
                      className="h-16 w-16 rounded-full border-2 border-[#c8a96b] object-cover shadow-sm md:h-20 md:w-20"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#c8a96b] bg-white text-2xl text-slate-400 shadow-sm md:h-20 md:w-20">
                      ✍
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="mb-1 text-xs font-bold text-slate-500 md:text-sm">
                    الكاتب
                  </p>
                  <p className="text-lg font-black text-slate-900 md:text-2xl">
                    {article.author || "أخبار الماس"}
                  </p>
                </div>
              </div>
            )}

            <header className="mb-8 border-b border-slate-100 pb-6 md:pb-8">
              {article.sub_title && (
                <p className="mb-3 text-lg font-black leading-9 text-amber-600 md:text-2xl">
                  {article.sub_title}
                </p>
              )}

              <h1 className="text-3xl font-black leading-[1.25] text-slate-950 md:text-5xl md:leading-[1.2]">
                {article.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <AdminEditButton articleId={article.id} />
              </div>
            </header>

            <section className="space-y-8">
              {article.is_poem ? (
                <div className="rounded-[28px] bg-slate-50/70 px-4 py-6 ring-1 ring-slate-100 md:px-8 md:py-8">
                  {renderPoem(article.body)}
                </div>
              ) : (
                <>
                  <div
                    className="
                      prose prose-slate max-w-none
                      whitespace-pre-wrap
                      text-[19px] leading-[1.95] text-slate-800 md:text-[21px] md:leading-[2.05]
                      prose-p:mb-6
                      prose-headings:font-black prose-headings:text-slate-900
                      prose-h2:mt-12 prose-h2:mb-5 prose-h2:border-r-4 prose-h2:border-amber-500 prose-h2:pr-4 prose-h2:text-3xl
                      prose-h3:mt-8 prose-h3:text-2xl
                      prose-a:font-bold prose-a:text-blue-700 prose-a:underline-offset-8
                      prose-blockquote:border-r-4 prose-blockquote:border-[#c8a96b]
                      prose-blockquote:bg-slate-50 prose-blockquote:py-3 prose-blockquote:pr-6
                      prose-blockquote:not-italic prose-blockquote:text-slate-700
                      prose-li:my-2
                      prose-strong:text-slate-950
                    "
                    dangerouslySetInnerHTML={{ __html: bodyWithoutTweetUrl }}
                  />

           {embeddedTweetUrl && <XEmbed tweetUrl={embeddedTweetUrl} />}

                  {article.source_url && (
                    <div className="mt-6 flex justify-center">
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <span className="text-slate-500">المصدر</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-blue-700">
                          {article.source || "المصدر"}
                        </span>
                      </a>
                    </div>
                  )}

                  {renderArticleTable(article.table_html)}
                </>
              )}

              {article.extra_images && article.extra_images.length > 0 && (
                <section className="mt-10 border-t border-slate-100 pt-8">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 md:text-xl">
                      صور إضافية
                    </h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">
                      {article.extra_images.length} صورة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {article.extra_images.map((img, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={img}
                          alt={`صورة ${index + 1}`}
                          className="h-64 w-full object-cover transition duration-300 hover:scale-[1.03]"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </section>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 md:px-8 md:py-6">
            <ShareButtons
              url={`https://almasyn.com/news/${article.id}`}
              title={article.title}
            />
          </div>

          <div className="px-5 pb-8 md:px-8 md:pb-10">
            <ArticleComments articleId={article.id} />
          </div>
        </article>
      </div>
    </div>
  );
}