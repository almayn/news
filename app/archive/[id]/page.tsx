// app/archive/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../../../lib/supabaseClient';

interface NewsItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export default function NewsDetails() {
  const [news, setNews] = useState<NewsItem | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const params = useParams();
  const id = params.id;

  // جلب تفاصيل الخبر والتحقق من تسجيل الدخول
  useEffect(() => {
    // التحقق من تسجيل الدخول
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }

    // جلب تفاصيل الخبر
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching news details:', error);
        } else {
          setNews(data);
        }
      } catch (err) {
        console.error('Error in fetchNews:', err);
      }
    };

    if (id) {
      fetchNews();
    }
  }, [id]);

  // في حالة عدم وجود خبر بعد التحميل
  if (!news) {
    return <p className="p-6">جارٍ تحميل التفاصيل...</p>;
  }

  return (
    <div className="px-1 mt-1 mb-1">
      <div className="bg-white p-4 rounded-lg shadow-md transition duration-300 hover:shadow-lg">
        {/* العنوان الصغير (إذا كان موجودًا) */}
        {news.subtitle && (
          <p className="text-blue-600 font-bold text-base mb-2">{news.subtitle}</p>
        )}

        {/* العنوان الكبير */}
        <h3 className="text-2xl font-bold text-blue-800">{news.title}</h3>

        {/* الصورة بتنسيق أفضل */}
        {news.image_url && (
          <div className="w-full h-[250px] bg-gray-100 mt-2 rounded-lg overflow-hidden flex justify-center items-center">
            <Image
              src={news.image_url}
              alt={news.title}
              width={600} // حدد العرض
              height={400} // حدد الارتفاع
              className="object-contain"
              priority // لضمان التحميل السريع للصورة الرئيسية
            />
          </div>
        )}

        {/* صف يحتوي على كلمة "الماس"، تاريخ النشر، وزر المشاركة والتحرير */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-blue-500 font-semibold">الماس</div>

          <div className="text-xs text-gray-500" style={{ direction: 'rtl' }}>
  {new Date(news.created_at).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/-/g, '/')}
</div>


          <div className="flex gap-4">
            {/* زر المشاركة */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('تم نسخ الرابط!');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C9.781 14.438 11.225 15 12 15c.775 0 2.219-.562 3.316-1.658M12 21l-4-4m0 0l4-4m-4 4V3"
                />
              </svg>
              شارك
            </button>

            {/* زر التحرير (يظهر فقط للمشرفين) */}
            {isAdmin && (
              <a
                href={`/admin/edit/${id}`}
                className="text-green-600 hover:text-green-800 font-semibold text-sm flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                تحرير
              </a>
            )}
          </div>
        </div>

        <p className="mt-2 text-gray-800 leading-relaxed text-justify">
          {news.content}
        </p>
      </div>
    </div>
  );
}
