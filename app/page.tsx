// app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [news, setNews] = useState<any[]>([]);
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true'; // التحقق من تسجيل الدخول

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching news:', error);
        } else {
          setNews(data || []);
        }
      } catch (err) {
        console.error('Error in fetchNews:', err);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="px-1 mt-1 mb-1"> {/* إزالة الحواف الجانبية والعليا والسفلية */}
      {/* عرض الأخبار */}
      {news.length === 0 ? (
        <p className="text-gray-500">لا توجد أخبار متاحة.</p>
      ) : (
        <div className="space-y-6">
          {/* عرض أول خبرين بالكامل */}
          {news.slice(0, 2).map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg shadow-md transition duration-300 hover:shadow-lg relative"
            >
              {/* العنوان الصغير (إذا كان موجودًا) */}
              {item.subtitle && (
                <p className="text-blue-600 font-bold text-base mb-2">{item.subtitle}</p>
              )}
              {/* العنوان الكبير كرابط */}
              <a href={`/archive/${item.id}`} className="block">
                <h3 className="text-2xl font-bold text-blue-800 hover:text-blue-600 transition duration-200">
                  {item.title}
                </h3>
              </a>
              {/* الصورة بتنسيق أفضل */}
              {item.image_url && (
                <div className="w-full h-[250px] bg-gray-100 mt-2 rounded-lg overflow-hidden flex justify-center items-center">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              {/* صف يحتوي على كلمة "الماس"، تاريخ النشر، وزر المشاركة والتحرير */}
              <div className="flex items-center justify-between mt-4">
                {/* كلمة "الماس" */}
                <div className="text-sm text-blue-500 font-semibold">الماس</div>
                {/* تاريخ النشر */}
                <div className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                {/* أزرار "مشاركة" و"تحرير" */}
                <div className="flex gap-4">
                  {/* زر المشاركة */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href); // نسخ الرابط الحالي
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
                      href={`/admin/edit/${item.id}`}
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

              {/* نص الخبر (جزء فقط مع رابط "المزيد") */}
              <p className="mt-2 text-gray-800 leading-relaxed text-justify">
                {item.content.slice(0, 200)}...{' '}
                <a href={`/archive/${item.id}`} className="text-blue-600 hover:text-blue-800">
                  المزيد
                </a>
              </p>
            </div>
          ))}
          {/* عرض بقية الأخبار كعناوين فقط */}
          {news.length > 2 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-700 mb-4">الأخبار السابقة:</h3>
              <ul className="space-y-2">
                {news.slice(2).map((item) => (
                  <li key={item.id}>
                    <a
                      href={`/archive/${item.id}`}
                      className="text-blue-600 hover:text-blue-800 transition duration-200"
                    >
                      🔹 {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}