"use client";

import Link from "next/link";

export default function ShareButtons({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("تم نسخ الرابط ✅");
    } catch {
      alert("تعذر نسخ الرابط");
    }
  };

  const handleXShare = () => {
    const shareText = `${title} ${url}`;
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

    window.location.href = xUrl;
  };

  return (
    <div className="mb-8 flex flex-wrap gap-3">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
      >
        ← الرئيسية
      </Link>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
      >
        واتساب
      </a>

      <button
        type="button"
        onClick={handleXShare}
        className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
      >
        X
      </button>

      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white hover:bg-sky-600"
      >
        تليجرام
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
      >
        نسخ الرابط
      </button>
    </div>
  );
}