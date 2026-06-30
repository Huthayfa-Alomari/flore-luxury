/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: false,
  clientsClaim: true,
});

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  disable: process.env.NODE_ENV === "development", // يتعطل فقط في بيئة التطوير لتسهيل العمل ويشتغل عند الـ Build
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
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