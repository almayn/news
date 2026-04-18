"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SecretEntryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/editor";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "فشل تسجيل الدخول");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setErrorMsg("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[linear-gradient(135deg,#0f172a,#0f3d75)] px-4 py-10"
      dir="rtl"
    >
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-[#0f3d75] to-[#14508f] px-6 py-5 text-center">
            <h1 className="text-2xl font-black text-white">دخول لوحة التحكم</h1>
            <p className="mt-2 text-sm font-medium text-blue-100">
              دخول خاص بإدارة أخبار الماس
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-right font-bold outline-none transition focus:border-[#0f3d75] focus:ring-4 focus:ring-blue-100"
                autoComplete="current-password"
              />
            </div>

            {errorMsg ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {errorMsg}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#0f3d75] px-4 py-3 text-sm font-black text-white transition hover:bg-[#14508f] disabled:opacity-60"
            >
              {loading ? "جارٍ التحقق..." : "دخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SecretEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[linear-gradient(135deg,#0f172a,#0f3d75)]" />
      }
    >
      <SecretEntryPageContent />
    </Suspense>
  );
}