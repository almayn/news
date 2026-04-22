"use client";

import { useEffect, useMemo, useState } from "react";

type CommentItem = {
  id: number;
  article_id: number;
  author_name: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  news_posts?: {
    id: number;
    title: string;
  } | null;
};
function formatArabicDate(date: string) {
  try {
    return new Date(date).toLocaleString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date;
  }
}

export default function EditorCommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [notice, setNotice] = useState<string>("");

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/comments?admin=1", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "فشل في جلب التعليقات");
      }

      setComments(Array.isArray(data?.comments) ? data.comments : []);
    } catch (error) {
      console.error(error);
      setComments([]);
      setNotice("تعذر جلب التعليقات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const filteredComments = useMemo(() => {
    if (filter === "all") return comments;
    return comments.filter((item) => item.status === filter);
  }, [comments, filter]);

  const updateStatus = async (
    id: number,
    status: "pending" | "approved" | "rejected"
  ) => {
    try {
      setBusyId(id);
      setNotice("");

      const res = await fetch("/api/comments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "تعذر تحديث التعليق");
      }

      setComments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : "تعذر تحديث التعليق");
    } finally {
      setBusyId(null);
    }
  };

  const deleteComment = async (id: number) => {
    const ok = window.confirm("هل أنت متأكد من حذف هذا التعليق؟");
    if (!ok) return;

    try {
      setBusyId(id);
      setNotice("");

      const res = await fetch(`/api/comments?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "تعذر حذف التعليق");
      }

      setComments((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : "تعذر حذف التعليق");
    } finally {
      setBusyId(null);
    }
  };

  const countPending = comments.filter((c) => c.status === "pending").length;
  const countApproved = comments.filter((c) => c.status === "approved").length;
  const countRejected = comments.filter((c) => c.status === "rejected").length;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-3xl border border-[#c8a96b]/20 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#0f3d75] via-[#14508f] to-[#0f3d75] px-6 py-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-1 text-sm font-bold text-white/80">
                  لوحة التحكم
                </p>
                <h1 className="text-2xl font-black text-white md:text-3xl">
                  إدارة التعليقات
                </h1>
              </div>

              <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white backdrop-blur">
                {loading ? "جاري التحميل..." : `${comments.length} تعليق`}
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-4 md:p-6">
            <div className="rounded-2xl bg-slate-100 p-4 text-center">
              <div className="text-sm font-bold text-slate-500">الكل</div>
              <div className="mt-1 text-xl font-black text-slate-900">
                {comments.length}
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4 text-center">
              <div className="text-sm font-bold text-amber-700">بانتظار المراجعة</div>
              <div className="mt-1 text-xl font-black text-amber-900">
                {countPending}
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4 text-center">
              <div className="text-sm font-bold text-emerald-700">المعتمدة</div>
              <div className="mt-1 text-xl font-black text-emerald-900">
                {countApproved}
              </div>
            </div>

            <div className="rounded-2xl bg-rose-50 p-4 text-center">
              <div className="text-sm font-bold text-rose-700">المرفوضة</div>
              <div className="mt-1 text-xl font-black text-rose-900">
                {countRejected}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { key: "all", label: "الكل" },
            { key: "pending", label: "بانتظار المراجعة" },
            { key: "approved", label: "المعتمدة" },
            { key: "rejected", label: "المرفوضة" },
          ].map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as typeof filter)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  active
                    ? "bg-[#0f3d75] text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {notice ? (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {notice}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#14508f]" />
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-800">لا توجد تعليقات</h2>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5"
              >
                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-black text-slate-900">
                        {comment.author_name}
                      </h2>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black ${
                          comment.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : comment.status === "rejected"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {comment.status === "approved"
                          ? "معتمد"
                          : comment.status === "rejected"
                          ? "مرفوض"
                          : "بانتظار المراجعة"}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                     {comment.news_posts?.title ? (
  <a
    href={`/news/${comment.news_posts.id}`}
    target="_blank"
    className="text-blue-600 font-bold hover:underline"
  >
    {comment.news_posts.title}
  </a>
) : (
  <span className="text-gray-400">
    خبر غير موجود
  </span>
)}
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                      {formatArabicDate(comment.created_at)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(comment.id, "approved")}
                      disabled={busyId === comment.id}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      اعتماد
                    </button>

                    <button
                      onClick={() => updateStatus(comment.id, "rejected")}
                      disabled={busyId === comment.id}
                      className="rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-600 disabled:opacity-50"
                    >
                      رفض
                    </button>

                    <button
                      onClick={() => updateStatus(comment.id, "pending")}
                      disabled={busyId === comment.id}
                      className="rounded-full bg-slate-500 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-600 disabled:opacity-50"
                    >
                      انتظار
                    </button>

                    <button
                      onClick={() => deleteComment(comment.id)}
                      disabled={busyId === comment.id}
                      className="rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-8 text-slate-700 md:text-base">
                  {comment.body}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}