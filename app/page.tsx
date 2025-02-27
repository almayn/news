// app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';



interface NewsItem {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  content: string;
  created_at: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true'; // التحقق من تسجيل الدخول

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_news_with_iso_date');
    
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
    <div className="px-1 mt-1 mb-1">
      {news.length === 0 ? (
        <p className="text-gray-500">لا توجد أخبار متاحة.</p>
      ) : (
        <div className="space-y-6">
          {news.slice(0, 2).map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg shadow-md transition duration-300 hover:shadow-lg relative"
            >
              {item.subtitle && (
                <p className="text-blue-600 font-bold text-base mb-2">{item.subtitle}</p>
              )}
              <a href={`/archive/${item.id}`} className="block">
                <h3 className="text-2xl font-bold text-blue-800 hover:text-blue-600 transition duration-200">
                  {item.title}
                </h3>
              </a>
              {item.image_url && (
  <div className="w-full h-[250px] bg-gray-100 mt-2 rounded-lg overflow-hidden flex justify-center items-center shadow-md border border-gray-200">
    <Image
      src={item.image_url}
      alt={item.title}
      width={600}
      height={400}
      className="object-cover rounded-md"
      priority
    />
  </div>
)}

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-blue-500 font-semibold">الماس</div>
                <div className="text-xs text-gray-500" style={{ direction: 'rtl' }}>
  {item.created_at.replace('T', ' |').replace('Z', '')}
</div>






                <div className="flex gap-4">
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
