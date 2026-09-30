import type { DailyContent } from '@/types'
import { formatLongDate } from '@/utils/dateUtils'
import { useState } from 'react'
import clsx from 'clsx'

interface VerseCardProps {
  content: DailyContent
  isToday?: boolean
}

interface SectionProps {
  title:    string
  content:  string
  icon:     string
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
  const [isSaved, setIsSaved] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_verses') || '[]')
      return saved.includes(content.id)
    } catch {
      return false
    }
  })

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
    <article className="card animate-slide-up">
      {/* Date header */}
      <div className={clsx(
        'px-5 py-3 flex items-center justify-between',
        isToday ? 'bg-gradient-to-r from-sacred-600 to-sacred-700' : 'bg-gray-700'
      )}>
        <time
          dateTime={content.date}
          className="text-xs font-semibold uppercase tracking-widest text-white/80"
        >
          {isToday ? '✨ Today — ' : ''}{formatLongDate(content.date)}
        </time>
        {isToday && (
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
            Daily Verse
          </span>
        )}
      </div>

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
    </article>
  )
}
