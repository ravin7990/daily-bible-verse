import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.resolve(rootDir, 'public')
const iconsDir = path.resolve(publicDir, 'icons')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// 1. Generate crisp vector SVG for PWA and favicon
//    Palette matches the new ink/gold brand tokens in tailwind.config.ts.
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2f3c52" />
      <stop offset="100%" stop-color="#0d1523" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.25" />
    </filter>
  </defs>
  <!-- Background with rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#grad)" />

  <!-- Latin cross with subtle bevel and shadow -->
  <g filter="url(#shadow)">
    <!-- Vertical beam -->
    <rect x="226" y="96" width="60" height="320" rx="12" fill="#ffffff" />
    <!-- Horizontal beam -->
    <rect x="136" y="180" width="240" height="60" rx="12" fill="#ffffff" />
    <!-- Gold accent center radiant ray -->
    <circle cx="256" cy="210" r="16" fill="#e8c062" />
  </g>
</svg>`

fs.writeFileSync(path.resolve(iconsDir, 'icon.svg'), svgIcon)
fs.writeFileSync(path.resolve(publicDir, 'favicon.svg'), svgIcon)

// 2. Render PNG icons from SVG using Sharp
async function generatePngs() {
  const svgBuffer = Buffer.from(svgIcon)

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve(iconsDir, 'icon-192.png'))

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve(iconsDir, 'icon-512.png'))

  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve(iconsDir, 'apple-touch-icon.png'))

  console.log('✅ Generated PWA and Apple touch icons (192, 512, 180, SVG)')
}

// 3. Generate the GitHub Pages SPA fallback (404.html)
//
//    GitHub Pages serves 404.html for ANY path it cannot resolve, and it does so
//    with an HTTP 404 status. The previous build overwrote dist/404.html with a
//    copy of dist/index.html, which meant every one of the 261 URLs in the
//    sitemap returned a 404 status to Google while rendering correctly in the
//    browser. Google reads the status, not the pixels, so none of those pages
//    could be indexed.
//
//    The fix is the standard SPA fallback: redirect the deep link to the app
//    root with the real path preserved after `/?/`, which returns HTTP 200.
//    pathSegmentsToKeep must equal the number of path segments in BASE_PATH, or
//    the app name is stripped from every route.
function generateSpaFallback() {
  const basePath = process.env.VITE_BASE_PATH || '/daily-bible-verse/'
  const segments = basePath.split('/').filter(Boolean).length

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Bible Verse of the Day</title>
    <script>
      // GitHub Pages has no rewrite rules, so a missing path is served this file.
      // Redirect to the app root with the original route preserved after "/?/",
      // which is then restored by the script in index.html. This returns HTTP
      // 200 for real content pages instead of 404.
      // Source: https://github.com/rafgraph/spa-github-pages
      var pathSegmentsToKeep = ${segments};
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body></body>
</html>
`
  fs.writeFileSync(path.resolve(publicDir, '404.html'), html)
  console.log(
    `✅ Generated SPA 404.html fallback (keeping ${segments} path segment` +
    `${segments === 1 ? '' : 's'} for base "${basePath}")`,
  )
}

