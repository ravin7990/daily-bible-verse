import type { DailyContent } from '@/types'
import { formatLongDate, todayStr } from '@/utils/dateUtils'
import { useState, useEffect, useId } from 'react'
import { fetchDailyBackgroundUri } from '@/utils/lazyBackground'
import { usePrefs, PREFS } from '@/auth/AuthProvider'
import Icon from '@/components/ui/Icon'
import clsx from 'clsx'

interface VerseCardProps {
  content: DailyContent
  isToday?: boolean
}

interface SectionProps {
  title: string
  content: string
  icon: 'scroll' | 'prayer' | 'leaf'
  defaultOpen?: boolean
}

/** A single labelled disclosure: reflection, prayer, or life application. */
function ExpandableSection({ title, content, icon, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()

  return (
    <div className="border-t border-parchment-200 first:border-t-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4
                     text-left hover:bg-parchment-100/70 transition-colors"
        >
          <span className="flex items-center gap-2.5 font-semibold text-ink-900 text-sm sm:text-base">
            <span
              aria-hidden="true"
              className="grid place-items-center w-7 h-7 rounded-full bg-gold-50 text-gold-700 shrink-0"
            >
              <Icon name={icon} className="w-4 h-4" />
            </span>
            {title}
          </span>
          <Icon
            name="chevronDown"
            className={clsx(
              'w-4 h-4 text-ink-400 shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
      </h3>
      <div
        id={id}
        hidden={!open}
        className="px-5 sm:px-6 pb-5 -mt-1 text-ink-700 text-sm sm:text-base
                   leading-[1.8] animate-fade-in"
      >
        {content}
      </div>
    </div>
  )
}

export default function VerseCard({ content, isToday = false }: VerseCardProps) {
  const [copied, setCopied]       = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bgUrl, setBgUrl]         = useState<string | null>(null)
  const [viewMode, setViewMode]   = useState<'card' | 'wallpaper'>('card')

  /* Saved verses live in LikedVersePreferences so they sync with the app.
     Previously this was a bare `saved_verses` key in localStorage. */
  const [likedPrefs, setLikedPrefs] = usePrefs(PREFS.LIKED_VERSES)
  const likedIds = Array.isArray(likedPrefs.liked_verse_ids)
    ? likedPrefs.liked_verse_ids
    : []
  const isSaved = likedIds.includes(content.id)

  /* Daily wallpaper background from Firebase Storage. Past/today only. */
  useEffect(() => {
    let isMounted = true
    const today = todayStr()
    if (content.date <= today) {
      fetchDailyBackgroundUri(content.date).then(url => {
        if (isMounted) setBgUrl(url)
      })
    } else {
      setBgUrl(null)
    }
    return () => {
      isMounted = false
    }
  }, [content.date])

  const verseText = `"${content.verse_of_the_day.text}" — ${content.verse_of_the_day.reference}`

  function handleCopy() {
    navigator.clipboard.writeText(verseText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `${content.verse_of_the_day.reference} | Bible Verse of the Day`,
        text: `${verseText}\n\nRead daily verses at ${window.location.origin}`,
      }).catch(() => {})
    } else {
      handleCopy()
    }
  }

  function toggleSpeech() {
    if (!('speechSynthesis' in window)) return

    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(
      `${content.verse_of_the_day.reference}. ${content.verse_of_the_day.text}. Reflection: ${content.reflection.content}`,
    )
    utterance.rate = 0.95
    utterance.onend   = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    setIsPlaying(true)
    window.speechSynthesis.speak(utterance)
  }

  function toggleSave() {
    // One-time migration from the old unscoped localStorage key.
    const next = likedIds.includes(content.id)
      ? likedIds.filter(id => id !== content.id)
      : [...likedIds, content.id]
    setLikedPrefs({ liked_verse_ids: next })
    try {
      localStorage.removeItem('saved_verses')
    } catch {
      // Ignore: the new store is already authoritative.
    }
  }
  return (
    <article className="card animate-slide-up overflow-hidden">
      {/* Date header + card/wallpaper switch */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3 bg-ink-800">
        <time
          dateTime={content.date}
          className="text-xs font-semibold uppercase tracking-eyebrow text-parchment-200 truncate"
        >
          {isToday && <span className="text-gold-300">Today · </span>}
          {formatLongDate(content.date)}
        </time>

        {bgUrl && (
          <div
            role="tablist"
            aria-label="Devotional view"
            className="inline-flex rounded-lg bg-ink-950/50 p-0.5 shrink-0"
          >
            {(['card', 'wallpaper'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize',
                  viewMode === mode
                    ? 'bg-parchment-100 text-ink-900'
                    : 'text-parchment-300 hover:text-white',
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wallpaper view */}
      {viewMode === 'wallpaper' && bgUrl && (
        <div className="bg-ink-950">
          <img
            src={bgUrl}
            alt={`Daily Bible verse wallpaper for ${content.date}, ${content.verse_of_the_day.reference}`}
            width={1024}
            height={1024}
            className="w-full h-auto max-h-[560px] object-contain mx-auto"
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-t border-ink-800">
            <div>
              <p className="text-xs text-ink-400 font-medium">Daily Verse Wallpaper</p>
              <p className="font-serif text-lg font-semibold text-gold-300">
                {content.verse_of_the_day.reference}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={bgUrl}
                target="_blank"
                rel="noreferrer"
                download={`verse-${content.date}.webp`}
                className="btn-gold !px-3 !py-2 text-xs"
              >
                <Icon name="download" className="w-4 h-4" />
                Download
              </a>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className="inline-flex items-center gap-1.5 !px-3 !py-2 text-xs font-medium
                           text-parchment-200 border border-ink-700 rounded-xl hover:bg-ink-800 transition-colors"
              >
                <Icon name="book" className="w-4 h-4" />
                Read
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Devotional view */}
      {viewMode === 'card' && (
        <>
          {bgUrl && (
            <button
              type="button"
              onClick={() => setViewMode('wallpaper')}
              className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-2.5
                         bg-gold-50 border-b border-gold-100 text-xs font-medium text-gold-900
                         hover:bg-gold-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Icon name="image" className="w-4 h-4 shrink-0" />
                View today's scripture wallpaper
              </span>
              <span className="flex items-center gap-1 font-semibold shrink-0">
                Show <Icon name="arrowRight" className="w-3.5 h-3.5" />
              </span>
            </button>
          )}

          {/* figure/blockquote so screen readers announce this as a quotation
              rather than loose body text. */}
          <figure className="px-5 sm:px-7 pt-6 pb-4">
            <blockquote>
              <p
                aria-hidden="true"
                className="font-serif text-5xl sm:text-6xl leading-none text-gold-300 select-none"
              >
                &ldquo;
              </p>
              <p className="verse-text text-balance">
                {content.verse_of_the_day.text}
              </p>
              <figcaption className="mt-4 flex items-center gap-3">
                <span aria-hidden="true" className="h-px w-8 bg-gold-400 shrink-0" />
                <cite className="not-italic font-sans text-sm font-semibold tracking-wide text-gold-800">
                  {content.verse_of_the_day.reference}
                </cite>
              </figcaption>
            </blockquote>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {'speechSynthesis' in window && (
                <button
                  type="button"
                  onClick={toggleSpeech}
                  aria-pressed={isPlaying}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors',
                    isPlaying
                      ? 'bg-gold-50 text-gold-900 border-gold-300'
                      : 'border-parchment-300 text-ink-700 hover:bg-parchment-100',
                  )}
                >
                  <Icon name={isPlaying ? 'stop' : 'volume'} className="w-4 h-4" />
                  {isPlaying ? 'Stop' : 'Listen'}
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                           border border-parchment-300 text-ink-700 hover:bg-parchment-100 transition-colors"
              >
                <Icon name={copied ? 'check' : 'copy'} className="w-4 h-4" />
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                           border border-parchment-300 text-ink-700 hover:bg-parchment-100 transition-colors"
              >
                <Icon name="share" className="w-4 h-4" />
                Share
              </button>

              <button
                type="button"
                onClick={toggleSave}
                aria-pressed={isSaved}
                className={clsx(
                  'sm:ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors',
                  isSaved
                    ? 'text-gold-800 border-gold-300 bg-gold-50'
                    : 'border-parchment-300 text-ink-700 hover:bg-parchment-100',
                )}
              >
                <Icon name="bookmark" className="w-4 h-4" />
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </figure>

          <div className="border-t border-parchment-200">
            <ExpandableSection
              title="Reflection"
              content={content.reflection.content}
              icon="scroll"
              defaultOpen={isToday}
            />
            <ExpandableSection
              title="Daily Prayer"
              content={content.daily_prayer.content}
              icon="prayer"
            />
            <ExpandableSection
              title="Life Application"
              content={content.life_application.content}
              icon="leaf"
            />
          </div>
        </>
      )}
    </article>
  )
}