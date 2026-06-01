/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // يتعطل فقط في بيئة التطوير لتسهيل العمل ويشتغل عند الـ Build
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // لدعم سحب صور المنتجات من الـ Supabase Storage بأمان
      },
    ],
  },
};

module.exports = withPWA(nextConfig);