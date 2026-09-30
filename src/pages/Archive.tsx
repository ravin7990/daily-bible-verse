import { useState, useEffect } from 'react'
import SEO from '@/components/layout/SEO'
import VerseCard from '@/components/ui/VerseCard'
import { VerseCardSkeleton } from '@/components/ui/Skeleton'
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
  const [selectedMonth, setSelectedMonth] = useState(months[0]?.key || '2026_09')
  const [entries, setEntries] = useState<DailyContent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayContent, setDayContent] = useState<DailyContent | null>(null)
  const [loading, setLoading] = useState(false)
  const today = todayStr()

  useEffect(() => {
    setLoading(true)
    fetchMonthContent(selectedMonth).then((data: DailyContent[]) => {
      // Strictly include only past and today's verses (NEVER reveal future dates)
      const valid = data.filter(e => e.date <= today)
      setEntries(valid)
      setLoading(false)

      if (valid.length > 0) {
        // Pre-select today if present, or the newest available past verse in this month
        const match = valid.find(e => e.date === today) || valid[valid.length - 1]
        setSelectedDate(match.date)
        setDayContent(match)
      } else {
        setSelectedDate(null)
        setDayContent(null)
      }
    })
  }, [selectedMonth, today])

  function handleDaySelect(entry: DailyContent) {
    setSelectedDate(entry.date)
    setDayContent(entry)
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

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="section-title mb-1">Verse Archive</h1>
          <p className="text-gray-500 text-sm">Browse past daily verses and wallpapers by date</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Month selector + date list ── */}
          <aside className="lg:w-72 shrink-0" aria-label="Month and date selection">
            {/* Month picker */}
            <label htmlFor="month-select" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Month
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sacred-500 mb-4"
            >
              {months.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Date list */}
            <div
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm max-h-[500px] overflow-y-auto"
              role="listbox"
              aria-label="Select a date"
            >
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 border-b border-gray-50 animate-pulse bg-gray-100" />
                ))
              ) : entries.length === 0 ? (
                <p className="p-4 text-sm text-gray-400">No past verses found for this month.</p>
              ) : (
                [...entries].reverse().map(entry => (
                  <button
                    key={entry.date}
                    role="option"
                    aria-selected={selectedDate === entry.date}
                    onClick={() => handleDaySelect(entry)}
                    className={clsx(
                      'w-full text-left px-4 py-3 flex items-center justify-between text-sm border-b border-gray-50 last:border-0 transition-colors',
                      selectedDate === entry.date
                        ? 'bg-sacred-50 text-sacred-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50',
                      entry.date === today && 'ring-inset ring-1 ring-gold-400 font-medium'
                    )}
                  >
                    <span>
                      {entry.date === today ? '✨ ' : ''}
                      {formatShortDate(entry.date)}
                    </span>
                    <span className="text-xs text-gray-400 truncate max-w-[120px]">
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
              <div className="card p-10 flex flex-col items-center justify-center text-center text-gray-400 min-h-[300px]">
                <span className="text-4xl mb-3" aria-hidden="true">📅</span>
                <p className="font-medium text-gray-500">Select a date to view its verse</p>
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
