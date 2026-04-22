"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

interface Article {
  id: string;
  title: string;
  sub_title?: string | null;
  body: string;
  image_url?: string | null;
  created_at: string;
  category: string;
  source?: string | null;
  author?: string | null;
  is_pinned?: boolean;
}

type NoticeType = "success" | "error" | "info";

export default function EditorListPage() {
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [notice, setNotice] = useState<{ type: NoticeType; text: string } | null>(
    null
  );

  const showNotice = (text: string, type: NoticeType = "info") => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 2500);
  };

  const truncateWords = (text: string, wordsCount = 20) => {
    const cleanText = text.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
    const words = cleanText.split(" ").filter(Boolean);
    if (words.length <= wordsCount) return cleanText;
    return `${words.slice(0, wordsCount).join(" ")}...`;
  };

  const fetchArticles = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const normalizedData =
        data?.map((item) => ({
          ...item,
          category: item.category || "عام",
          body: item.body || item.content || "",
          source: item.source || "أخبار الماس",
          author: item.author || "",
          is_pinned: item.is_pinned || false,
        })) || [];

      setArticles(normalizedData);
    } catch (error) {
      console.error("Fetch list error:", error);
      showNotice("تعذر تحميل الأخبار", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      const matchesCategory =
        categoryFilter === "الكل" ? true : item.category === categoryFilter;

      const text = `${item.title} ${item.body} ${item.source || ""} ${item.author || ""}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [articles, search, categoryFilter]);

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("news_posts")
        .update({ is_pinned: !currentPinned })
        .eq("id", id);

      if (error) throw error;

      setArticles((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_pinned: !currentPinned } : item
        )
      );

      showNotice(
        currentPinned ? "تم إلغاء تثبيت الخبر" : "تم تثبيت الخبر",
        "success"
      );
    } catch (error) {
      console.error("Pin toggle error:", error);
      showNotice("تعذر تحديث التثبيت", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الخبر؟")) return;

    try {
      setIsDeletingId(id);

      const { error } = await supabase.from("news_posts").delete().eq("id", id);

      if (error) throw error;

      setArticles((prev) => prev.filter((item) => item.id !== id));
      showNotice("تم حذف الخبر بنجاح", "success");
    } catch (error) {
      console.error("Delete error:", error);
      showNotice("تعذر حذف الخبر", "error");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const res = await fetch("/api/admin-logout", {
        method: "POST",
      });

      if (!res.ok) {
        showNotice("تعذر تسجيل الخروج", "error");
        return;
      }

      router.push("/secret-entry");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      showNotice("حدث خطأ أثناء تسجيل الخروج", "error");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200/70 p-4 md:px-6 md:py-10" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <div className="sticky top-20 z-[60] mb-4 flex justify-center">
          {notice && (
            <div
              className={`rounded-2xl px-5 py-3 text-sm font-extrabold shadow-xl ${
                notice.type === "success"
                  ? "bg-emerald-600 text-white"
                  : notice.type === "error"
                  ? "bg-red-600 text-white"
                  : "bg-slate-900 text-white"
              }`}
            >
              {notice.text}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-slate-800 px-5 py-5 text-white md:px-7 md:py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 text-sm font-black text-[#c8a96b]">إدارة الأخبار</p>
                <h1 className="text-2xl font-black md:text-3xl">لوحة  التحكم</h1>
                <p className="mt-2 text-sm font-medium text-slate-200 md:text-base">
استعراض النحتوى                </p>
              </div>
             <div className="flex flex-wrap items-center gap-2">

  {/* زر أساسي */}
  <Link
    href="/editor"
    className="rounded-full bg-[#c8a96b] px-5 py-2 text-sm font-black text-slate-950 shadow-md transition hover:bg-[#d6b57a]"
  >
    + إضافة خبر
  </Link>

  {/* جامع الأخبار */}
  <Link
    href="/editor/collector"
    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
  >
    📡 جامع الأخبار
  </Link>

  {/* المناسبات */}
  <Link
    href="/editor/occasions"
    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
  >
    🎉 المناسبات
  </Link>

  {/* التعليقات */}
  <Link
    href="/editor/comments"
    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
  >
    💬 التعليقات
  </Link>

  {/* تسجيل الخروج */}
  <button
    onClick={handleLogout}
    disabled={isLoggingOut}
    className="ml-auto rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
  >
    {isLoggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}
  </button>

</div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 md:px-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px]">
              <input
                type="text"
                placeholder="ابحث بعنوان الخبر أو النص أو المصدر"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
              >
                <option value="الكل">كل الأقسام</option>
                <option value="عام">عام</option>
                <option value="رياضة">رياضة</option>
                <option value="مجتمع">مجتمع</option>
                <option value="مقالات">مقالات</option>
              </select>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-white px-5 py-4 md:px-6">
            <h2 className="text-lg font-black text-slate-800 md:text-xl">
              الأخبار الموجودة ({filteredArticles.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center md:p-16">
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700"></div>
              <p className="mt-4 text-base font-bold text-slate-500">جاري تحميل الأخبار...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-12 text-center text-base font-bold text-slate-500 md:p-16">
              لا توجد نتائج مطابقة
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredArticles.map((item, index) => (
                <div
                  key={item.id}
                  className="group px-4 py-5 transition hover:bg-slate-50/80 md:px-6"
                >
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[160px_minmax(0,1fr)_140px] lg:items-start">
                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-sm">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-28 w-full object-cover transition duration-500 group-hover:scale-[1.03] md:h-32"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center text-sm font-bold text-slate-400 md:h-48">
                          بدون صورة
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                          {item.category}
                        </span>

                        {item.is_pinned && (
                          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white shadow-sm">
                            مثبت
                          </span>
                        )}

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                          #{index + 1}
                        </span>

                        <span className="text-sm font-bold text-slate-400">
                          {new Date(item.created_at).toLocaleDateString("ar-SA")}
                        </span>
                      </div>

                      <h3 className="mb-3 line-clamp-2 text-xl font-black leading-9 text-slate-900 md:text-2xl">
                        {item.title}
                      </h3>

                      {item.sub_title ? (
                        <p className="mb-3 line-clamp-2 text-base font-bold leading-8 text-slate-500 md:text-lg">
                          {item.sub_title}
                        </p>
                      ) : null}

                      <p className="mb-4 text-base leading-8 text-slate-600 md:text-[17px]">
                        {truncateWords(item.body, 20)}
                      </p>

                      <div className="flex flex-wrap gap-3 text-sm font-bold text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          المصدر: {item.source || "أخبار الماس"}
                        </span>

                        {item.category === "مقالات" && item.author ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                            الكاتب: {item.author}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* أزرار التحكم */}
<div className="flex flex-col gap-2 min-w-[140px] mt-4 lg:mt-0">
  <Link
    href={`/editor?id=${item.id}`}
    className="rounded-2xl bg-[#0f3d75] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#14508f]"
  >
    تعديل الخبر
  </Link>

  {/* زر التثبيت - تأكد أنه يعمل حتى لو كانت القيمة undefined */}
  <button
    onClick={() => handleTogglePin(item.id, !!item.is_pinned)}
    className={`rounded-2xl px-4 py-3 text-sm font-black text-black transition shadow-sm ${
      item.is_pinned 
        ? "bg-amber-500 hover:bg-amber-600" 
        : "bg-slate-500 hover:bg-slate-600"
    }`}
  >
    {item.is_pinned ? "إلغاء التثبيت" : "تثبيت الخبر"}
  </button>

  <Link
    href={`/news/${item.id}`}
    target="_blank"
    className="rounded-2xl bg-slate-200 px-4 py-3 text-center text-sm font-black text-slate-800 transition hover:bg-slate-300"
  >
    عرض الخبر
  </Link>

  <button
    onClick={() => handleDelete(item.id)}
    disabled={isDeletingId === item.id}
    className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
  >
    {isDeletingId === item.id ? "جارٍ الحذف..." : "حذف الخبر"}
  </button>
</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}