// 4. Generate comprehensive sitemap.xml
function generateSitemap() {
  const baseUrl = process.env.VITE_SITE_URL || 'https://ravin7990.github.io/daily-bible-verse'
  const today = new Date().toISOString().slice(0, 10)

  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/archive', priority: '0.8', changefreq: 'daily' },
    { url: '/stories', priority: '0.9', changefreq: 'weekly' },
    { url: '/prayers', priority: '0.8', changefreq: 'weekly' },
    { url: '/teachings', priority: '0.8', changefreq: 'weekly' },
    { url: '/bible', priority: '0.7', changefreq: 'monthly' },
    { url: '/plans', priority: '0.8', changefreq: 'monthly' },
    { url: '/community', priority: '0.7', changefreq: 'daily' },

    // Trust pages. Google AdSense reviewers expect to find these reachable, and
    // a privacy policy has to be declared in the AdSense console anyway.
    { url: '/about', priority: '0.3', changefreq: 'yearly' },
    { url: '/contact', priority: '0.3', changefreq: 'yearly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },

    // /account is deliberately excluded: it is user-specific and noIndex.
    // /settings is deliberately excluded: it holds per-device preferences.
  ]

  let stories = []
  try {
    const storiesPath = path.resolve(publicDir, 'stories.json')
    if (fs.existsSync(storiesPath)) {
      stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'))
    }
  } catch (err) {
    console.warn('Could not read stories for sitemap:', err)
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

  for (const route of staticRoutes) {
    xml += `  <url>\n`
    xml += `    <loc>${baseUrl}${route.url}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`
    xml += `    <priority>${route.priority}</priority>\n`
    xml += `  </url>\n`
  }

  for (const story of stories) {
    const slug = slugify(story.title)
    xml += `  <url>\n`
    xml += `    <loc>${baseUrl}/stories/${story.id}/${slug}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += `    <changefreq>monthly</changefreq>\n`
    xml += `    <priority>0.7</priority>\n`
    xml += `  </url>\n`
  }

  xml += `</urlset>\n`

  fs.writeFileSync(path.resolve(publicDir, 'sitemap.xml'), xml)
  console.log(`✅ Generated sitemap.xml with ${staticRoutes.length + stories.length} URLs`)
}

// 4. Generate llms.txt & llms-full.txt for Agentic Browsing (Lighthouse / PageSpeed AI agent index)
function generateLlmsTxt() {
  const baseUrl = process.env.VITE_SITE_URL || 'https://ravin7990.github.io/daily-bible-verse'

  const llmsContent = `# Bible Verse of the Day
> Daily Scripture, Reflection, Prayer, and Life Application from the Word of God.

## Overview
Bible Verse of the Day is a mobile-first devotional site and app. It offers a daily
biblical devotional, over 250 contextualised Bible stories with reflections and
prayers, Jesus's teachings from the Gospels, curated prayers by category, guided
reading plans, and a complete 66-book Bible reader.

## Bible translations
The reader offers the World English Bible, King James Version, American Standard
Version (1901), Reina-Valera 1909 (Spanish), the Berean Standard Bible and the
Hindi Bible. Public-domain translations are free to reuse; the Berean Standard
Bible and the Hindi Bible remain the property of their respective copyright
holders and are displayed with attribution. Per-translation licence details are on
the /privacy page.

## Key Sections
- [Daily Verse & Devotional](${baseUrl}/): Today's curated scripture verse, deep reflection, guided prayer, and practical life application.
- [Verse Archive](${baseUrl}/archive): Historical archive of past daily verses organised by month.
- [Bible Stories](${baseUrl}/stories): Narrative Bible stories with tags (Prophecy, Faith, Miracles, Kings, Jesus), reflections, and prayers.
- [Prayer Library](${baseUrl}/prayers): Prayers categorised by Morning, Evening, Healing, Strength, Thanksgiving, Protection, Forgiveness, and Family.
- [Jesus Teachings](${baseUrl}/teachings): Core teachings and parables of Jesus Christ recorded in the Gospels.
- [Read the Bible](${baseUrl}/bible): Complete Bible reader by book and chapter, in multiple translations.
- [Reading Plans](${baseUrl}/plans): Guided multi-day reading plans.
- [Verse Wallpapers](${baseUrl}/community): Shareable devotional backgrounds.

## About and policies
- [About](${baseUrl}/about): Who we are and how the content is produced.
- [Contact](${baseUrl}/contact): How to reach us.
- [Privacy Policy](${baseUrl}/privacy): What data is collected, including advertising cookies.
- [Terms of Use](${baseUrl}/terms): The terms governing use of this site.

## Technical Specifications
- Built with: React 19, Vite, TypeScript, Tailwind CSS, Firebase RTDB & Firestore.
- Public JSON datasets for offline reading at ${baseUrl}/stories.json.
- Open Graph and JSON-LD schema on all primary pages.
`

  fs.writeFileSync(path.resolve(publicDir, 'llms.txt'), llmsContent)
  fs.writeFileSync(path.resolve(publicDir, 'llms-full.txt'), llmsContent)
  console.log('✅ Generated llms.txt and llms-full.txt for Agentic Browsing')
}

// 4. Generate a lightweight stories payload for the home page
//    stories.json is ~920 kB because every entry embeds its full story body.
//    The home page only renders six cards, so it fetches this slimmed file
//    (~2 kB) instead. Regenerated on every build so it can never drift.
function generateFeaturedStories() {
  const storiesPath = path.resolve(publicDir, 'stories.json')
  if (!fs.existsSync(storiesPath)) {
    console.warn('⚠️  stories.json not found; skipping stories-featured.json')
    return
  }

  const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'))
  const FEATURED_COUNT = 6
  // Only the fields StoryCard actually renders.
  const featured = stories.slice(0, FEATURED_COUNT).map(
    ({ id, title, tag, summary, read_time, scripture }) => ({
      id, title, tag, summary, read_time, scripture,
    }),
  )

  const out = path.resolve(publicDir, 'stories-featured.json')
  fs.writeFileSync(out, JSON.stringify(featured))
  const savedKb = (
    (fs.statSync(storiesPath).size - fs.statSync(out).size) / 1024
  ).toFixed(0)
  console.log(
    `✅ Generated stories-featured.json (${featured.length} stories, ~${savedKb} kB saved on home page)`,
  )
}

async function main() {
  await generatePngs()
  generateSpaFallback()
  generateSitemap()
  generateLlmsTxt()
  generateFeaturedStories()
}

main().catch(console.error)
