"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";

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

type NoticeType = "success" | "error" | "info";

const DAYS_OF_WEEK = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

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

function normalizeText(text: string) {
  return (text || "").trim().replace(/\s+/g, " ");
}

function PlusIcon() {
  return (
    <svg
      className="text-blue-600"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14"></path>
      <path d="M12 5v14"></path>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18"></path>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 1 2 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );
}

export default function EditorOccasionsPage() {
  const [events, setEvents] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Occasion | null>(null);

  const [notice, setNotice] = useState<{ type: NoticeType; text: string } | null>(
    null
  );

  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    dayName: "الخميس",
    day: "",
    month: "",
    year: "1447",
    city: "",
    hall: "",
  });

  const showNotice = (text: string, type: NoticeType = "info") => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice({ text, type });
    noticeTimerRef.current = setTimeout(() => setNotice(null), 2600);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      dayName: "الخميس",
      day: "",
      month: "",
      year: "1447",
      city: "",
      hall: "",
    });
    setEditingId(null);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/occasions", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("تعذر جلب البيانات");
      }

      const data = await res.json();
      setEvents(Array.isArray(data?.events) ? data.events : []);
    } catch (error) {
      console.error(error);
      showNotice("تعذر تحميل بيانات المناسبات", "error");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearIsNewForAll = async () => {
    const currentNewRows = events.filter((ev) => ev.is_new === true).map((ev) => ev.id);
    if (!currentNewRows.length) return true;

    const updatePromises = currentNewRows.map((id) =>
      fetch("/api/occasions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_new: false }),
      })
    );

    const results = await Promise.all(updatePromises);
    return results.every((res) => res.ok);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedData = {
      name: normalizeText(formData.name),
      day_name: formData.dayName,
      day: Number(String(formData.day).trim()),
      month: Number(String(formData.month).trim()),
      year: Number(String(formData.year).trim()),
      city: normalizeText(formData.city),
      hall: normalizeText(formData.hall),
      is_new: true,
    };

    if (
      !cleanedData.name ||
      !cleanedData.day ||
      !cleanedData.month ||
      !cleanedData.year ||
      !cleanedData.city ||
      !cleanedData.hall
    ) {
      showNotice("يرجى تعبئة جميع الحقول المطلوبة", "error");
      return;
    }

    try {
      setSaving(true);

      const cleared = await clearIsNewForAll();
      if (!cleared) {
        showNotice("تعذر تحديث حالة الصفوف القديمة", "error");
        return;
      }

      if (editingId) {
        const res = await fetch("/api/occasions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            ...cleanedData,
          }),
        });

        if (!res.ok) throw new Error("تعذر حفظ التعديلات");

        showNotice("تم تحديث المناسبة بنجاح", "success");
      } else {
        const res = await fetch("/api/occasions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedData),
        });

        if (!res.ok) throw new Error("تعذر إضافة المناسبة");

        showNotice("تمت إضافة المناسبة بنجاح", "success");
      }

      await fetchEvents();
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      showNotice("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (eventToEdit: Occasion) => {
    setFormData({
      name: eventToEdit.name || "",
      dayName: eventToEdit.day_name || "الخميس",
      day: String(eventToEdit.day ?? ""),
      month: String(eventToEdit.month ?? ""),
      year: String(eventToEdit.year ?? "1447"),
      city: eventToEdit.city || "",
      hall: eventToEdit.hall || "",
    });

    setEditingId(eventToEdit.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);

      const res = await fetch("/api/occasions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      if (!res.ok) throw new Error("تعذر حذف المناسبة");

      if (editingId === deleteTarget.id) {
        resetForm();
      }

      setDeleteTarget(null);
      await fetchEvents();
      showNotice("تم حذف المناسبة بنجاح", "success");
    } catch (error) {
      console.error(error);
      showNotice("تعذر حذف المناسبة", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const dataUrlToBlob = async (dataUrl: string) => {
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const exportAsImage = async () => {
    if (!previewRef.current) return;

    try {
      setIsExporting(true);

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      const dataUrl = await htmlToImage.toPng(previewRef.current, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        cacheBust: true,
        style: {
          direction: "rtl",
        },
      });

      const blob = await dataUrlToBlob(dataUrl);
      const fileName = `مواعيد_الزواجات_${new Date()
        .toISOString()
        .split("T")[0]}.png`;

      const file = new File([blob], fileName, { type: "image/png" });

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "مواعيد الزواجات",
          });
          return;
        } catch (error) {
          console.log("تم إلغاء المشاركة أو تعذر فتحها:", error);
        }
      }

      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error(error);
      showNotice("حدث خطأ أثناء تصدير الصورة", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="sticky top-20 z-[60] mb-4 flex justify-center">
          {notice && (
            <div
              className={`rounded-2xl px-5 py-3 text-sm font-extrabold shadow-lg backdrop-blur ${
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

        <div className="mb-8 rounded-3xl bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold text-[#c8a96b]">لوحة التحرير</p>
              <h1 className="text-3xl font-black md:text-4xl">إدارة المناسبات</h1>
              <p className="mt-2 text-sm text-slate-200">
                إضافة وتعديل وحذف مواعيد المناسبات من داخل الموقع
              </p>
            </div>

            <button
              onClick={exportAsImage}
              disabled={isExporting || visibleEvents.length === 0 || loading}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white transition ${
                isExporting || visibleEvents.length === 0 || loading
                  ? "cursor-not-allowed bg-slate-500"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <DownloadIcon />
              {isExporting ? "جاري تجهيز الصورة..." : "تصدير / مشاركة الصورة"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2
                className={`mb-5 flex items-center gap-2 text-xl font-black ${
                  editingId ? "text-amber-600" : "text-slate-800"
                }`}
              >
                {editingId ? <EditIcon /> : <PlusIcon />}
                {editingId ? "تعديل بيانات المناسبة" : "إدخال مناسبة جديدة"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    اسم صاحب المناسبة
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:bg-white"
                    placeholder="الاسم كاملاً"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div className="col-span-2">
                    <label className="mb-1 block font-bold text-slate-700">
                      اليوم
                    </label>
                    <select
                      name="dayName"
                      value={formData.dayName}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:bg-white"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      تاريخ
                    </label>
                    <input
                      required
                      type="number"
                      name="day"
                      value={formData.day}
                      onChange={handleChange}
                      placeholder="يوم"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-center outline-none transition focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      شهر
                    </label>
                    <input
                      required
                      type="number"
                      name="month"
                      value={formData.month}
                      onChange={handleChange}
                      placeholder="شهر"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-center outline-none transition focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      السنة (هجري)
                    </label>
                    <input
                      required
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-center outline-none transition focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      المدينة
                    </label>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-center outline-none transition focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    القاعة
                  </label>
                  <input
                    required
                    type="text"
                    name="hall"
                    value={formData.hall}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-center outline-none transition focus:bg-white"
                    placeholder="اسم القاعة"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`flex-1 rounded-2xl py-3 font-black text-white transition ${
                      editingId
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-blue-600 hover:bg-blue-700"
                    } ${saving ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {saving
                      ? "جاري الحفظ..."
                      : editingId
                      ? "حفظ التعديلات"
                      : "إضافة للقائمة"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-2xl bg-slate-200 px-6 py-3 font-black text-slate-700 transition hover:bg-slate-300"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="max-h-[430px] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 border-b pb-2 font-black text-slate-800">
                البيانات المدخلة ({visibleEvents.length})
              </h3>

              {loading ? (
                <div className="text-sm font-bold text-slate-500">
                  جاري تحميل البيانات...
                </div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {visibleEvents.map((ev, i) => (
                    <li
                      key={ev.id}
                      className={`flex items-center justify-between rounded-xl border p-3 ${
                        editingId === ev.id
                          ? "border-amber-200 bg-amber-50"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <span className="w-2/3 truncate font-bold text-slate-700">
                        {i + 1}. {ev.name}
                      </span>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(ev)}
                          className="rounded p-2 text-blue-600 transition hover:bg-blue-100"
                          title="تعديل"
                        >
                          <EditIcon />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(ev)}
                          className="rounded p-2 text-red-600 transition hover:bg-red-100"
                          title="حذف"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center lg:col-span-8">
            <div className="w-full overflow-x-auto rounded-2xl border-4 border-dashed border-slate-300 bg-slate-200 p-2 shadow-inner">
              <div
                id="export-node"
                ref={previewRef}
                className="relative w-[620px] flex-shrink-0 overflow-hidden rounded-[10px] bg-white shadow-sm"
              >
                <div className="border-b-2 border-[#3b82f6] bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#172554] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex w-24 flex-col items-start justify-center">
                      <div className="text-2xl font-black italic text-white">
                        حـبـيـش
                      </div>
                      <div className="mt-0.5 pr-1 text-xs font-bold text-blue-100">
                        من جهينة
                      </div>
                    </div>

                    <div className="rounded-full border-[2px] border-[#93c5fd] bg-[#eef4ff] px-6 py-1 text-lg font-black text-[#172554] shadow-sm">
                      مواعيد الزواجات
                    </div>

                    <div className="flex w-24 flex-col items-end justify-center">
                      <div className="w-full rounded border border-[#93c5fd] bg-[#eff6ff] px-2 py-1 text-center text-[#1e3a8a] shadow-sm">
                        <span className="block text-lg font-black tracking-widest">
                          الماس
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-1">
                  <table className="w-full border-collapse text-center text-[13px]">
                    <tbody>
                      {processedEvents.map((event, index) => {
                        const bgColor =
                          index % 2 === 0
                            ? "bg-gradient-to-b from-slate-50 via-white to-slate-50"
                            : "bg-gradient-to-b from-slate-100 via-white to-slate-100";

                        const borderClass =
                          "border-[1.5px] border-[#64748b] px-[2px] py-[4px] leading-tight";

                        const monthBg = event.monthColorAlt
                          ? "bg-gradient-to-b from-gray-200 via-white to-gray-200"
                          : "bg-gradient-to-b from-white via-white to-white";

                        return (
                          <tr
                            key={event.id}
                            className={`${bgColor} ${
                              event.is_new ? "shadow-[inset_3px_0_0_#fde68a]" : ""
                            }`}
                          >
                            <td
                              className={`${borderClass} w-[5%] font-black text-black ${
                                event.is_new
                                  ? "bg-gradient-to-b from-yellow-200 via-yellow-100 to-yellow-200"
                                  : "bg-gradient-to-b from-white via-white to-white"
                              }`}
                            >
                              {index + 1}
                            </td>

                            <td className={`${borderClass} w-[42%] align-top pr-2 text-right text-[14px] font-black leading-tight text-[#1e293b]`}>
                              <div className="whitespace-normal break-words">
                                {(event.name || "").split("/").map((part, idx) => (
                                  <div key={idx} className="block">
                                    {part.trim()}
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className={`${borderClass} ${monthBg} w-[10%] text-[12px] font-black text-[#7f1d1d]`}>
                              {event.day_name}
                            </td>

                            <td className={`${borderClass} ${monthBg} w-[4%] text-[13px] font-black text-[#1e3a8a]`}>
                              {event.day}
                            </td>

                            <td className={`${borderClass} ${monthBg} w-[4%] text-[13px] font-black text-[#1e3a8a]`}>
                              {event.month}
                            </td>

                            <td className={`${borderClass} ${monthBg} w-[7%] text-[12px] font-black text-[#1e3a8a]`}>
                              {event.year}
                            </td>

                            <td className={`${borderClass} w-[12%] text-[11px] font-black text-[#14532d]`}>
                              {event.city}
                            </td>

                            <td className={`${borderClass} w-[16%] overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-black text-[#7f1d1d]`}>
                              {event.hall}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-1 border-t border-slate-200 bg-white py-2 text-center text-xs font-semibold text-slate-500">
                  آخر تحديث: {new Date().toLocaleDateString("ar-SA")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="mb-2 text-lg font-black text-slate-800">تأكيد الحذف</h3>

            <p className="mb-4 text-sm leading-7 text-slate-600">
              هل أنت متأكد من حذف هذا الموعد؟
            </p>

            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-bold text-slate-800">
                {deleteTarget.name}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {deleteTarget.day_name} {deleteTarget.day}/{deleteTarget.month}/
                {deleteTarget.year}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`flex-1 rounded-xl py-3 font-bold text-white ${
                  isDeleting
                    ? "cursor-not-allowed bg-red-300"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isDeleting ? "جاري الحذف..." : "نعم، احذف"}
              </button>

              <button
                onClick={() => !isDeleting && setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-slate-200 py-3 font-bold text-slate-700 hover:bg-slate-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}