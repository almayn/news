"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CommentItem = {
  id: number;
  article_id: number;
  author_name: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type Props = {
  articleId: number | string;
};

function formatArabicDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

export default function ArticleComments({ articleId }: Props) {
  const numericArticleId = useMemo(() => Number(articleId), [articleId]);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");

  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);

  const emojis = ["😀", "😂", "😍", "👍", "🔥", "😢"];

  const fetchComments = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/comments?article_id=${numericArticleId}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "فشل في جلب التعليقات");
      }

      setComments(Array.isArray(data?.comments) ? data.comments : []);
    } catch (error) {
      console.error(error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!numericArticleId || Number.isNaN(numericArticleId)) return;
    fetchComments();
  }, [numericArticleId]);

  useEffect(() => {
    if (isFormOpen && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isFormOpen]);

  const addEmoji = (emoji: string) => {
    setBody((prev) => (prev ? `${prev} ${emoji}` : emoji));
  };

  const resetForm = () => {
    setAuthorName("");
    setBody("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorName.trim()) {
      setNotice({ type: "error", text: "اكتب الاسم أولًا" });
      return;
    }

    if (!body.trim()) {
      setNotice({ type: "error", text: "اكتب التعليق أولًا" });
      return;
    }

    try {
      setSending(true);
      setNotice({ type: "info", text: "جاري إرسال التعليق..." });

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article_id: numericArticleId,
          author_name: authorName,
          body,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "تعذر إرسال التعليق");
      }

      resetForm();
      setNotice({
        type: "success",
        text: data?.message || "تم إرسال تعليقك بنجاح",
      });

      setTimeout(() => {
        setIsFormOpen(false);
      }, 700);
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "تعذر إرسال التعليق",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-10 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-900 md:text-2xl">
          التعليقات
        </h2>

        <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 md:text-sm">
          {loading ? "..." : `${comments.length} تعليق`}
        </div>
      </div>

      <div className="mb-6">
        {!isFormOpen ? (
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              setNotice(null);
            }}
            className="rounded-full bg-[#0f3d75] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#14508f]"
          >
            أضف تعليق
          </button>
        ) : (
          <div
            ref={formRef}
            className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-black text-slate-800 md:text-lg">
                أضف تعليقك
              </h3>

              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setNotice(null);
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100"
              >
                إخفاء
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="اسمك"
                maxLength={40}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#c8a96b] focus:ring-2 focus:ring-[#c8a96b]/20"
              />

              <div className="flex flex-wrap gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-slate-200 transition hover:scale-105 hover:bg-slate-100"
                    aria-label={`إضافة ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب تعليقك هنا"
                rows={4}
                maxLength={1000}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#c8a96b] focus:ring-2 focus:ring-[#c8a96b]/20"
              />

              {notice && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                    notice.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : notice.type === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {notice.text}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-full bg-[#0f3d75] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#14508f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "جاري الإرسال..." : "إرسال التعليق"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">
          جاري تحميل التعليقات...
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">
          لا توجد تعليقات حتى الآن
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f3d75]/10 text-sm font-black text-[#0f3d75]">
                    {comment.author_name.slice(0, 1)}
                  </div>

                  <div>
                   <h3
  className="text-base md:text-lg font-black"
  style={{ fontFamily: "LamaSans, sans-serif", color: "#0cadc2" }}
>
  {comment.author_name}
</h3>

                    <span className="text-xs font-bold text-slate-500">
                      {formatArabicDate(comment.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <p
  className="whitespace-pre-wrap rounded-2xl bg-white px-4 py-3 text-base md:text-lg leading-9"
  style={{ fontFamily: "STC, sans-serif", color: "#106ad8" }}
>
  {comment.body}
</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}