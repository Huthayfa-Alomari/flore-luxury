/** @type {import('next').NextConfig} */
const nextConfig = {
  // 💡 قم بتعليق هذا السطر أو حذفه لأن Vercel لا يحتاجه
  // output: 'standalone', 
  images: {
    domains: ['images.unsplash.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/studio', destination: '/atelier', permanent: true },
    ]
  },
}

module.exports = nextConfig