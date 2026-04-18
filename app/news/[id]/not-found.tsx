import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
        <h2 className="mb-3 text-3xl font-black text-slate-900">
          الخبر غير موجود
        </h2>
        <p className="mb-6 text-slate-500">
          الرابط الذي فتحته غير صحيح أو أن الخبر تم حذفه.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-primary-600 px-6 py-3 font-black text-white transition hover:bg-primary-700"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}