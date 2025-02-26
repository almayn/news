// app/admin/edit/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';

export default function EditNews() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  // ✅ تعريف جميع Hooks أولاً
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // حالة التحميل
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  // ✅ التحقق من حالة المشرف
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

  // ✅ جلب بيانات الخبر
  useEffect(() => {
    if (!isAdmin) return; // لا نقوم بجلب البيانات إذا لم يكن المستخدم مشرفًا

    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          console.error('Error fetching news details:', error);
          router.push('/admin');
        } else {
          setTitle(data.title);
          setSubtitle(data.subtitle || '');
          setContent(data.content);
        }
      } catch (err) {
        console.error('Error in fetchNews:', err);
        router.push('/admin');
      }
    };
    fetchNews();
  }, [id, isAdmin, router]);

  // ✅ إعادة توجيه إذا لم يكن مشرفًا
  if (isLoading) {
    return <p>جارٍ التحقق من حالة تسجيل الدخول...</p>;
  }

  if (!isAdmin) {
    router.push('/login'); // استخدام router.push بدلاً من window.location.href
    return null;
  }

  // ✅ التعامل مع تحديث الخبر
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = '';
      if (image) {
        const fileName = image.name.replace(/\s+/g, '-');
        const { data, error: uploadError } = await supabase.storage
          .from('images')
          .upload(`${Date.now()}-${fileName}`, image);
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          setMessage('حدث خطأ أثناء رفع الصورة.');
          return;
        }
        imageUrl = supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl;
      }
      const { error: updateError } = await supabase
        .from('news')
        .update({
          title,
          subtitle,
          content,
          image_url: imageUrl || undefined,
        })
        .eq('id', id);
      if (updateError) {
        console.error('Error updating news:', updateError);
        setMessage('حدث خطأ أثناء تحديث الخبر.');
      } else {
        setMessage('تم تحديث الخبر بنجاح!');
        setTimeout(() => router.push('/admin'), 2000);
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setMessage('حدث خطأ غير متوقع.');
    }
  };

  // ✅ التعامل مع حذف الخبر
  const handleDelete = async () => {
    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذا الخبر؟');
    if (!confirmDelete) return;
    try {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) {
        console.error('Error deleting news:', error);
        setMessage('حدث خطأ أثناء حذف الخبر.');
      } else {
        setMessage('تم حذف الخبر بنجاح!');
        setTimeout(() => router.push('/admin'), 2000);
      }
    } catch (err) {
      console.error('Error in handleDelete:', err);
      setMessage('حدث خطأ غير متوقع.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">تحرير خبر</h1>
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
          onChange={(e) => setImage(e.target.files?.[0] || null)}
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
        {/* أزرار الإرسال والحذف */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            تعديل
          </button>
          <button
            onClick={handleDelete}
            className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            حذف
          </button>
        </div>
      </form>
    </div>
  );
}