import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEO from '@/components/layout/SEO'
import VerseCard from '@/components/ui/VerseCard'
import { VerseCardSkeleton } from '@/components/ui/Skeleton'
import PageHeader from '@/components/ui/PageHeader'
import Icon from '@/components/ui/Icon'
import { fetchMonthContent, todayStr, formatShortDate } from '@/utils/dateUtils'
import type { DailyContent } from '@/types'
import clsx from 'clsx'

function getMonthOptions() {
  const options: { key: string; label: string }[] = []
  const now = new Date()
  const currentY = now.getFullYear()
  const currentM = now.getMonth() + 1

  // Show months from Sept 2025 up to current month (strictly exclude future months)
  for (let y = 2025; y <= currentY; y++) {
    const startM = y === 2025 ? 9 : 1
    const endM   = y === currentY ? currentM : 12
    for (let m = startM; m <= endM; m++) {
      const key   = `${y}_${String(m).padStart(2, '0')}`
      const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      options.push({ key, label })
    }
  }
  return options.reverse() // Newest month first
}

export default function Archive() {
  const months = getMonthOptions()
  const [searchParams, setSearchParams] = useSearchParams()

  // Deep linking: /archive?d=2026-01-15 is a real, shareable, indexable URL.
  // The archive previously collapsed 488 dated devotionals onto a single URL, so
  // none of them could be discovered or linked to individually.
  const requestedDate = searchParams.get('d')

  const [selectedMonth, setSelectedMonth] = useState(
    requestedDate
      ? requestedDate.replace('-', '_').slice(0, 7)
      : months[0]?.key || '2026_09',
  )
  const [entries, setEntries] = useState<DailyContent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(requestedDate)
  const [dayContent, setDayContent] = useState<DailyContent | null>(null)
  const [loading, setLoading] = useState(false)
  const today = todayStr()

  const selectDate = useCallback((date: string | null, content: DailyContent | null) => {
    setSelectedDate(date)
    setDayContent(content)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchMonthContent(selectedMonth).then((data: DailyContent[]) => {
      // Strictly include only past and today's verses (NEVER reveal future dates)
      const valid = data.filter(e => e.date <= today)
      setEntries(valid)
      setLoading(false)

      // Honour a deep-linked date when it exists in this month; otherwise fall
      // back to today, or the newest past verse in the month.
      if (valid.length > 0) {
        const linked = requestedDate ? valid.find(e => e.date === requestedDate) : undefined
        const match = linked || valid.find(e => e.date === today) || valid[valid.length - 1]
        selectDate(match.date, match)
      } else {
        selectDate(null, null)
      }
    })
  }, [selectedMonth, today, requestedDate, selectDate])

  function handleDaySelect(entry: DailyContent) {
    selectDate(entry.date, entry)
    setSearchParams({ d: entry.date }, { replace: true })
    // Scroll to verse on mobile
    setTimeout(() => {
      document.getElementById('archive-verse')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <>
      <SEO
        title="Verse Archive"
        description="Browse all past Bible verses by date. Revisit daily Scripture, reflections, prayers, and wallpapers from previous dates."
        canonical="/archive"
      />

      <main id="main-content" className="shell pb-16 sm:pb-20 py-8">
        <PageHeader
          icon="archive"
          eyebrow="Browse Scripture"
          title="Verse Archive"
          subtitle="Revisit past daily verses, reflections, prayers and wallpapers by date."
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Month selector + date list ── */}
          <aside className="lg:w-72 shrink-0" aria-label="Month and date selection">
            {/* Month picker */}
            <label htmlFor="month-select" className="block text-xs font-semibold text-ink-600 uppercase tracking-wider mb-1">
              Month
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full border border-parchment-300 rounded-xl px-3 py-2.5 text-sm
                         bg-white mb-4"
            >
              {months.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Date list */}
            <div
              className="bg-white border border-parchment-200 rounded-2xl overflow-hidden shadow-soft max-h-[500px] overflow-y-auto"
              role="listbox"
              aria-label="Select a date"
            >
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 border-b border-parchment-100 animate-pulse bg-parchment-200" />
                ))
              ) : entries.length === 0 ? (
                <p className="p-4 text-sm text-ink-500">No past verses found for this month.</p>
              ) : (
                [...entries].reverse().map(entry => (
                  <button
                    key={entry.date}
                    role="option"
                    aria-selected={selectedDate === entry.date}
                    onClick={() => handleDaySelect(entry)}
                    className={clsx(
                      'w-full text-left px-4 py-3 flex items-center justify-between text-sm border-b border-parchment-100 last:border-0 transition-colors',
                      selectedDate === entry.date
                        ? 'bg-parchment-100 text-ink-800 font-semibold'
                        : 'text-ink-800 hover:bg-parchment-100',
                      entry.date === today && 'ring-inset ring-1 ring-gold-500 font-medium'
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {entry.date === today && (
                        <Icon name="sparkle" className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                      )}
                      {formatShortDate(entry.date)}
                    </span>
                    <span className="text-xs text-ink-500 truncate max-w-[120px]">
                      {entry.verse_of_the_day.reference}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* ── Verse display ── */}
          <div className="flex-1 min-w-0" id="archive-verse">
            {!selectedDate ? (
              <div className="card p-10 flex flex-col items-center justify-center text-center text-ink-500 min-h-[300px]">
                <span
                  aria-hidden="true"
                  className="grid place-items-center w-14 h-14 rounded-full bg-parchment-100
                             text-ink-400 mb-3"
                >
                  <Icon name="archive" className="w-7 h-7" />
                </span>
                <p className="font-medium text-ink-600">Select a date to view its verse</p>
              </div>
            ) : dayContent ? (
              <VerseCard content={dayContent} isToday={dayContent.date === today} />
            ) : (
              <VerseCardSkeleton />
            )}
          </div>
        </div>
      </main>
    </>
  )
}
