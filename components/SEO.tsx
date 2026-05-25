import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonical?: string
  noIndex?: boolean
}

export function SEO({
  title = 'FLORÉ Luxury | فلوري - الفخامة في كل تفصيلة',
  description = 'بوكيهات فاخرة بتصاميم حصرية، توصيل سريع في عمّان. اكتشف مجموعتنا الفريدة من الزهور والهدايا الفاخرة.',
  keywords = 'زهور, بوكيه, فاخر, عمّان, أردن, هدايا, توصيل, ورد, مناسبات, خطوبة, زفاف',
  ogImage = '/images/og-default.jpg',
  ogType = 'website',
  canonical,
  noIndex = false,
}: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flore.jo'
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="FLORÉ Luxury" />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ar_JO" />
      <meta property="og:site_name" content="FLORÉ Luxury" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Arabic / Jordan specific */}
      <meta name="geo.region" content="JO" />
      <meta name="geo.placename" content="Amman" />
      <meta name="ICBM" content="31.9454, 35.9284" />

      {/* PWA */}
      <meta name="theme-color" content="#0D5C63" />
      <meta name="msapplication-TileColor" content="#0D5C63" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="FLORÉ" />

      {/* Structured Data - LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Florist',
            name: 'FLORÉ Luxury - فلوري',
            description: 'بوكيهات فاخرة بتصاميم حصرية في عمّان',
            url: siteUrl,
            logo: `${siteUrl}/logo.svg`,
            image: fullOgImage,
            telephone: '+962-7-XXXX-XXXX',
            email: 'hello@flore.jo',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'عمّان',
              addressLocality: 'عمّان',
              addressRegion: 'عمّان',
              addressCountry: 'JO',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 31.9454,
              longitude: 35.9284,
            },
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                opens: '09:00',
                closes: '21:00',
              },
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'Friday',
                opens: '14:00',
                closes: '21:00',
              },
            ],
            priceRange: '$$$',
            currenciesAccepted: 'JOD',
            paymentAccepted: 'Cash, Credit Card, CliQ',
            areaServed: {
              '@type': 'City',
              name: 'Amman',
            },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Flower Bouquets',
              itemListElement: [
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Product',
                    name: 'Luxury Bouquets',
                  },
                },
              ],
            },
          }),
        }}
      />
    </Head>
  )
}