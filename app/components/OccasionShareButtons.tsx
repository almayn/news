"use client";

import { useEffect, useState } from "react";

type Props = {
  title: string;
};

export default function OccasionShareButtons({ title }: Props) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const shareText = `${title}`;

  const handleNativeShare = async () => {
    if (!navigator.share) return;

    try {
      await navigator.share({
        title,
        text: shareText,
        url,
      });
    } catch {}
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("تم نسخ رابط المناسبة");
    } catch {
      alert("تعذر نسخ الرابط");
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText}\n${url}`
  )}`;

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(url)}`;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="rounded-full border border-[#c8a96b]/35 bg-[#0f3d75] px-4 py-2 text-xs font-black text-white transition hover:bg-[#14508f] md:text-sm"
        >
          مشاركة
        </button>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-[#25D366]/35 bg-[#25D366] px-4 py-2 text-xs font-black text-white transition hover:opacity-90 md:text-sm"
      >
        واتساب
      </a>

      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-black text-white transition hover:bg-neutral-800 md:text-sm"
      >
        X
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:border-[#c8a96b]/40 hover:bg-[#c8a96b]/18 md:text-sm"
      >
        نسخ الرابط
      </button>
    </div>
  );
}