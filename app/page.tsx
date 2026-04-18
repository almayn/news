"use client";

import Link from "next/link";
import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "./lib/supabase";

interface Article {
  id: string;
  title: string;
  sub_title?: string | null;
  body: string;
  image_url: string;
  created_at: string;
  category: string;
  source?: string | null;
  author?: string | null;
  is_pinned?: boolean;
}

function HomeContent() {
  const [news, setNews] = useState<Article[]>([]);
  const [filteredNews, setFilteredNews] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "الرئيسية";

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("news_posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const normalizedData = data.map((item) => ({
            ...item,
            category: item.category || "عام",
            body: item.body || item.content || "لا يوجد تفاصيل للخبر.",
            source: item.source || "أخبار الماس",
            is_pinned: item.is_pinned || false,
          }));

          setNews(normalizedData);
        }
      } catch (error) {
        console.error("خطأ في جلب الأخبار:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  const articlesOnly = useMemo(
    () => news.filter((item) => item.category === "مقالات"),
    [news]
  );

  const regularNews = useMemo(() => {
    return news
      .filter((item) => item.category !== "مقالات")
      .sort((a, b) => {
        if (!!a.is_pinned !== !!b.is_pinned) {
          return Number(!!b.is_pinned) - Number(!!a.is_pinned);
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [news]);

  useEffect(() => {
    if (activeCategory === "الرئيسية") {
      setFilteredNews(regularNews);
    } else {
      setFilteredNews(
        news
          .filter((item) => item.category === activeCategory)
          .sort((a, b) => {
            if (!!a.is_pinned !== !!b.is_pinned) {
              return Number(!!b.is_pinned) - Number(!!a.is_pinned);
            }
            return (
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          })
      );
    }
    setCurrentPage(1);
  }, [activeCategory, news, regularNews]);

  const latestArticle = articlesOnly[0];

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredNews.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

  const heroArticle = currentItems[0];
  const gridArticles = currentItems.slice(1);

  const previousPosts =
    activeCategory === "الرئيسية" ? regularNews.slice(itemsPerPage) : [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : filteredNews.length === 0 && articlesOnly.length === 0 ? (
          <div className="rounded-2xl bg-white py-16 text-center text-lg font-bold text-gray-500 shadow-sm">
            لا توجد أخبار في هذا القسم حاليًا
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              {filteredNews.length === 0 ? (
                <div className="rounded-2xl bg-white py-16 text-center text-lg font-bold text-gray-500 shadow-sm">
                  لا توجد أخبار في هذا القسم حاليًا
                </div>
              ) : (
                <>
                  {heroArticle && (
                    <Link
                      href={`/news/${heroArticle.id}`}
                      className="mb-8 block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="relative">
                          <img
                            src={heroArticle.image_url}
                            alt={heroArticle.title}
                            className="h-[220px] w-full object-cover object-center md:h-[380px]"
                          />
                          <div className="absolute right-4 top-4 rounded-full bg-primary-600 px-4 py-1 text-sm font-black text-white shadow-lg">
                            {heroArticle.category}
                          </div>
                        </div>

                        <div className="flex flex-col justify-center p-6 md:p-8">
                          <span className="mb-2 text-sm font-black text-primary-600">
                            {new Date(heroArticle.created_at).toLocaleDateString(
                              "ar-SA"
                            )}
                          </span>

                          <h2 className="mb-3 text-2xl font-black leading-tight text-slate-900 md:text-3xl">
                            {heroArticle.title}
                          </h2>

                          {heroArticle.sub_title && (
                            <p className="mb-4 text-base font-bold text-slate-500">
                              {heroArticle.sub_title}
                            </p>
                          )}

                          <p className="line-clamp-4 text-sm leading-7 text-slate-600">
                            {heroArticle.body.replace(/<[^>]*>?/gm, "")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
                    {gridArticles.map((item) => (
                      <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow transition hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="relative">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-primary-700 shadow">
                            {item.category}
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="mb-2 text-xs font-black text-slate-400">
                            {new Date(item.created_at).toLocaleDateString("ar-SA")}
                          </div>

                          <h3 className="mb-3 line-clamp-2 text-xl font-black leading-snug text-slate-900 group-hover:text-primary-700">
                            {item.title}
                          </h3>

                          {item.sub_title && (
                            <p className="mb-2 line-clamp-2 text-sm font-bold text-slate-500">
                              {item.sub_title}
                            </p>
                          )}

                          <p className="line-clamp-3 text-sm leading-7 text-slate-600">
                            {item.body.replace(/<[^>]*>?/gm, "")}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-3">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-2 font-bold text-slate-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                      >
                        السابق
                      </button>

                      <div className="rounded-xl bg-primary-50 px-5 py-2 font-black text-primary-700">
                        {currentPage} / {totalPages}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-2 font-bold text-slate-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                      >
                        التالي
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <aside className="space-y-6">
              <section className="overflow-hidden rounded-3xl border border-[#c8a96b]/20 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-[#0f3d75] to-[#14508f] px-4 py-3">
                  <h2 className="text-center text-base font-black text-white">
                    مقالات
                  </h2>
                </div>

                <div className="p-4">
                  {latestArticle ? (
                    <Link href={`/news/${latestArticle.id}`} className="group block">
                      <div className="space-y-3">
                        <h3 className="text-center text-lg font-black leading-8 text-slate-900 transition group-hover:text-primary-700">
                          {latestArticle.title}
                        </h3>

                        {latestArticle.image_url && (
                          <div className="overflow-hidden rounded-2xl">
                            <img
                              src={latestArticle.image_url}
                              alt={latestArticle.title}
                              className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          </div>
                        )}

                        {(latestArticle.source || latestArticle.author) && (
                          <p className="text-center text-sm font-bold text-primary-700">
                            الكاتب: {latestArticle.source || latestArticle.author}
                          </p>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
                      لا توجد مقالات حالياً
                    </div>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="bg-slate-100 px-4 py-3">
                  <h2 className="text-center text-base font-black text-[#0f3d75]">
                    منشورات سابقة
                  </h2>
                </div>

                <div className="p-3">
                  {activeCategory === "الرئيسية" ? (
                    previousPosts.length > 0 ? (
                      <ul className="space-y-2">
                        {previousPosts.map((item, index) => (
                          <li key={item.id}>
                            <Link
                              href={`/news/${item.id}`}
                              className="group flex items-start gap-3 rounded-2xl px-3 py-2 transition hover:bg-slate-50"
                            >
                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f3d75] text-xs font-black text-white">
                                {index + 1}
                              </span>

                              <span className="line-clamp-2 text-sm font-bold leading-6 text-slate-800 transition group-hover:text-primary-700">
                                {item.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
                        لا توجد منشورات سابقة
                      </div>
                    )
                  ) : (
                    <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
                      تظهر المنشورات السابقة في الصفحة الرئيسية فقط
                    </div>
                  )}
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}