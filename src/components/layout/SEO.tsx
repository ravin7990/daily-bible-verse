import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?:       string
  description?: string
  canonical?:   string
  ogType?:      'website' | 'article'
  ogImage?:     string
  noIndex?:     boolean
  jsonLd?:      object
}

const SITE_NAME = 'Bible Verse of the Day'
const BASE_URL  = import.meta.env.VITE_SITE_URL ?? 'https://ravin7990.github.io/daily-bible-verse'
const OG_IMAGE  = `${BASE_URL}/icons/icon-512.png`

export default function SEO({
  title,
  description = 'Start every day with God\'s Word. Daily Bible verse, reflection, prayer, and life application.',
  canonical,
  ogType = 'website',
  ogImage = OG_IMAGE,
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Daily Scripture & Reflection`
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type"        content={ogType} />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:image"       content={ogImage} />
      <meta property="og:site_name"   content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}
