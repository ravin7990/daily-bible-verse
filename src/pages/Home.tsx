import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEO from '@/components/layout/SEO'
import VerseCard from '@/components/ui/VerseCard'
import StoryCard from '@/components/ui/StoryCard'
import { VerseCardSkeleton, StoryCardSkeleton } from '@/components/ui/Skeleton'
import { fetchDailyContent, todayStr } from '@/utils/dateUtils'
import { websiteSchema, dailyVerseSchema } from '@/utils/structuredData'
import type { DailyContent, Story } from '@/types'

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://ravin7990.github.io/daily-bible-verse'

export default function Home() {
  const [content, setContent]               = useState<DailyContent | null>(null)
  const [loading, setLoading]               = useState(true)
  const [featuredStories, setFeatured]      = useState<Story[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const today = todayStr()

  useEffect(() => {
    fetchDailyContent(today).then((data: DailyContent | null) => {
      setContent(data)
      setLoading(false)
    })
    // Fetch only first 6 stories lazily
    fetch(`${import.meta.env.BASE_URL}stories.json`)
      .then(r => r.json())
      .then((data: Story[]) => { setFeatured(data.slice(0, 6)); setStoriesLoading(false) })
      .catch(() => setStoriesLoading(false))
  }, [today])

  const jsonLd = content
    ? [websiteSchema(SITE_URL), dailyVerseSchema(content, `${SITE_URL}/`)]
    : [websiteSchema(SITE_URL)]

  return (
    <>
      <SEO
        title="Daily Bible Verse & Reflection"
        description="Start your day with God's Word. Get today's Bible verse, devotional reflection, daily prayer, and life application — free every day."
        canonical="/"
        jsonLd={jsonLd[0]}
      />

      <main id="main-content">
        {/* ── Hero ── */}
        <section
          aria-label="Today's Bible Verse"
          className="bg-gradient-to-b from-sacred-700 via-sacred-600 to-sacred-500 text-white py-12 sm:py-16 px-4"
        >
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sacred-200 text-sm font-semibold uppercase tracking-widest mb-3">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-4 text-balance">
              Today's Bible Verse
            </h1>
            {loading ? (
              <div className="animate-pulse space-y-2 mt-6">
                <div className="h-4 bg-white/20 rounded mx-auto w-3/4" />
                <div className="h-4 bg-white/20 rounded mx-auto w-full" />
                <div className="h-4 bg-white/20 rounded mx-auto w-5/6" />
              </div>
            ) : content ? (
              <>
                <p className="font-serif text-xl sm:text-2xl italic font-medium leading-relaxed text-white/95 mt-4">
                  "{content.verse_of_the_day.text}"
                </p>
                <p className="mt-3 text-gold-300 font-semibold">
                  — {content.verse_of_the_day.reference}
                </p>
              </>
            ) : (
              <p className="text-white/70 mt-4">No verse available for today.</p>
            )}
          </div>
        </section>

        {/* ── Daily Content Card ── */}
        <section className="max-w-2xl mx-auto px-4 -mt-6 mb-12" aria-label="Daily devotional">
          {loading ? (
            <VerseCardSkeleton />
          ) : content ? (
            <VerseCard content={content} isToday />
          ) : (
            <div className="card p-6 text-center text-gray-500">
              <p>No devotional content found for today.</p>
              <Link to="/archive" className="btn-primary mt-4 mx-auto w-fit">
                Browse Archive
              </Link>
            </div>
          )}
        </section>

        {/* ── Quick actions ── */}
        <section className="max-w-6xl mx-auto px-4 mb-12" aria-label="Quick navigation">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/archive',   icon: '📅', label: 'Past Verses',    desc: 'Browse archive' },
              { to: '/stories',   icon: '📖', label: 'Bible Stories',  desc: '180+ stories' },
              { to: '/prayers',   icon: '🙏', label: 'Prayers',        desc: 'Library of prayers' },
              { to: '/teachings', icon: '✝',  label: 'Teachings',      desc: 'Jesus teachings' },
            ].map(({ to, icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="card p-4 flex flex-col items-center text-center hover:shadow-md hover:border-sacred-200 hover:bg-sacred-50 transition-all duration-200 group"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform" aria-hidden="true">
                  {icon}
                </span>
                <span className="font-semibold text-sm text-gray-800">{label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Stories ── */}
        <section className="max-w-6xl mx-auto px-4 mb-16" aria-label="Featured Bible stories">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Bible Stories</h2>
            <Link to="/stories" className="text-sm text-sacred-600 font-semibold hover:text-sacred-700 transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {storiesLoading
              ? Array.from({ length: 6 }).map((_, i) => <StoryCardSkeleton key={i} />)
              : featuredStories.map(story => (
                  <StoryCard key={story.id} story={story} />
                ))
            }
          </div>
        </section>

        {/* ── App Download Banner ── */}
        <section className="bg-gradient-to-r from-gold-500 to-gold-600 py-8 px-4 mb-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-2xl font-bold text-white mb-2">Get the App</h2>
            <p className="text-white/90 text-sm mb-4">
              Never miss a daily verse. Download the app for offline access, widgets, and more.
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=com.bible.verseoftheday2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-gold-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              aria-label="Download Bible Verse of the Day on Google Play"
            >
              <span aria-hidden="true">📱</span> Download on Google Play
            </a>
          </div>
        </section>
      </main>
    </>
  )
}
