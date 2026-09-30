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

// 3. Generate comprehensive sitemap.xml
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
    { url: '/community', priority: '0.7', changefreq: 'daily' },
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
Bible Verse of the Day is a mobile-first, high-performance web and mobile app that delivers daily biblical devotionals, over 180+ contextualized Bible stories, Jesus's teachings from the Gospels, curated prayers across key categories, and complete New International Version (NIV) Bible chapter readings.

## Key Sections
- [Daily Verse & Devotional](${baseUrl}/): Today's curated scripture verse, deep reflection, guided prayer, and practical life application.
- [Verse Archive](${baseUrl}/archive): Historical archive of past daily verses organized by month (2025 - 2026).
- [Bible Stories](${baseUrl}/stories): Over 180 narrative Bible stories complete with tags (Prophecy, Faith, Miracles, Kings, Jesus), reflections, and prayers.
- [Prayer Library](${baseUrl}/prayers): Prayers categorized by Morning, Evening, Healing, Strength, Thanksgiving, Protection, Forgiveness, and Family.
- [Jesus Teachings](${baseUrl}/teachings): Core teachings and parables of Jesus Christ recorded in the Gospels.
- [Read the Bible](${baseUrl}/bible): Complete NIV Bible reader by book and chapter.
- [Community Creations](${baseUrl}/community): Verse art and studio creations shared by the global faith community.

## Technical Specifications
- Built with: React 18, Vite, TypeScript, Tailwind CSS, Firebase RTDB & Firestore.
- API / Data Endpoints: Public JSON datasets for offline reading and static indexing at ${baseUrl}/stories.json.
- Open Graph, JSON-LD schema (Article, WebSite, CollectionPage, Organization) on all primary pages.
`

  fs.writeFileSync(path.resolve(publicDir, 'llms.txt'), llmsContent)
  fs.writeFileSync(path.resolve(publicDir, 'llms-full.txt'), llmsContent)
  console.log('✅ Generated llms.txt and llms-full.txt for Agentic Browsing')
}

// 5. Generate a lightweight stories payload for the home page
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
  generateSitemap()
  generateLlmsTxt()
  generateFeaturedStories()
}

main().catch(console.error)
