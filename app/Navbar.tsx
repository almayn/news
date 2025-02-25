// app/Navbar.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import ar from 'date-fns/locale/ar-SA';

export default function Navbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // تحديد النوع بشكل صريح

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedIsAdmin = localStorage.getItem('isAdmin'); // تعريف متغير مؤقت
      setIsAdmin(storedIsAdmin === 'true'); // معالجة القيم بشكل آمن
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
    router.push('/');
  };

  const formattedDate: string = format(new Date(), 'EEEE, d MMMM yyyy', { locale: ar });

  return (
    <nav className="bg-blue-600 text-white py-4 px-6 flex items-center justify-between">
      <Link href="/" title="الرئيسية" className="flex items-center">
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={70}
          height={70}
          className="rounded-full object-contain cursor-pointer"
        />
      </Link>

      <div className="flex gap-6">
        <Link href="/archive" title="الأرشيف">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white hover:text-gray-200 transition"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </Link>

        {isAdmin ? (
          <>
            <Link href="/admin" title="لوحة الإدارة">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white hover:text-gray-200 transition"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>

            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="text-white hover:text-gray-200 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </>
        ) : (
          <Link href="/login" title="تسجيل الدخول">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white hover:text-gray-200 transition"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </Link>
        )}
      </div>

      <div className="text-sm">{formattedDate}</div>
    </nav>
  );
}
