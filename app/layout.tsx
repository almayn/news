// app/layout.tsx
import './globals.css';
import Navbar from './Navbar';

export const metadata = {
  title: 'موقع الأخبار',
  description: 'موقع إخباري يعرض أحدث الأخبار والأرشيف.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-noto-naskh-arabic-ui bg-gray-100">
        {/* الناف بار */}
        <Navbar />

        {/* محتوى الصفحة */}
        <main className="container mx-auto p-6">{children}</main>

        {/* الفوتر */}
        <footer className="bg-gray-800 text-white py-6 px-4 text-center">
          <p>جميع الحقوق محفوظة &copy; 2023</p>
          <a href="/privacy-policy" className="text-blue-300 hover:underline">
            سياسة الخصوصية
          </a>
        </footer>
      </body>
    </html>
  );
}