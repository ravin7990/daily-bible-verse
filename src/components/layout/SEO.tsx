import { Helmet } from 'react-helmet-async'
import { SITE_URL, SITE_NAME, ADSENSE_CLIENT } from '@/utils/siteConfig'

interface SEOProps {
  title?:       string
  description?: string
  canonical?:   string
  ogType?:      'website' | 'article'
  ogImage?:     string
  noIndex?:     boolean
  /** Also emitted as a self-referencing hreflang hint for crawlers. */
  lang?:        string
  jsonLd?:      object | object[]
}

const OG_IMAGE = `${SITE_URL}/icons/icon-512.png`

/** Join the site origin with a path without doubling or dropping slashes. */
function absUrl(path?: string): string {
  if (!path) return SITE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export default function SEO({
  title,
  description = "Start every day with God's Word. Daily Bible verse, reflection, prayer, and life application.",
  canonical,
  ogType = 'website',
  ogImage = OG_IMAGE,
  noIndex = false,
  lang = 'en',
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Daily Scripture & Reflection`
  const canonicalUrl = absUrl(canonical)
  // Structured data is an array so callers can pass a @graph and a node together
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang={lang} href={canonicalUrl} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type"        content={ogType} />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:image"       content={ogImage} />
      <meta property="og:image:width"  content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:image:alt"    content="Bible Verse of the Day" />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"     content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImage} />
      <meta name="twitter:image:alt"   content="Bible Verse of the Day" />

      {/* AdSense publisher tag. Emitted only once a real publisher ID is
          configured via VITE_ADSENSE_CLIENT — an empty or placeholder value
          would fail AdSense verification and look like broken ad markup. */}
      {ADSENSE_CLIENT && (
        <meta name="google-adsense-platform-account" content={ADSENSE_CLIENT} />
      )}

      {/* JSON-LD Structured Data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}
