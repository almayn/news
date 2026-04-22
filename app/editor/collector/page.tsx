"use client";

import { useEffect, useMemo, useState } from "react";

type CollectorItem = {
  id: number;
  source_name: string;
  title: string;
  original_title?: string;
  normalized_title?: string;
  url: string;
  description?: string;
  full_text?: string;
  image_url?: string;
  image_hd?: string;
  published_at?: string | null;
  matched_keywords?: string[];
  status?: string;
  chosen_category?: string | null;
  publish_error?: string | null;
  published_post_id?: number | null;
};

type PublishState = {
  type: "idle" | "loading" | "success" | "duplicate" | "error";
  message: string;
};

const CATEGORY_OPTIONS = ["عام", "منوعات", "رياضة", "مجتمع", "مقالات"];

export default function CollectorPage() {
  const [data, setData] = useState<CollectorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [publishNoticeMap, setPublishNoticeMap] = useState<
    Record<number, PublishState>
  >({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setNotice("");

      const res = await fetch("/api/collector", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "فشل في جلب الأخبار");
      }

      setData(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : "حدث خطأ");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewFromSources = async () => {
    try {
      setLoading(true);
      setNotice("");

      const res = await fetch("/api/collector/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "فشل في تحديث الأخبار");
      }

      setNotice(
        `تم تحديث الأخبار${
          typeof json?.inserted_now === "number" ? ` وإضافة ${json.inserted_now}` : ""
        }`
      );

      await fetchData();
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : "فشل في تحديث الأخبار");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/collector/manage", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "فشل في تحديث الحالة");
      }

      await fetchData();
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : "فشل في تحديث الحالة");
    }
  };

  const publishToSite = async (id: number) => {
    const category = categoryMap[id];

    if (!category) {
      setPublishNoticeMap((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          message: "اختر التصنيف أولًا قبل النشر",
        },
      }));
      return;
    }

    try {
      setPublishingId(id);
      setPublishNoticeMap((prev) => ({
        ...prev,
        [id]: {
          type: "loading",
          message: "جاري نشر الخبر...",
        },
      }));

      const res = await fetch("/api/collector/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, category }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "فشل في النشر");
      }

      if (!json.ok && json.duplicate) {
        setPublishNoticeMap((prev) => ({
          ...prev,
          [id]: {
            type: "duplicate",
            message: json.message || "هذا الخبر منشور سابقًا",
          },
        }));
        await fetchData();
        return;
      }

      if (!json.ok) {
        throw new Error(json?.error || "فشل في النشر");
      }

      setPublishNoticeMap((prev) => ({
        ...prev,
        [id]: {
          type: "success",
          message: json.message || "تم نشر الخبر بنجاح",
        },
      }));

      await fetchData();
    } catch (error) {
      console.error(error);
      setPublishNoticeMap((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          message: error instanceof Error ? error.message : "فشل في النشر",
        },
      }));
    } finally {
      setPublishingId(null);
    }
  };

  const deleteItem = async (id: number) => {
    const ok = window.confirm("هل أنت متأكد من حذف هذا الخبر من القاعدة؟");
    if (!ok) return;

    try {
      const res = await fetch("/api/collector/manage", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "فشل في الحذف");
      }

      await fetchData();
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : "فشل في الحذف");
    }
  };

  const deleteAll = async () => {
    const ok = window.confirm(
      "هل أنت متأكد من حذف جميع الأخبار المجلوبة من القاعدة؟"
    );
    if (!ok) return;

    try {
      const res = await fetch("/api/collector/manage", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleteAll: true }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "فشل في حذف الكل");
      }

      setNotice("تم حذف جميع الأخبار من القاعدة");
      await fetchData();
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : "فشل في حذف الكل");
    }
  };

  const counts = useMemo(() => {
    return {
      all: data.length,
      new: data.filter((x) => (x.status || "new") === "new").length,
      picked: data.filter((x) => x.status === "picked").length,
      ignored: data.filter((x) => x.status === "ignored").length,
      published: data.filter((x) => x.status === "published").length,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (statusFilter === "all") return true;
      return (item.status || "new") === statusFilter;
    });
  }, [data, statusFilter]);

  const getInlineNoticeStyle = (state?: PublishState) => {
    switch (state?.type) {
      case "loading":
        return "bg-blue-50 text-blue-700";
      case "success":
        return "bg-emerald-50 text-emerald-700";
      case "duplicate":
        return "bg-amber-50 text-amber-800";
      case "error":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">جامع الأخبار</h1>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchNewFromSources}
            className="rounded-full bg-blue-700 px-5 py-2 text-white"
          >
            تحديث الأخبار
          </button>

          <button
            onClick={deleteAll}
            className="rounded-full bg-red-700 px-5 py-2 text-white"
          >
            حذف الكل من القاعدة
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="text-sm font-bold text-slate-500">الكل</div>
          <div className="mt-1 text-xl font-black text-slate-900">
            {counts.all}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="text-sm font-bold text-slate-500">جديد</div>
          <div className="mt-1 text-xl font-black text-slate-900">
            {counts.new}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="text-sm font-bold text-slate-500">مختار</div>
          <div className="mt-1 text-xl font-black text-slate-900">
            {counts.picked}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="text-sm font-bold text-slate-500">متجاهل</div>
          <div className="mt-1 text-xl font-black text-slate-900">
            {counts.ignored}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="text-sm font-bold text-slate-500">منشور</div>
          <div className="mt-1 text-xl font-black text-slate-900">
            {counts.published}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: "all", label: "الكل" },
          { key: "new", label: "جديد" },
          { key: "picked", label: "مختار" },
          { key: "ignored", label: "متجاهل" },
          { key: "published", label: "منشور" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              statusFilter === filter.key
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {notice ? (
        <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredData.map((item) => {
            const previewImage = item.image_hd || item.image_url || "";
            const inlineNotice = publishNoticeMap[item.id];

            return (
              <div
                key={item.id}
                className="flex h-full flex-col rounded-2xl border bg-white p-4 shadow"
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt={item.title}
                    className="mb-4 h-52 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mb-4 flex h-52 w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    لا توجد صورة
                  </div>
                )}

                <h2 className="line-clamp-3 font-black leading-7 text-slate-900">
                  {item.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">{item.source_name}</p>

                {item.matched_keywords?.length ? (
                  <div className="mt-2 text-xs text-blue-700">
                    {item.matched_keywords.join(" - ")}
                  </div>
                ) : null}

                {item.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                ) : null}

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-sm text-blue-700 underline"
                >
                  فتح الخبر
                </a>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <select
                    value={categoryMap[item.id] || item.chosen_category || ""}
                    onChange={(e) =>
                      setCategoryMap((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700"
                  >
                    <option value="">اختر التصنيف</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => publishToSite(item.id)}
                    disabled={publishingId === item.id}
                    className="rounded-full bg-indigo-700 px-4 py-1 text-sm text-white disabled:opacity-60"
                  >
                    {publishingId === item.id
                      ? "جاري النشر..."
                      : "تحويل إلى خبر في موقعك"}
                  </button>

                  <button
                    onClick={() => updateStatus(item.id, "picked")}
                    className="rounded-full bg-green-600 px-4 py-1 text-sm text-white"
                  >
                    اختيار ⭐
                  </button>

                  <button
                    onClick={() => updateStatus(item.id, "ignored")}
                    className="rounded-full bg-yellow-500 px-4 py-1 text-sm text-white"
                  >
                    تجاهل 🚫
                  </button>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="rounded-full bg-red-600 px-4 py-1 text-sm text-white"
                  >
                    حذف ❌
                  </button>
                </div>

                {inlineNotice?.message ? (
                  <div
                    className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold ${getInlineNoticeStyle(
                      inlineNotice
                    )}`}
                  >
                    {inlineNotice.message}
                  </div>
                ) : null}

                <div className="mt-3 text-xs text-slate-400">
                  الحالة: {item.status || "new"}
                  {item.chosen_category ? ` — التصنيف: ${item.chosen_category}` : ""}
                </div>

                {item.publish_error ? (
                  <div className="mt-2 text-xs text-red-500">
                    خطأ النشر: {item.publish_error}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}