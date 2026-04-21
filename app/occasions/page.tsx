"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Occasion {
  id: number;
  name: string;
  day_name: string;
  day: number;
  month: number;
  year: number;
  city: string;
  hall: string;
  is_new?: boolean | null;
}

function arabicToEnglishNumbers(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
}

function toSafeNumber(value: unknown) {
  const normalized = arabicToEnglishNumbers(value).trim();
  const num = Number(normalized);
  return Number.isNaN(num) ? 0 : num;
}

function getTodayHijri() {
  const formatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  const parts = formatter.formatToParts(new Date());

  const day = toSafeNumber(parts.find((p) => p.type === "day")?.value);
  const month = toSafeNumber(parts.find((p) => p.type === "month")?.value);
  const year = toSafeNumber(parts.find((p) => p.type === "year")?.value);

  return { day, month, year };
}

function isEventExpired(eventItem: Occasion) {
  const today = getTodayHijri();

  const eventDay = toSafeNumber(eventItem.day);
  const eventMonth = toSafeNumber(eventItem.month);
  const eventYear = toSafeNumber(eventItem.year);

  if (!eventDay || !eventMonth || !eventYear) return false;

  if (eventYear < today.year) return true;
  if (eventYear > today.year) return false;
  if (eventMonth < today.month) return true;
  if (eventMonth > today.month) return false;

  return eventDay < today.day;
}

export default function OccasionsPage() {
  const [events, setEvents] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageUrl, setPageUrl] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setPageUrl(window.location.href);
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/occasions", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch occasions");

        const data = await res.json();
        setEvents(Array.isArray(data?.events) ? data.events : []);
      } catch (error) {
        console.error("خطأ في جلب المناسبات:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOccasions();
  }, []);

  const visibleEvents = useMemo(() => {
    return events.filter((ev) => !isEventExpired(ev));
  }, [events]);

  const processedEvents = useMemo(() => {
    let lastMonthKey: string | null = null;
    let monthToggle = true;

    return visibleEvents.map((ev) => {
      const monthKey = `${ev.year}-${ev.month}`;
      if (monthKey !== lastMonthKey) {
        monthToggle = !monthToggle;
        lastMonthKey = monthKey;
      }
      return { ...ev, monthColorAlt: monthToggle };
    });
  }, [visibleEvents]);

  const shareTitle = "مناسبات وأحداث | أخبار الماس";
  const shareText = "اطلع على صفحة المناسبات والأحداث في أخبار الماس";

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText}\n${pageUrl}`
  )}`;

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(pageUrl)}`;

  const handleNativeShare = async () => {
    if (!canShare) return;

    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: pageUrl,
      });
    } catch {}
  };

  const handleCopy = async () => {
    if (!pageUrl) return;

    try {
      await navigator.clipboard.writeText(pageUrl);
      alert("تم نسخ رابط الصفحة");
    } catch {
      alert("تعذر نسخ الرابط");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-8 overflow-hidden rounded-3xl border border-[#c8a96b]/20 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#0f3d75] via-[#14508f] to-[#0f3d75] px-6 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-1 text-sm font-bold text-white/80">... </p>
                <h1 className="text-2xl font-black text-white md:text-3xl">
                  مناسبات وأحداث
                </h1>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white backdrop-blur">
                  {loading ? "جاري التحميل..." : `${processedEvents.length} مناسبة`}
                </div>

                {canShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/20 md:text-sm"
                  >
                    مشاركة
                  </button>
                )}

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[#25D366]/30 bg-[#25D366] px-4 py-2 text-xs font-black text-white transition hover:opacity-90 md:text-sm"
                >
                  واتساب
                </a>

                <a
                  href={xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-black/10 bg-black px-4 py-2 text-xs font-black text-white transition hover:bg-neutral-800 md:text-sm"
                >
                  X
                </a>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/20 md:text-sm"
                >
                  نسخ الرابط
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <p className="text-sm leading-8 text-slate-600">
              لاضافة مناسبة ارسل البيانات كاملة
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#14508f]" />
          </div>
        ) : processedEvents.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-800">
              لا توجد مناسبات حالية
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              سيتم عرض المناسبات القادمة هنا تلقائيًا عند إضافتها.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-center">
                <thead className="bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#172554] text-white">
                  <tr>
                    <th className="border-b border-white/10 px-2 py-4 text-sm font-black">
                      #
                    </th>
                    <th className="border-b border-white/10 px-3 py-4 text-sm font-black text-right">
                      اسم صاحب المناسبة
                    </th>
                    <th className="border-b border-white/10 px-3 py-4 text-sm font-black">
                      اليوم
                    </th>
                    <th className="border-b border-white/10 px-3 py-4 text-sm font-black">
                      التاريخ
                    </th>
                    <th className="border-b border-white/10 px-3 py-4 text-sm font-black">
                      الشهر
                    </th>
                    <th className="border-b border-white/10 px-3 py-4 text-sm font-black">
                      السنة
                    </th>
                    <th className="border-b border-white/10 px-3 py-4 text-sm font-black">
                      المدينة
                    </th>
                    <th className="border-b border-white/10 px-3 py-4 text-sm font-black">
                      القاعة
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {processedEvents.map((event, index) => {
                    const rowBg =
                      index % 2 === 0 ? "bg-slate-50/70" : "bg-white";
                    const monthBg = event.monthColorAlt
                      ? "bg-slate-100/70"
                      : "bg-white";

                    return (
                      <tr
                        key={event.id}
                        className={`${rowBg} ${
                          event.is_new ? "shadow-[inset_4px_0_0_#fde68a]" : ""
                        }`}
                      >
                        <td
                          className={`border-b border-slate-200 px-2 py-3 text-sm font-black text-slate-500 ${
                            event.is_new ? "bg-yellow-50" : ""
                          }`}
                        >
                          {index + 1}
                        </td>

                        <td className="border-b border-slate-200 px-3 py-3 text-right text-[15px] font-black leading-7 text-slate-800">
                          {(event.name || "").split("/").map((part, idx) => (
                            <div key={idx}>{part.trim()}</div>
                          ))}
                        </td>

                        <td
                          className={`border-b border-slate-200 px-3 py-3 text-sm font-black text-[#7f1d1d] ${monthBg}`}
                        >
                          {event.day_name}
                        </td>

                        <td
                          className={`border-b border-slate-200 px-3 py-3 text-sm font-black text-[#1e3a8a] ${monthBg}`}
                        >
                          {event.day}
                        </td>

                        <td
                          className={`border-b border-slate-200 px-3 py-3 text-sm font-black text-[#1e3a8a] ${monthBg}`}
                        >
                          {event.month}
                        </td>

                        <td
                          className={`border-b border-slate-200 px-3 py-3 text-sm font-black text-[#1e3a8a] ${monthBg}`}
                        >
                          {event.year}
                        </td>

                        <td className="border-b border-slate-200 px-3 py-3 text-sm font-black text-[#14532d]">
                          {event.city}
                        </td>

                        <td className="border-b border-slate-200 px-3 py-3 text-sm font-black text-[#7f1d1d] whitespace-nowrap">
                          {event.hall}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-bold text-slate-500">
              آخر تحديث: {new Date().toLocaleDateString("ar-SA")}
            </div>
          </section>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}