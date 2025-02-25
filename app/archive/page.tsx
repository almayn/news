// app/archive/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

interface NewsItem {
  id: string;
  title: string;
  subtitle?: string; // اختياري
  content: string;
  created_at: string;
}


export default function Archive() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching news:', error);
          alert('حدث خطأ أثناء جلب الأخبار.');
        } else {
          setNewsList((data as NewsItem[]) || []);
        }
      } catch (err) {
        console.error('Error in fetchNews:', err);
        alert('حدث خطأ أثناء جلب الأخبار.');
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="px-4 mt-6 mb-6">
      {/* عرض الأخبار */}
      {newsList.length === 0 ? (
        <p className="text-gray-500 text-center">لا توجد أخبار متاحة.</p>
      ) : (
        <div className="space-y-4">
          {newsList.map((news) => (
            <div key={news.id} className="bg-white p-4 rounded-lg shadow-md transition duration-300 hover:shadow-lg">
              {/* العنوان الصغير (إذا كان موجودًا) */}
              {news.subtitle && (
                <p className="text-blue-600 font-bold text-sm mb-1">{news.subtitle}</p>
              )}
              {/* العنوان الكبير */}
              <h3 className="text-xl font-bold text-blue-800 mb-2">{news.title}</h3>
              {/* سطر من النص */}
              <p className="text-gray-700 text-sm leading-relaxed">
                {news.content.slice(0, 100)}...{' '}
                <a href={`/archive/${news.id}`} className="text-blue-600 hover:text-blue-800">
                  المزيد
                </a>
              </p>
              {/* صف يحتوي على كلمة "الماس" وتاريخ النشر */}
              <div className="flex items-center justify-between mt-2">
                {/* كلمة "الماس" */}
                <div className="text-xs text-blue-500 font-semibold">الماس</div>
                {/* تاريخ النشر */}
                <div className="text-xs text-gray-500">
                  {new Date(news.created_at).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}