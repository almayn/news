import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabase";
import ShareButtons from "../../components/ShareButtons";
import AdminEditButton from "../../components/AdminEditButton";
import ArticleBackButton from "../../components/ArticleBackButton";
import type { Metadata } from "next";

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

// 👇 دالة تنسيق الشعر
function renderPoem(body: string) {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-0">
      {lines.map((line, index) => {
        const [sadr, ajuz] = line.split("|").map((part) => part?.trim() || "");

        return (
          <div key={index} className="poem-line-block">
            <div className="poem-row">
              <div className="shatr sadr">{sadr}</div>
              <div className="shatr ajuz">{ajuz}</div>
            </div>
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
      className="article-table-wrap"
      dangerouslySetInnerHTML={{ __html: tableHtml }}
    />
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <ArticleBackButton />

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {article.category !== "مقالات" && article.image_url && (
            <div className="relative overflow-hidden">
              <img
                src={article.image_url}
                alt={article.title}
                className="h-[260px] w-full object-cover md:h-[460px]"
              />

              <img
                src="https://gjryvqpwncnkpghaiytl.supabase.co/storage/v1/object/public/fonts/almassslogo.png"
                alt="علامة مائية"
                className="pointer-events-none absolute bottom-3 left-3 z-20 w-[68px] opacity-75 drop-shadow-xl"
              />
            </div>
          )}

          <div className="p-6 md:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm font-black">
              <span className="rounded-full bg-primary-50 px-4 py-2 text-primary-700">
                {article.category}
              </span>

              <span className="text-slate-400">
                {new Date(article.created_at).toLocaleDateString("ar-SA")}
              </span>

              <span className="text-slate-500">
                {article.source || "أخبار الماس"}
              </span>

              {/* ✅ تم حذف عرض اسم الكاتب من هنا لتجنب التكرار */}
            </div>

            {article.category === "مقالات" && (
              <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[#c8a96b]/20 bg-amber-50/40 p-4">
                <div className="shrink-0">
                  {article.author_image ? (
                    <img
                      src={article.author_image}
                      alt={article.author || "صورة الكاتب"}
                      className="h-16 w-16 rounded-full object-cover border-2 border-[#c8a96b] shadow-sm"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#c8a96b] bg-white text-2xl text-slate-400 shadow-sm">
                      ✍
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="mb-1 text-xs font-bold text-slate-500">الكاتب</p>
                  <p className="text-lg font-black text-slate-900">
                    {article.author || "أخبار الماس"}
                  </p>
                </div>
              </div>
            )}

            {article.sub_title && (
              <p className="mb-3 text-xl font-black leading-9 text-amber-600 md:text-2xl">
                {article.sub_title}
              </p>
            )}

            <h1 className="mb-6 text-3xl font-black leading-tight text-slate-900 md:text-5xl">
              {article.title}
            </h1>

            <div className="mb-8">
              <AdminEditButton articleId={article.id} />
            </div>

    {article.is_poem ? (
  <div className="poem-wrapper">
    {renderPoem(article.body)}
  </div>
) : (
  <>
    <div
      className="
        prose max-w-none
        whitespace-pre-wrap
        text-[20px] md:text-[21px] leading-[1.8] md:leading-[2] text-slate-800
        prose-p:mb-6
        prose-headings:text-slate-900 prose-headings:font-black
        prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-5 prose-h2:border-r-4 prose-h2:border-amber-500 prose-h2:pr-4
        prose-h3:text-2xl prose-h3:mt-8
        prose-a:text-blue-700 prose-a:font-bold prose-a:underline-offset-8
        prose-blockquote:border-r-4 prose-blockquote:border-[#c8a96b]
        prose-blockquote:bg-slate-50 prose-blockquote:pr-6 prose-blockquote:py-2
        prose-blockquote:text-slate-700 prose-blockquote:not-italic
        prose-li:my-2 prose-strong:text-slate-950
      "
      dangerouslySetInnerHTML={{ __html: article.body }}
    />

    {renderArticleTable(article.table_html)}
  </>
)}

            
            {article.extra_images && article.extra_images.length > 0 && (
              <div className="mt-10 space-y-4">
                <h3 className="text-lg font-black text-slate-900">صور إضافية</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {article.extra_images.map((img, index) => (
                    <div key={index} className="overflow-hidden rounded-2xl">
                      <img
                        src={img}
                        alt={`صورة ${index + 1}`}
                        className="h-64 w-full object-cover transition hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ShareButtons
            url={`https://almasyn.com/news/${article.id}`}
            title={article.title}
          />
        </article>
      </div>
    </div>
  );
}