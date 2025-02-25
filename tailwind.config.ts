/** @type {import('tailwindcss').Config} */
module.exports = {
  // تحديد الملفات التي سيتم مسحها بحثًا عن أنماط Tailwind
  content: [
    './app/**/*.{js,ts,jsx,tsx}', // لدعم App Router
    './pages/**/*.{js,ts,jsx,tsx}', // لدعم Pages Router (إذا كنت تستخدمه)
    './components/**/*.{js,ts,jsx,tsx}', // لدعم المكونات
  ],
  theme: {
    extend: {
      // إضافة خطوط مخصصة
      fontFamily: {
        sans: ['Arial', 'sans-serif'], // الخط الافتراضي
        serif: ['Georgia', 'serif'], // خط بديل
      },

      // إضافة ألوان مخصصة
      colors: {
        primary: '#1E40AF', // أزرق داكن (يمكن استخدامه للأزرار والعناوين)
        secondary: '#FBBF24', // أصفر (يمكن استخدامه للتوكيد)
        dark: '#1F2937', // رمادي داكن (للنصوص)
        light: '#F3F4F6', // رمادي فاتح (لخلفيات الأقسام)
      },

      // دعم اتجاه النص من اليمين إلى اليسار (RTL)
      direction: {
        rtl: 'rtl',
      },

      // تعديل الحدود والظلال
      boxShadow: {
        card: '0 4px 6px rgba(0, 0, 0, 0.1)', // ظل خفيف للمحتوى
      },
    },
  },
  plugins: [
    // إضافة دعم RTL باستخدام Plugin خارجي
    require('tailwindcss-rtl'),
  ],
};