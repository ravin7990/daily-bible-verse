import type { DailyContent } from '@/types'
import { formatLongDate, todayStr } from '@/utils/dateUtils'
import { useState, useEffect } from 'react'
import { fetchDailyBackgroundUri } from '@/firebase/storage'
import clsx from 'clsx'

interface VerseCardProps {
  content: DailyContent
  isToday?: boolean
}

interface SectionProps {
  title: string
  content: string
  icon: string
  defaultOpen?: boolean
}

function ExpandableSection({ title, content, icon, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = `section-${title.toLowerCase().replace(/\s/g, '-')}`

  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
          <span aria-hidden="true">{icon}</span>
          {title}
        </span>
        <span
          aria-hidden="true"
          className={clsx('text-gray-400 transition-transform duration-200', open && 'rotate-180')}
        >
          ▾
        </span>
      </button>
      <div
        id={id}
        hidden={!open}
        className="px-5 pb-4 text-gray-600 text-sm sm:text-base leading-relaxed animate-fade-in"
      >
        {content}
      </div>
    </div>
  )
}

export default function VerseCard({ content, isToday = false }: VerseCardProps) {
  const [copied, setCopied] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bgUrl, setBgUrl] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'wallpaper'>('card')
  const [isSaved, setIsSaved] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_verses') || '[]')
      return saved.includes(content.id)
    } catch {
      return false
    }
  })

  // Fetch daily verse background from Firebase Storage (imagebackground)
  // Strictly only fetch for today or past days (never future dates)
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

  function handleCopy() {
    const text = `"${content.verse_of_the_day.text}" — ${content.verse_of_the_day.reference}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    const text = `"${content.verse_of_the_day.text}" — ${content.verse_of_the_day.reference}`
    if (navigator.share) {
      navigator.share({
        title: `${content.verse_of_the_day.reference} | Bible Verse of the Day`,
        text: `${text}\n\nRead daily verses at ${window.location.origin}`,
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
      `${content.verse_of_the_day.reference}. ${content.verse_of_the_day.text}. Reflection: ${content.reflection.content}`
    )
    utterance.rate = 0.95
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    setIsPlaying(true)
    window.speechSynthesis.speak(utterance)
  }

  function toggleSave() {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_verses') || '[]')
      let next: string[]
      if (saved.includes(content.id)) {
        next = saved.filter((id: string) => id !== content.id)
        setIsSaved(false)
      } else {
        next = [...saved, content.id]
        setIsSaved(true)
      }
      localStorage.setItem('saved_verses', JSON.stringify(next))
    } catch {}
  }

  return (
    <article className="card animate-slide-up overflow-hidden">
      {/* Date header */}
      <div
        className={clsx(
          'px-5 py-3 flex items-center justify-between',
          isToday ? 'bg-gradient-to-r from-sacred-600 to-sacred-700' : 'bg-gray-700'
        )}
      >
        <time
          dateTime={content.date}
          className="text-xs font-semibold uppercase tracking-widest text-white/80"
        >
          {isToday ? '✨ Today — ' : ''}
          {formatLongDate(content.date)}
        </time>

        <div className="flex items-center gap-2">
          {bgUrl && (
            <div className="inline-flex rounded-lg bg-black/25 p-0.5" role="tablist">
              <button
                role="tab"
                aria-selected={viewMode === 'card'}
                onClick={() => setViewMode('card')}
                className={clsx(
                  'px-2 py-0.5 text-xs font-medium rounded-md transition-colors',
                  viewMode === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-white/80 hover:text-white'
                )}
              >
                📝 Card
              </button>
              <button
                role="tab"
                aria-selected={viewMode === 'wallpaper'}
                onClick={() => setViewMode('wallpaper')}
                className={clsx(
                  'px-2 py-0.5 text-xs font-medium rounded-md transition-colors',
                  viewMode === 'wallpaper' ? 'bg-white text-gray-900 shadow-sm' : 'text-white/80 hover:text-white'
                )}
              >
                🖼️ Wallpaper
              </button>
            </div>
          )}

          {isToday && (
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
              Daily Verse
            </span>
          )}
        </div>
      </div>

      {/* Wallpaper Mode View */}
      {viewMode === 'wallpaper' && bgUrl ? (
        <div className="relative bg-black group overflow-hidden">
          <img
            src={bgUrl}
            alt={`Daily Bible verse wallpaper for ${content.date}`}
            className="w-full h-auto max-h-[550px] object-contain mx-auto"
          />
          <div className="p-4 bg-gray-900 text-white flex items-center justify-between border-t border-gray-800">
            <div>
              <p className="text-xs text-gray-400 font-medium">Daily Verse Wallpaper</p>
              <p className="text-sm font-semibold text-gold-300">{content.verse_of_the_day.reference}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={bgUrl}
                target="_blank"
                rel="noreferrer"
                download={`verse-${content.date}.webp`}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <span>⬇️</span> Download Wallpaper
              </a>
              <button
                onClick={() => setViewMode('card')}
                className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-700"
              >
                Read Devotional 📝
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Devotional Card Mode View */}
      {viewMode === 'card' && (
        <>
          {/* Subtle prompt banner if daily wallpaper exists */}
          {bgUrl && (
            <button
              onClick={() => setViewMode('wallpaper')}
              className="w-full text-left bg-gradient-to-r from-sacred-50 to-gold-50 border-b border-sacred-100 px-5 py-2.5 flex items-center justify-between text-xs text-sacred-800 hover:opacity-90 transition-opacity"
            >
              <span className="flex items-center gap-2 font-medium">
                <span>🖼️</span> View today's scripture wallpaper
              </span>
              <span className="text-sacred-600 font-semibold flex items-center gap-1">
                Show Wallpaper <span>→</span>
              </span>
            </button>
          )}

          {/* Verse */}
          <div className="px-5 pt-5 pb-3">
            <p className="verse-text mb-3">"{content.verse_of_the_day.text}"</p>
            <p className="text-right text-sm font-semibold text-sacred-600">
              — {content.verse_of_the_day.reference}
            </p>

            {/* Action toolbar */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 text-xs text-gray-500">
              <div className="flex items-center gap-1 sm:gap-2">
                {'speechSynthesis' in window && (
                  <button
                    onClick={toggleSpeech}
                    className={clsx(
                      'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors',
                      isPlaying ? 'bg-sacred-50 text-sacred-700 border-sacred-200' : 'hover:bg-gray-50 border-gray-200'
                    )}
                    aria-label={isPlaying ? 'Stop audio' : 'Listen to verse'}
                  >
                    <span aria-hidden="true">{isPlaying ? '⏹️' : '🔊'}</span>
                    <span>{isPlaying ? 'Stop' : 'Listen'}</span>
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  aria-label="Copy verse text"
                >
                  <span aria-hidden="true">{copied ? '✓' : '📋'}</span>
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  aria-label="Share verse"
                >
                  <span aria-hidden="true">↗️</span>
                  <span>Share</span>
                </button>
              </div>

              <button
                onClick={toggleSave}
                className={clsx(
                  'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors',
                  isSaved ? 'text-red-600 border-red-200 bg-red-50' : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                )}
                aria-label={isSaved ? 'Remove from saved' : 'Save verse'}
              >
                <span aria-hidden="true">{isSaved ? '❤️' : '🤍'}</span>
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Expandable sections */}
          <ExpandableSection
            title="Reflection"
            content={content.reflection.content}
            icon="💭"
            defaultOpen={isToday}
          />
          <ExpandableSection
            title="Daily Prayer"
            content={content.daily_prayer.content}
            icon="🙏"
          />
          <ExpandableSection
            title="Life Application"
            content={content.life_application.content}
            icon="🌱"
          />
        </>
      )}
    </article>
  )
}
