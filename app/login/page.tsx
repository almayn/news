// app/login/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // بيانات تسجيل الدخول الثابتة (يمكن استبدالها بقاعدة بيانات مستخدمين)
    const validUsername = 'admin';
    const validPassword = 'password123';

    if (username === validUsername && password === validPassword) {
      try {
        localStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('isAdmin', 'true'); // إضافة هذا السطر للتأكد
        console.log('State saved successfully:', { isAdmin: true });
      } catch  {
        console.warn('LocalStorage غير مدعوم، سيتم استخدام SessionStorage.');
      }

      // إعادة التوجيه إلى لوحة التحكم
      router.push('/admin');
    } else {
      alert('اسم المستخدم أو كلمة المرور غير صحيحة.'); // ✅ استخدام alert بدلاً من error
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">تسجيل الدخول</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اسم المستخدم */}
          <input
            type="text"
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {/* كلمة المرور */}
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {/* زر تسجيل الدخول */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}