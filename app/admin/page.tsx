// app/admin/page.tsx
'use client'; // تحويل الملف إلى Client Component
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // حالة التحميل
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = () => {
      if (typeof window !== 'undefined') {
        const adminStatus =
          localStorage.getItem('isAdmin') || sessionStorage.getItem('isAdmin');
        console.log('Admin status:', adminStatus);
        setIsAdmin(adminStatus === 'true');
        setIsLoading(false); // إنهاء التحميل
      }
    };

    // تأخير التحقق لتجنب المشاكل المحتملة
    const timer = setTimeout(() => {
      checkAdmin();
    }, 500);

    // إضافة Listener للتحديث عند تغيير localStorage
    window.addEventListener('storage', checkAdmin);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', checkAdmin);
    };
  }, []);

  // ✅ التحقق من حالة المشرف وإعادة التوجيه
  if (isLoading) {
    return <p>جارٍ التحقق من حالة تسجيل الدخول...</p>;
  }

  if (!isAdmin) {
    router.push('/login'); // استخدام router.push بدلاً من window.location.href
    return null;
  }

  // ✅ بقية الكود كما هو
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setMessage('يرجى ملء جميع الحقول.');
      return;
    }

    try {
      let imageUrl = '';
      if (image) {
        // التحقق من أن الملف هو صورة
        if (!image.type.startsWith('image/')) {
          setMessage('يرجى اختيار ملف صورة صالح.');
          return;
        }

        // إنشاء FormData وإضافة الصورة
        const formData = new FormData();
        formData.append('file', image);

        // استدعاء API Endpoint لمعالجة الصورة ورفعها
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (response.ok) {
          imageUrl = result.imageUrl;
          setMessage(
            `تم رفع الصورة بنجاح! الأبعاد الجديدة: ${result.dimensions.width}x${result.dimensions.height}`
          );
        } else {
          setMessage(result.error || 'حدث خطأ أثناء رفع الصورة.');
          return;
        }
      }

      // إضافة الخبر إلى الجدول
      const { error: insertError } = await supabase.from('news').insert([
        {
          title,
          subtitle,
          image_url: imageUrl,
          content,
        },
      ]);
      if (insertError) {
        console.error('Error inserting news:', insertError);
        setMessage('حدث خطأ أثناء إضافة الخبر.');
      } else {
        setMessage('تم إضافة الخبر بنجاح!');
        setTitle('');
        setSubtitle('');
        setImage(null);
        setContent('');
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setMessage('حدث خطأ غير متوقع.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
    } else {
      setMessage('يرجى اختيار ملف صورة صالح.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">إضافة خبر جديد</h1>
      {message && <p className="text-green-500 mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* عنوان الخبر الرئيسي */}
        <input
          type="text"
          placeholder="عنوان الخبر الرئيسي"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        {/* عنوان فرعي (اختياري) */}
        <input
          type="text"
          placeholder="عنوان فرعي (اختياري)"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        {/* رفع الصورة */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
        {/* نص الخبر */}
        <textarea
          placeholder="نص الخبر"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        ></textarea>
        {/* زر الإرسال */}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          إضافة الخبر
        </button>
      </form>
    </div>
  );
}