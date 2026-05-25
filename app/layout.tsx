import type { Metadata, Viewport } from 'next'
import { Amiri, Noto_Sans_Arabic, Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { ConciergeButton } from '@/components/ai/ConciergeChat'

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
})

const noto = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FLORÉ Luxury | فلوري - الفخامة في كل تفصيلة',
  description: 'بوكيهات فاخرة بتصاميم حصرية، توصيل سريع في عمّان. اكتشف مجموعتنا الفريدة من الزهور والهدايا الفاخرة.',
  keywords: ['زهور', 'بوكيه', 'فاخر', 'عمّان', 'أردن', 'هدايا', 'توصيل', 'ورد', 'مناسبات'],
  authors: [{ name: 'FLORÉ Luxury' }],
  creator: 'FLORÉ Luxury',
  publisher: 'FLORÉ Luxury',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_JO',
    url: 'https://flore.jo',
    siteName: 'FLORÉ Luxury',
    title: 'FLORÉ Luxury | فلوري - الفخامة في كل تفصيلة',
    description: 'بوكيهات فاخرة بتصاميم حصرية، توصيل سريع في عمّان.',
    images: [
      {
        url: 'https://flore.jo/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'FLORÉ Luxury - فلوري',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FLORÉ Luxury | فلوري',
    description: 'بوكيهات فاخرة بتصاميم حصرية في عمّان',
    images: ['https://flore.jo/images/og-default.jpg'],
    creator: '@flore_luxury',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://flore.jo',
    languages: {
      'ar-JO': 'https://flore.jo',
      'en-JO': 'https://flore.jo/en',
    },
  },
  category: 'ecommerce',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF9F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1F1E' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      dir="rtl"
      lang="ar"
      suppressHydrationWarning
      className={`${amiri.variable} ${noto.variable} ${playfair.variable} ${inter.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FLORÉ" />
        <meta name="format-detection" content="telephone=no" />
        <script
          type="module"
          src="https://unpkg.com/@google/model-viewer@^3.5.0/dist/model-viewer.min.js"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((reg) => console.log('SW registered:', reg.scope))
                    .catch((err) => console.log('SW registration failed:', err));
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-noto bg-flore-bg text-flore-text-primary antialiased">
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <Navbar />
          <main className="min-h-screen pt-20 pb-20 md:pb-0">
            {children}
          </main>
          <ConciergeButton />
          <BottomNav />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}