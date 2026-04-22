"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        createTweet: (
          tweetId: string,
          element: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement>;
      };
    };
  }
}

type Props = {
  tweetUrl: string;
};

function extractTweetId(tweetUrl: string = ""): string | null {
  const match = tweetUrl.match(/\/status\/(\d+)/);
  return match ? match[1] : null;
}

export default function XEmbed({ tweetUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tweetId = extractTweetId(tweetUrl);

  useEffect(() => {
    if (!tweetId || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const renderTweet = () => {
      if (!window.twttr?.widgets?.createTweet || !container) return;

      container.innerHTML = "";

      window.twttr.widgets.createTweet(tweetId, container, {
        align: "center",
        lang: "ar",
        theme: "light",
        dnt: true,
      });
    };

    const existingScript = document.querySelector(
      'script[src="https://platform.twitter.com/widgets.js"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if ((window as any).twttr?.widgets?.createTweet) {
        renderTweet();
      } else {
        existingScript.addEventListener("load", renderTweet, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    script.onload = renderTweet;
    document.body.appendChild(script);
  }, [tweetId]);

  if (!tweetId) return null;

  return (
    <div className="mt-8">
      <div className="mb-3 text-center text-xs font-black text-slate-400">
        منشور من منصة X
      </div>

      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
        <div ref={containerRef} className="flex justify-center" />
      </div>

      
    </div>
  );
}