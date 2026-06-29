/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: false, // عدم إجبار التطبيق على التحديث الفوري لحماية جلسة العميل أثناء الدفع
  clientsClaim: true,
});

const nextConfig = {
  reactStrictMode: true, // تفعيل الوضع الصارم لاكتشاف أخطاء الـ Rendering والتسريبات البرمجية مبكراً
  poweredByHeader: false, // حماية أمنية: إخفاء ترويسة X-Powered-By لمنع المهاجمين من معرفة استخدامك لـ Next.js

  disable: process.env.NODE_ENV === "development", // يتعطل فقط في بيئة التطوير لتسهيل العمل ويشتغل عند الـ Build
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // تقييد جلب الصور فقط من نطاق ميديا وباقات Supabase الخاصة بك
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // حقن ترويسات الأمان الصارمة (Security Headers) لبيئة الإنتاج
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // منع المتصفح من تخمين نوع الملفات (MIME-sniffing) لمنع تشغيل السكربتات الخبيثة
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // حماية ضد هجمات Clickjacking (يمنع تضمين موقعك داخل iFrame خارجي)
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // حماية خصوصية بيانات الروابط المرجعية عند الانتقال لبوابات الدفع
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload', // فرض اتصال HTTPS مشفر وصارم طوال العام
          },
        ],
      },
    ];
        hostname: '**', // لدعم سحب صور المنتجات من الـ Supabase Storage بأمان
      },
    ],
  },
};

module.exports = withPWA(nextConfig);