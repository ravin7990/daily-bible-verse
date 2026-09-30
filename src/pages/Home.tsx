import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEO from '@/components/layout/SEO'
import VerseCard from '@/components/ui/VerseCard'
import StoryCard from '@/components/ui/StoryCard'
import { VerseCardSkeleton, StoryCardSkeleton } from '@/components/ui/Skeleton'
import { fetchDailyContent, todayStr } from '@/utils/dateUtils'
import { websiteSchema, dailyVerseSchema } from '@/utils/structuredData'
import { fetchDailyBackgroundUri } from '@/firebase/storage'
import type { DailyContent, Story } from '@/types'

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://ravin7990.github.io/daily-bible-verse'
const BASE = import.meta.env.BASE_URL || '/'

interface FeaturedWallpaper {
  id: string
  title: string
  category: string
  url: string
}

export default function Home() {
  const [content, setContent]               = useState<DailyContent | null>(null)
  const [loading, setLoading]               = useState(true)
  const [featuredStories, setFeatured]      = useState<Story[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [heroBgUrl, setHeroBgUrl]           = useState<string>(`${BASE}images/daily_hero_bg.webp`)
  const [lightboxImage, setLightboxImage]   = useState<string | null>(null)
  const [copied, setCopied]                 = useState(false)
  const [isPlaying, setIsPlaying]           = useState(false)

  const today = todayStr()

  useEffect(() => {
    fetchDailyContent(today).then((data: DailyContent | null) => {
      setContent(data)
      setLoading(false)
    })

    // Fetch dynamic date-based background if available from Firebase Storage
    fetchDailyBackgroundUri(today).then(url => {
      if (url) setHeroBgUrl(url)
    })

    // Fetch first 6 stories
    fetch(`${BASE}stories.json`)
      .then(r => r.json())
      .then((data: Story[]) => {
        setFeatured(data.slice(0, 6))
        setStoriesLoading(false)
      })
      .catch(() => setStoriesLoading(false))
  }, [today])

  function handleCopy() {
    if (!content) return
    const text = `"${content.verse_of_the_day.text}" — ${content.verse_of_the_day.reference}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    if (!content) return
    const text = `"${content.verse_of_the_day.text}" — ${content.verse_of_the_day.reference}`
    if (navigator.share) {
      navigator.share({
        title: `${content.verse_of_the_day.reference} | Bible Verse of the Day`,
        text: `${text}\n\nRead daily verses and download wallpapers at ${window.location.origin}`,
      }).catch(() => {})
    } else {
      handleCopy()
    }
  }

  function toggleSpeech() {
    if (!content || !('speechSynthesis' in window)) return

    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(
      `${content.verse_of_the_day.reference}. ${content.verse_of_the_day.text}. Reflection: ${content.reflection.content}`
    )
    utterance.rate = 0.95
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    setIsPlaying(true)
    window.speechSynthesis.speak(utterance)
  }

  const jsonLd = content
    ? [websiteSchema(SITE_URL), dailyVerseSchema(content, `${SITE_URL}/`)]
    : [websiteSchema(SITE_URL)]

  // Curated showcase wallpapers available offline & instant
  const showcaseWallpapers: FeaturedWallpaper[] = [
    {
      id: 'today-daily',
      title: "Today's Sacred Verse",
      category: 'Daily Verse',
      url: heroBgUrl,
    },
    {
      id: 'share-1',
      title: 'Grace & Truth',
      category: 'Grace',
      url: `${BASE}images/bg_share_1.png`,
    },
    {
      id: 'share-2',
      title: 'Peace in Prayer',
      category: 'Prayer',
      url: `${BASE}images/bg_share_2.png`,
    },
    {
      id: 'share-3',
      title: 'Everlasting Hope',
      category: 'Hope',
      url: `${BASE}images/bg_share_3.png`,
    },
  ]

  return (
    <>
      <SEO
        title="Daily Bible Verse, Devotional Wallpapers & Reflection"
        description="Start your day with God's Word. Today's Bible verse, sacred wallpapers, audio devotional, reflection, daily prayer, and 180+ Scripture stories."
        canonical="/"
        jsonLd={jsonLd[0]}
      />

      <main id="main-content">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            1. BREATHTAKING SACRED HERO WITH AMBIENT BACKGROUND
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          aria-label="Today's Bible Verse Hero"
          className="relative min-h-[520px] sm:min-h-[580px] flex items-center justify-center text-white overflow-hidden py-16 px-4"
        >
          {/* Background Image Artwork */}
          <img
            src={heroBgUrl}
            alt="Sacred Bible verse background artwork"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.45] scale-105 transition-transform duration-1000 ease-out"
          />

          {/* Deep sacred gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-sacred-950/60 to-black/70 pointer-events-none" />

          {/* Golden radial ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center px-2">
            {/* Today's Date Pill */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-gold-300 mb-6 shadow-lg animate-fade-in">
              <span>✨</span>
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight drop-shadow-md">
              Verse of the Day
            </h1>

            {loading ? (
              <div className="animate-pulse space-y-3 max-w-xl mx-auto mt-4">
                <div className="h-5 bg-white/20 rounded-full w-3/4 mx-auto" />
                <div className="h-5 bg-white/20 rounded-full w-full mx-auto" />
                <div className="h-5 bg-white/20 rounded-full w-2/3 mx-auto" />
              </div>
            ) : content ? (
              <div className="space-y-5 animate-slide-up">
                {/* Quotation flourish */}
                <div className="text-4xl sm:text-5xl text-gold-400 font-serif opacity-80 leading-none select-none">
                  ❝
                </div>

                <blockquote className="font-serif text-xl sm:text-2xl md:text-3xl italic font-medium leading-relaxed text-white/95 text-balance max-w-2xl mx-auto drop-shadow">
                  "{content.verse_of_the_day.text}"
                </blockquote>

                {/* Golden citation pill */}
                <div>
                  <span className="inline-block bg-gold-500/20 backdrop-blur-sm border border-gold-400/40 text-gold-300 font-semibold text-sm sm:text-base px-4 py-1.5 rounded-full tracking-wider shadow">
                    — {content.verse_of_the_day.reference}
                  </span>
                </div>

                {/* Hero Quick-Action Toolbar */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                  {'speechSynthesis' in window && (
                    <button
                      onClick={toggleSpeech}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md border transition-all ${
                        isPlaying
                          ? 'bg-sacred-500 text-white border-sacred-400 ring-2 ring-gold-400'
                          : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                      }`}
                      aria-label={isPlaying ? 'Stop audio' : 'Listen to Scripture audio'}
                    >
                      <span>{isPlaying ? '⏹️' : '🔊'}</span>
                      <span>{isPlaying ? 'Stop' : 'Listen'}</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all"
                  >
                    <span>{copied ? '✓' : '📋'}</span>
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all"
                  >
                    <span>↗️</span>
                    <span>Share</span>
                  </button>

                  <button
                    onClick={() => setLightboxImage(heroBgUrl)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gold-500 hover:bg-gold-600 text-gray-950 font-bold shadow-lg shadow-gold-500/25 transition-all"
                  >
                    <span>🖼️</span>
                    <span>Wallpaper</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-white/70 mt-4">No verse available for today.</p>
            )}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            2. TODAY'S DEVOTIONAL & WALLPAPER CARD
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="max-w-3xl mx-auto px-4 -mt-10 mb-14 relative z-20" aria-label="Daily devotional details">
          {loading ? (
            <VerseCardSkeleton />
          ) : content ? (
            <VerseCard content={content} isToday />
          ) : (
            <div className="card p-8 text-center text-gray-500">
              <p>No devotional content found for today.</p>
              <Link to="/archive" className="btn-primary mt-4 mx-auto w-fit">
                Browse Verse Archive
              </Link>
            </div>
          )}
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. FEATURED SCRIPTURE WALLPAPERS (NEW VISUAL SECTION)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="max-w-6xl mx-auto px-4 mb-16" aria-label="Devotional wallpapers showcase">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sacred-600 uppercase tracking-widest mb-1">
                <span>🖼️</span> Wallpapers & Devotional Art
              </div>
              <h2 className="section-title">Sacred Scripture Wallpapers</h2>
              <p className="text-gray-500 text-sm mt-1">
                Inspiring devotional backgrounds and phone wallpapers from daily verses and sacred themes
              </p>
            </div>
            <Link
              to="/community"
              className="mt-3 sm:mt-0 text-sm font-semibold text-sacred-600 hover:text-sacred-800 flex items-center gap-1"
            >
              Explore All Wallpapers <span>→</span>
            </Link>
          </div>

          {/* Wallpaper Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {showcaseWallpapers.map(wp => (
              <div
                key={wp.id}
                className="group relative rounded-2xl overflow-hidden shadow-md bg-gray-900 border border-gray-100 cursor-pointer aspect-[3/4]"
                onClick={() => setLightboxImage(wp.url)}
              >
                <img
                  src={wp.url}
                  alt={wp.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Subtle bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Caption & Category */}
                <div className="absolute bottom-0 inset-x-0 p-3 text-white flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gold-500/90 text-gray-950 px-2 py-0.5 rounded-full inline-block mb-1">
                      {wp.category}
                    </span>
                    <h3 className="font-serif font-semibold text-sm line-clamp-1">{wp.title}</h3>
                  </div>
                  <span className="text-sm bg-white/20 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center shrink-0 group-hover:bg-gold-500 group-hover:text-gray-950 transition-colors">
                    ⬇
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Category Chips Bar */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-4">
            {['Faith', 'Grace', 'Hope', 'Love', 'Peace', 'Praise', 'Prayer', 'Strength', 'Past Daily Verses'].map(
              cat => (
                <Link
                  key={cat}
                  to="/community"
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-sacred-50 text-sacred-700 border border-sacred-200 hover:bg-sacred-600 hover:text-white transition-colors"
                >
                  {cat === 'Past Daily Verses' ? '📅 Past Daily Verses' : cat}
                </Link>
              )
            )}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. QUICK ACCESS DESTINATIONS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="max-w-6xl mx-auto px-4 mb-16" aria-label="Explore the Bible app">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                to: '/archive',
                icon: '📅',
                label: 'Verse Archive',
                desc: 'Past daily verses',
                accent: 'hover:border-sacred-300',
              },
              {
                to: '/community',
                icon: '🖼️',
                label: 'HD Wallpapers',
                desc: 'Themed scripture art',
                accent: 'hover:border-gold-300',
              },
              {
                to: '/stories',
                icon: '📖',
                label: '180+ Stories',
                desc: 'Old & New Testament',
                accent: 'hover:border-blue-300',
              },
              {
                to: '/bible',
                icon: '✝',
                label: 'Bible Reader',
                desc: 'All 66 sacred books',
                accent: 'hover:border-purple-300',
              },
            ].map(({ to, icon, label, desc, accent }) => (
              <Link
                key={to}
                to={to}
                className={`card p-5 flex flex-col items-center text-center transition-all duration-200 group hover:-translate-y-1 hover:shadow-lg ${accent}`}
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform" aria-hidden="true">
                  {icon}
                </span>
                <span className="font-semibold text-sm text-gray-900">{label}</span>
                <span className="text-xs text-gray-400 mt-1">{desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            5. FEATURED BIBLE STORIES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="max-w-6xl mx-auto px-4 mb-16" aria-label="Featured Bible stories">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sacred-600 uppercase tracking-widest mb-1">
                <span>📖</span> Scripture Narratives
              </div>
              <h2 className="section-title">Bible Stories & Narratives</h2>
            </div>
            <Link
              to="/stories"
              className="text-sm text-sacred-600 font-semibold hover:text-sacred-800 transition-colors"
            >
              Browse all 180+ stories →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {storiesLoading
              ? Array.from({ length: 6 }).map((_, i) => <StoryCardSkeleton key={i} />)
              : featuredStories.map(story => <StoryCard key={story.id} story={story} />)}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            6. SPIRITUAL SPOTLIGHT: PRAYER & TEACHING
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="max-w-6xl mx-auto px-4 mb-16" aria-label="Spiritual spotlight">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Prayer Spotlight */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg bg-sacred-900 text-white p-6 sm:p-8 flex flex-col justify-between min-h-[260px] group">
              <img
                src={`${BASE}images/bg_share_2.png`}
                alt="Prayer background"
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sacred-950 via-sacred-950/70 to-sacred-900/60 pointer-events-none" />

              <div className="relative z-10">
                <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-gold-300 mb-3">
                  🙏 Daily Prayer Focus
                </span>
                <h3 className="font-serif text-2xl font-bold mb-2">A Prayer for Peace & Guidance</h3>
                <p className="text-sm text-white/80 line-clamp-3 leading-relaxed">
                  "Lord, grant me the serenity to accept what I cannot change, courage to change the things I can, and
                  wisdom to know the difference. Walk with me today and guard my heart."
                </p>
              </div>

              <div className="relative z-10 pt-4">
                <Link
                  to="/prayers"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-300 hover:text-white uppercase tracking-wider"
                >
                  Explore All Prayers <span>→</span>
                </Link>
              </div>
            </div>

            {/* Jesus' Teaching Spotlight */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg bg-indigo-950 text-white p-6 sm:p-8 flex flex-col justify-between min-h-[260px] group">
              <img
                src={`${BASE}images/bg_share_3.png`}
                alt="Teachings of Jesus background"
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-indigo-950/70 to-indigo-900/60 pointer-events-none" />

              <div className="relative z-10">
                <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-gold-300 mb-3">
                  ✝ Words of Jesus Christ
                </span>
                <h3 className="font-serif text-2xl font-bold mb-2">The Sermon on the Mount</h3>
                <p className="text-sm text-white/80 line-clamp-3 leading-relaxed">
                  "Blessed are the pure in heart, for they will see God. Blessed are the peacemakers, for they will be
                  called children of God." — Matthew 5:8-9
                </p>
              </div>

              <div className="relative z-10 pt-4">
                <Link
                  to="/teachings"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-300 hover:text-white uppercase tracking-wider"
                >
                  Read Jesus' Teachings <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            7. MOBILE APP & WIDGET SHOWCASE WITH REAL PREVIEW
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="max-w-6xl mx-auto px-4 mb-16" aria-label="Mobile companion & widgets">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sacred-800 via-sacred-700 to-sacred-900 text-white p-6 sm:p-10 shadow-xl border border-sacred-600/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-gold-500/20 text-gold-300 border border-gold-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                  📱 Mobile & Desktop Experience
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                  Take God's Word With You Everywhere
                </h2>
                <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-6">
                  Enjoy daily lockscreen and home screen widgets, seamless offline scripture reading, custom verse
                  wallpapers, and uplifting devotionals every single morning.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.bible.verseoftheday2026"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-gray-950 font-bold px-5 py-3 rounded-2xl shadow-lg transition-transform hover:scale-105"
                  >
                    <span>📱</span>
                    <span>Download on Google Play</span>
                  </a>
                  <Link
                    to="/community"
                    className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-5 py-3 rounded-2xl border border-white/20 backdrop-blur-md transition-colors"
                  >
                    <span>🖼️</span>
                    <span>Explore Wallpapers</span>
                  </Link>
                </div>
              </div>

              {/* Real Widget Preview Image */}
              <div className="flex justify-center">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 max-w-[320px] group">
                  <img
                    src={`${BASE}images/widget_preview.jpeg`}
                    alt="Bible Verse of the Day lock screen and home widgets preview"
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2 inset-x-2 bg-black/60 backdrop-blur-md rounded-xl p-2 text-center text-xs text-white/90">
                    ✨ Daily Verse Home Screen Widgets
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          LIGHTBOX MODAL FOR WALLPAPER PREVIEW & DOWNLOAD
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Wallpaper Preview"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="w-full flex justify-between items-center max-w-4xl text-white">
            <span className="text-xs uppercase tracking-wider text-gold-300 font-semibold">
              ✨ Sacred Wallpaper Preview
            </span>
            <button
              onClick={() => setLightboxImage(null)}
              className="text-white hover:text-gray-300 text-3xl font-light p-2 leading-none"
              aria-label="Close wallpaper preview"
            >
              ✕
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center max-w-4xl max-h-[75vh] my-4"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Sacred Wallpaper High Definition"
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
            <a
              href={lightboxImage}
              download="sacred-bible-wallpaper.webp"
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 shadow-lg"
            >
              <span>⬇️</span> Download Free HD Wallpaper
            </a>
            <button
              onClick={() => setLightboxImage(null)}
              className="px-5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white text-sm hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
