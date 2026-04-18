"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Props {
  articleId: string;
}

export default function AdminEditButton({ articleId }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin-status", {
          cache: "no-store",
        });

        const data = await res.json();
        setIsAdmin(!!data?.isAdmin);
      } catch (error) {
        console.error("Admin status error:", error);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdmin();
  }, []);

  if (isChecking || !isAdmin) return null;

  return (
    <Link
      href={`/editor?id=${articleId}`}
      className="inline-flex items-center justify-center rounded-2xl bg-[#0f3d75] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#14508f]"
    >
      تعديل الخبر
    </Link>
  );
}