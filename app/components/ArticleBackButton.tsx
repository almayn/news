"use client";

import { useRouter } from "next/navigation";

export default function ArticleBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={handleBack}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f3d75] px-5 py-3 text-sm font-black text-white shadow-md transition hover:bg-[#14508f]"
      >
        ← رجوع
      </button>
    </div>
  );
}