import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "أخبار الماس | الفخامة في الخبر",
  description: "نصيغ الخبر بدقة الألماس ونقدمه بفخامة تليق بك",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-gray-50 text-gray-900`}>
        <SiteHeader />

        {children}

        <footer className="mt-20 border-t bg-white py-8 text-center text-sm font-medium text-gray-500">
          جميع الحقوق محفوظة لمنصة أخبار الماس © {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}