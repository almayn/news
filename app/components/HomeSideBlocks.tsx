"use client";

import Link from "next/link";

type PostItem = {
  id: number | string;
  title: string;
  image_url?: string | null;
  category?: string | null;
  source?: string | null;
  created_at?: string | null;
};

type Props = {
  posts: PostItem[];
};

export default function HomeSideBlocks({ posts }: Props) {
  const articles = posts.filter((post) => post.category === "مقالات");
  const normalPosts = posts.filter((post) => post.category !== "مقالات");

  const latestArticle = articles[0];
  const previousPosts = normalPosts.slice(0, 6);

  return (
    <aside className="space-y-5">
      {/* بلوك المقالات */}
      <section className="overflow-hidden rounded-[28px] border border-[#c8a96b]/20 bg-white shadow-sm">
        <div className="border-b border-[#c8a96b]/15 bg-gradient-to-r from-[#0f3d75] to-[#14508f] px-4 py-3">
          <h2 className="text-center text-sm font-black tracking-wide text-white md:text-base">
            مقالات
          </h2>
        </div>

        <div className="p-4">
          {latestArticle ? (
            <Link
              href={`/article/${latestArticle.id}`}
              className="group block"
            >
              <div className="space-y-3">
                <h3 className="text-center text-base font-extrabold leading-7 text-slate-900 transition-colors group-hover:text-[#0f3d75] md:text-lg">
                  {latestArticle.title}
                </h3>

                {latestArticle.image_url ? (
                  <div className="overflow-hidden rounded-[22px]">
                    <img
                      src={latestArticle.image_url}
                      alt={latestArticle.title}
                      className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}

                {latestArticle.source ? (
                  <p className="text-center text-sm font-bold text-[#0f3d75]">
                    الكاتب: {latestArticle.source}
                  </p>
                ) : null}
              </div>
            </Link>
          ) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
              لا توجد مقالات حالياً
            </div>
          )}
        </div>
      </section>

      {/* بلوك المنشورات السابقة */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-center text-sm font-black tracking-wide text-[#0f3d75] md:text-base">
            منشورات سابقة
          </h2>
        </div>

        <div className="p-3">
          {previousPosts.length > 0 ? (
            <ul className="space-y-2">
              {previousPosts.map((post, index) => (
                <li key={post.id}>
                  <Link
                    href={`/article/${post.id}`}
                    className="group flex items-start gap-3 rounded-2xl px-3 py-2 transition hover:bg-slate-50"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f3d75] text-xs font-black text-white">
                      {index + 1}
                    </span>

                    <span className="line-clamp-2 text-sm font-bold leading-6 text-slate-800 transition-colors group-hover:text-[#0f3d75]">
                      {post.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
              لا توجد منشورات سابقة
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}