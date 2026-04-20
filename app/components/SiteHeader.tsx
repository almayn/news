"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const LOGO_URL =
  "https://gjryvqpwncnkpghaiytl.supabase.co/storage/v1/object/public/fonts/almaslogo1.png";

const categories = ["الرئيسية", "عام", "رياضة", "مجتمع", "مقالات"];

function SiteHeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const scrollRef = useRef<HTMLUListElement>(null);

  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const categoryFromUrl = searchParams.get("category");
  const activeCategory = pathname === "/" ? categoryFromUrl || "الرئيسية" : "";

  const todayText = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleCategoryClick = (category: string) => {
    if (category === "الرئيسية") {
      router.push("/");
      return;
    }

    router.push(`/?category=${encodeURIComponent(category)}`);
  };

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 4);
  };

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const amount = 180;
    el.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });

    window.setTimeout(updateScrollState, 250);
  };

  useEffect(() => {
    updateScrollState();

    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  useEffect(() => {
    window.setTimeout(updateScrollState, 50);
  }, [pathname, searchParams]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#c8a96b]/25 bg-gradient-to-l from-[#0a2f5c] via-[#0f3d75] to-[#0a2f5c] shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#e6cc8c]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
       <div className="relative h-[74px] md:h-[82px]">
  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-100/95 md:text-sm">
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2.5 py-1.5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:px-3 md:py-1.5">
      {todayText}
    </span>
  </div>

  <div className="absolute right-0 top-1/2 -translate-y-1/2">
    <Link
      href="/"
      className="group relative inline-flex items-center justify-center overflow-visible"
      aria-label="العودة للرئيسية"
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[#c8a96b]/10 blur-2xl transition duration-300 group-hover:bg-[#c8a96b]/20" />

      <img
        src={LOGO_URL}
        alt="الماس"
        className="relative h-[38px] w-auto object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.22)] transition-transform duration-300 group-hover:scale-[1.02] md:h-[46px]"
      />
    </Link>
  </div>
</div>
        <div className="pb-3 md:pb-4">
          <div className="rounded-[24px] border border-white/10 bg-white/8 px-2 py-2 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="relative flex items-center justify-center">
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollByAmount("right")}
                  className="absolute right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0b3566] text-white shadow-md transition hover:bg-[#14508f]"
                  aria-label="عرض المزيد من التصنيفات"
                >
                  ❮
                </button>
              )}

              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollByAmount("left")}
                  className="absolute left-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0b3566] text-white shadow-md transition hover:bg-[#14508f]"
                  aria-label="العودة للتصنيفات السابقة"
                >
                  ❯
                </button>
              )}

              <div className="w-full overflow-hidden px-1 md:mx-10 md:px-0">
                <ul
                  ref={scrollRef}
                  className="hide-scrollbar flex items-center justify-center gap-2 overflow-x-auto scroll-smooth px-1"
                >
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat;

                    return (
                      <li key={cat} className="shrink-0">
                        <button
                          onClick={() => handleCategoryClick(cat)}
                          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black transition-all duration-300 md:px-6 md:py-2 md:text-sm ${
                            isActive
                              ? "scale-[1.03] bg-gradient-to-r from-[#d7b778] via-[#c8a96b] to-[#b89355] text-[#0f3d75] shadow-[0_8px_22px_rgba(200,169,107,0.38)]"
                              : "border border-white/10 bg-white/10 text-white hover:border-[#c8a96b]/40 hover:bg-[#c8a96b]/18"
                          }`}
                        >
                          {cat}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function SiteHeader() {
  return (
    <Suspense fallback={<div className="h-[118px] bg-[#0f3d75]" />}>
      <SiteHeaderContent />
    </Suspense>
  );
}