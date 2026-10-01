import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEO from '@/components/layout/SEO'
import PageHeader from '@/components/ui/PageHeader'
import Icon from '@/components/ui/Icon'
import AuthModal from '@/components/auth/AuthModal'
import { useAuth } from '@/auth/AuthProvider'
import { useBibleProgress, useLastRead } from '@/utils/userProgress'
import { BIBLE_VERSIONS } from '@/utils/bibleService'

/**
 * Reading Insights Page.
 *
 * Faithfully mirrors the mobile app's ReadingInsightsActivity & ReadingInsightsFragment:
 *   - Daily & Weekly streak counters
 *   - Interactive monthly calendar with active day highlights & month switcher
 *   - 6-month comparative reading activity bar chart with trend insights
 *   - Personal all-time records (Best Daily & Weekly streak)
 *   - 18-week GitHub-style activity density heatmap
 *   - Cross-platform sync status with the Android app
 */
export default function ReadingInsights() {
  const { user, synced, lastSyncError } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [versionKey, setVersionKey] = useState('WEB')
  const [calendarOffset, setCalendarOffset] = useState(0) // 0 = current month, -1 = last month, etc.
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: string; active: boolean } | null>(null)

  const progress = useBibleProgress(versionKey)
  const lastRead = useLastRead()

  const activityDates = progress.activityDates
  const activitySet = useMemo(() => new Set(activityDates), [activityDates])

  /* ── 1. Weekly Streak Calculation ────────────────────────────────────── */
  const calculatedWeeklyStreak = useMemo(() => {
    if (activityDates.length === 0) return 0
    // Group active dates into week keys (Year-WeekNumber)
    const weekKeys = new Set<string>()
    for (const d of activityDates) {
      const date = new Date(d + 'T00:00:00')
      const oneJan = new Date(date.getFullYear(), 0, 1)
      const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
      const week = Math.ceil((date.getDay() + 1 + numberOfDays) / 7)
      weekKeys.add(`${date.getFullYear()}-W${week}`)
    }
    return Math.max(weekKeys.size, progress.maxWeeklyStreak || 0)
  }, [activityDates, progress.maxWeeklyStreak])

  /* ── 2. Interactive Monthly Calendar ──────────────────────────────────── */
  const calendarData = useMemo(() => {
    const today = new Date()
    const targetDate = new Date(today.getFullYear(), today.getMonth() + calendarOffset, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()

    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sunday

    const days: { day: number; dateStr: string; hasActivity: boolean; isToday: boolean }[] = []

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({
        day,
        dateStr,
        hasActivity: activitySet.has(dateStr),
        isToday: dateStr === todayStr,
      })
    }

    return {
      monthName,
      firstDayOfWeek,
      days,
      canGoForward: calendarOffset < 0,
    }
  }, [calendarOffset, activitySet])

  /* ── 3. 6-Month Reading Activity Bar Chart ────────────────────────────── */
  const barChartData = useMemo(() => {
    const months: {
      id: string
      name: string
      count: number
      maxDays: number
      percentage: number
      isCurrent: boolean
    }[] = []

    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const name = d.toLocaleDateString('en-US', { month: 'short' })
      const maxDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()

      // Count active days in this month
      let count = 0
      for (const dateStr of activityDates) {
        if (dateStr.startsWith(id)) count++
      }

      const percentage = Math.min(100, Math.round((count / maxDays) * 100))

      months.push({
        id,
        name,
        count,
        maxDays,
        percentage,
        isCurrent: i === 0,
      })
    }

    // Trend message matching Android logic
    let trendMessage = 'Start reading today to see your monthly trends!'
    if (months.length >= 2) {
      const currentMonth = months[months.length - 1]
      const prevMonth = months[months.length - 2]

      if (currentMonth.count < prevMonth.count) {
        const diff = prevMonth.count - currentMonth.count
        trendMessage = `You've read ${currentMonth.count} days this month. Read ${diff} more day${diff > 1 ? 's' : ''} to beat last month's total!`
      } else if (currentMonth.count >= prevMonth.count && currentMonth.count > 0) {
        trendMessage = "Great job! You've already matched or beaten last month's reading activity."
      }
    }

    return { months, trendMessage }
  }, [activityDates])

  /* ── 4. 18-Week Density Heatmap (Mirrors Android createBlockDrawable) ── */
  const heatmapWeeks = useMemo(() => {
    const weeks: {
      days: { dateStr: string; level: number; readable: string }[]
    }[] = []

    const today = new Date()
    // Find Sunday of 17 weeks ago (total 18 columns)
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - today.getDay() - 17 * 7)

    const cur = new Date(startDate)

    for (let w = 0; w < 18; w++) {
      const days = []
      for (let d = 0; d < 7; d++) {
        const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
        const hasActivity = activitySet.has(dateStr)

        let level = 0
        if (hasActivity) {
          level = 1
          const prev = new Date(cur)
          prev.setDate(cur.getDate() - 1)
          const prevStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`

          const next = new Date(cur)
          next.setDate(cur.getDate() + 1)
          const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`

          const hasPrev = activitySet.has(prevStr)
          const hasNext = activitySet.has(nextStr)

          if (hasPrev && hasNext) {
            level = 3 // Connected streak: highest intensity
          } else if (hasPrev || hasNext) {
            level = 2 // Adjacent active days: medium intensity
          }
        }

        const readable = cur.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })

        days.push({ dateStr, level, readable })
        cur.setDate(cur.getDate() + 1)
      }
      weeks.push({ days })
    }

    return weeks
  }, [activitySet])

  return (
    <>
      <SEO
        title="Reading Insights — Streak, Heatmap & Monthly Activity"
        description="Comprehensive scripture reading insights, daily streak tracking, monthly calendar activity, and personal best records synced with the mobile app."
        canonical="/insights"
      />

      <main id="main-content" className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader
          eyebrow="Spiritual Growth &amp; Analytics"
          icon="sparkle"
          title="Reading Insights"
          subtitle="Explore your daily consistency, monthly devotional patterns, personal bests, and reading progress."
          actions={
            <div className="flex items-center gap-2">
              <select
                value={versionKey}
                onChange={e => setVersionKey(e.target.value)}
                aria-label="Bible Translation"
                className="px-3 py-1.5 rounded-lg border border-parchment-300 text-xs font-semibold
                           bg-white text-ink-800 focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                {BIBLE_VERSIONS.map(v => (
                  <option key={v.key} value={v.key}>
                    {v.name}
                  </option>
                ))}
              </select>

              {!user && (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="btn-primary !px-3 !py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Icon name="user" className="w-3.5 h-3.5" />
                  <span>Sync Mobile</span>
                </button>
              )}
            </div>
          }
        />

        {/* ── 1. Top Streak & Summary Cards ──────────────────────────────── */}
        <section aria-label="Reading Streaks" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {/* Current Daily Streak */}
          <div className="card p-4 sm:p-5 flex flex-col justify-between border-l-4 border-gold-500 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Daily Streak
              </span>
              <span className="text-xl" aria-hidden="true">🔥</span>
            </div>
            <div className="my-2">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-ink-900">
                {progress.currentStreak}
              </p>
              <p className="text-xs text-gold-700 font-medium mt-1">
                {progress.currentStreak > 0
                  ? `You're on a ${progress.currentStreak} day streak!`
                  : 'Start a new streak today'}
              </p>
            </div>
            <p className="text-[11px] text-ink-400">
              Personal Best: <strong>{progress.maxStreak} days</strong>
            </p>
          </div>

          {/* Weekly Streak */}
          <div className="card p-4 sm:p-5 flex flex-col justify-between border-l-4 border-indigo-500 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Weekly Streak
              </span>
              <span className="text-xl" aria-hidden="true">📅</span>
            </div>
            <div className="my-2">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-ink-900">
                {calculatedWeeklyStreak}
              </p>
              <p className="text-xs text-indigo-700 font-medium mt-1">
                Active weeks tracked
              </p>
            </div>
            <p className="text-[11px] text-ink-400">
              Best: <strong>{Math.max(calculatedWeeklyStreak, progress.maxWeeklyStreak || 0)} weeks</strong>
            </p>
          </div>

          {/* Chapters Completed */}
          <div className="card p-4 sm:p-5 flex flex-col justify-between border-l-4 border-emerald-500 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Chapters Read
              </span>
              <span className="text-xl" aria-hidden="true">📖</span>
            </div>
            <div className="my-2">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-ink-900">
                {progress.readChapters.length}
              </p>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                of 1,189 Bible chapters
              </p>
            </div>
            <p className="text-[11px] text-ink-400">
              {((progress.readChapters.length / 1189) * 100).toFixed(1)}% of full Bible
            </p>
          </div>

          {/* Last Activity Status */}
          <div className="card p-4 sm:p-5 flex flex-col justify-between border-l-4 border-amber-500 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Last Activity
              </span>
              <span className="text-xl" aria-hidden="true">✨</span>
            </div>
            <div className="my-2">
              <p className="text-sm font-semibold text-ink-800 line-clamp-1">
                {progress.lastReadDate || 'No reads yet'}
              </p>
              <p className="text-xs text-ink-500 mt-1">
                {progress.lastReadDate
                  ? 'Read today to maintain momentum'
                  : 'Start your journey today'}
              </p>
            </div>
            <Link
              to="/bible"
              className="text-xs font-semibold text-gold-700 hover:text-gold-900 flex items-center gap-1 transition-colors"
            >
              <span>Resume Reading</span>
              <Icon name="arrowRight" className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* ── 2. Interactive Calendar & 6-Month Chart Grid ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Calendar Tracker */}
          <section aria-label="Monthly Calendar Tracker" className="card p-5 sm:p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-ink-900">Activity Calendar</h2>
                <p className="text-xs text-ink-500">Days with scripture reading &amp; devotions</p>
              </div>

              {/* Month Navigation Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCalendarOffset(o => o - 1)}
                  aria-label="Previous month"
                  className="p-1.5 rounded-lg border border-parchment-300 text-ink-700 hover:bg-parchment-100 transition"
                >
                  <Icon name="chevronRight" className="w-4 h-4 rotate-180" />
                </button>
                <span className="text-xs font-semibold text-ink-800 min-w-[100px] text-center">
                  {calendarData.monthName}
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarOffset(o => o + 1)}
                  disabled={!calendarData.canGoForward}
                  aria-label="Next month"
                  className="p-1.5 rounded-lg border border-parchment-300 text-ink-700 hover:bg-parchment-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Icon name="chevronRight" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-ink-500 mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {/* Empty leading spacer cells */}
              {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 sm:h-10" />
              ))}

              {/* Days of Month */}
              {calendarData.days.map(({ day, dateStr, hasActivity, isToday }) => {
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDayInfo({ date: dateStr, active: hasActivity })}
                    className={`h-9 sm:h-10 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                      hasActivity
                        ? 'bg-gradient-to-tr from-purple-700 to-indigo-600 text-white shadow-xs font-bold scale-102'
                        : isToday
                        ? 'border-2 border-gold-500 text-gold-800 font-bold bg-gold-50/50'
                        : 'text-ink-700 hover:bg-parchment-100'
                    }`}
                    title={`${dateStr}: ${hasActivity ? 'Active devotion completed' : 'No activity recorded'}`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Selected day feedback info */}
            {selectedDayInfo && (
              <div className="mt-4 p-3 rounded-xl bg-parchment-100 border border-parchment-200 text-xs flex items-center justify-between animate-fade-in">
                <span>
                  <strong>{selectedDayInfo.date}:</strong>{' '}
                  {selectedDayInfo.active
                    ? 'Completed scripture reading & devotion ✨'
                    : 'No reading recorded on this day.'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDayInfo(null)}
                  className="text-ink-400 hover:text-ink-800 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}
          </section>

          {/* 6-Month Reading Activity Bar Chart */}
          <section aria-label="Monthly Reading Trends" className="card p-5 sm:p-6 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-serif text-lg font-bold text-ink-900">Monthly Trends</h2>
                <span className="text-xs text-gold-700 font-semibold bg-gold-50 border border-gold-200 px-2 py-0.5 rounded-full">
                  Last 6 Months
                </span>
              </div>
              <p className="text-xs text-ink-500 mb-6">Compare active reading days across past months</p>

              {/* Bar Chart Visualization */}
              <div className="flex items-end justify-between gap-3 h-40 pt-4 px-2 border-b border-parchment-200">
                {barChartData.months.map(m => {
                  const barHeightPercent = Math.max(m.percentage, m.count > 0 ? 12 : 0)

                  return (
                    <div key={m.id} className="flex-1 flex flex-col items-center justify-end h-full group">
                      {/* Count number above bar */}
                      <span className="text-[11px] font-bold text-ink-800 mb-1 group-hover:scale-110 transition-transform">
                        {m.count > 0 ? m.count : '0'}
                      </span>

                      {/* The Bar */}
                      <div className="w-full max-w-[32px] bg-parchment-200 rounded-t-lg overflow-hidden flex items-end h-28">
                        <div
                          style={{ height: `${barHeightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            m.isCurrent
                              ? 'bg-gradient-to-t from-gold-600 to-amber-400 shadow-soft'
                              : 'bg-gradient-to-t from-ink-700 to-ink-500 opacity-80 group-hover:opacity-100'
                          }`}
                        />
                      </div>

                      {/* Month Label */}
                      <span
                        className={`text-xs mt-2 font-medium ${
                          m.isCurrent ? 'text-gold-800 font-bold' : 'text-ink-500'
                        }`}
                      >
                        {m.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Trend Insight Message (matches Android tvInsightMessage) */}
            <div className="mt-5 p-3.5 rounded-xl bg-parchment-100 border border-parchment-200 flex items-start gap-2.5">
              <span className="text-base" aria-hidden="true">💡</span>
              <p className="text-xs text-ink-800 leading-relaxed font-medium">
                {barChartData.trendMessage}
              </p>
            </div>
          </section>
        </div>

        {/* ── 3. 18-Week Intensity Heatmap ──────────────────────────────── */}
        <section aria-label="18-Week Activity Density" className="card p-5 sm:p-6 shadow-soft mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-ink-900">18-Week Devotion Heatmap</h2>
              <p className="text-xs text-ink-500">Visualizing reading intensity and streak continuity over 126 days</p>
            </div>

            {/* Intensity Legend */}
            <div className="flex items-center gap-1.5 text-xs text-ink-500">
              <span>Less</span>
              <span className="w-3.5 h-3.5 rounded-xs bg-parchment-200 border border-parchment-300" title="Level 0: No activity" />
              <span className="w-3.5 h-3.5 rounded-xs bg-purple-400" title="Level 1: Active" />
              <span className="w-3.5 h-3.5 rounded-xs bg-purple-600" title="Level 2: Consecutive days" />
              <span className="w-3.5 h-3.5 rounded-xs bg-indigo-700" title="Level 3: Connected streak" />
              <span>More</span>
            </div>
          </div>

          {/* Grid of Weeks (columns) x Days (rows) */}
          <div className="overflow-x-auto pb-2">
            <div className="inline-flex gap-1.5 min-w-[560px]">
              {heatmapWeeks.map((week, wIdx) => (
                <div key={`w-${wIdx}`} className="flex flex-col gap-1.5">
                  {week.days.map(({ dateStr, level, readable }) => {
                    const bgClass =
                      level === 0
                        ? 'bg-parchment-200/60 border border-parchment-300/60 hover:border-ink-400'
                        : level === 1
                        ? 'bg-purple-400 hover:bg-purple-500'
                        : level === 2
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-indigo-700 hover:bg-indigo-800'

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() =>
                          setSelectedDayInfo({ date: readable, active: level > 0 })
                        }
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs transition-colors cursor-pointer ${bgClass}`}
                        title={`${readable}: ${level > 0 ? 'Active devotion completed' : 'No activity'}`}
                        aria-label={readable}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Personal Records & Cloud Sync ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Records */}
          <section aria-label="Personal Records" className="card p-5 sm:p-6 shadow-soft">
            <h2 className="font-serif text-lg font-bold text-ink-900 mb-1">Personal Best Records</h2>
            <p className="text-xs text-ink-500 mb-4">Milestones achieved on your spiritual journey</p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-gold-50/70 border border-gold-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">🏆</span>
                  <div>
                    <p className="text-xs font-semibold text-gold-900">All-Time Longest Daily Streak</p>
                    <p className="text-[11px] text-gold-700">Your greatest personal record</p>
                  </div>
                </div>
                <span className="font-serif text-xl font-bold text-gold-900">
                  {progress.maxStreak} days
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">🌟</span>
                  <div>
                    <p className="text-xs font-semibold text-indigo-950">Longest Weekly Consistency</p>
                    <p className="text-[11px] text-indigo-800">Consecutive weekly active record</p>
                  </div>
                </div>
                <span className="font-serif text-xl font-bold text-indigo-950">
                  {Math.max(calculatedWeeklyStreak, progress.maxWeeklyStreak || 0)} weeks
                </span>
              </div>
            </div>
          </section>

          {/* Cloud Sync Status */}
          <section aria-label="Cloud Sync Status" className="card p-5 sm:p-6 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-serif text-lg font-bold text-ink-900">Mobile Cloud Sync</h2>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    user && synced && !lastSyncError
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : user
                      ? 'bg-gold-50 text-gold-800 border border-gold-200'
                      : 'bg-parchment-200 text-ink-600'
                  }`}
                >
                  <Icon name={user && synced && !lastSyncError ? 'check' : 'sparkle'} className="w-3 h-3" />
                  {user && synced && !lastSyncError
                    ? 'Synced with Mobile'
                    : user
                    ? 'Syncing…'
                    : 'Not Signed In'}
                </span>
              </div>

              <p className="text-xs text-ink-600 leading-relaxed mb-4">
                {user
                  ? `Signed in as ${user.displayName || user.email}. Reading streaks, completed chapters, and plan progress are synced across Android and web.`
                  : 'Sign in with the same Google or Email account you use on the mobile app to access your full reading history.'}
              </p>
            </div>

            <div className="pt-3 border-t border-parchment-200 flex items-center justify-between">
              {user ? (
                <Link
                  to="/account"
                  className="text-xs font-semibold text-gold-700 hover:text-gold-900 flex items-center gap-1"
                >
                  <span>View Account Dashboard</span>
                  <Icon name="arrowRight" className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="btn-primary !px-4 !py-2 text-xs flex items-center gap-1.5"
                >
                  <Icon name="user" className="w-3.5 h-3.5" />
                  <span>Sign In to Sync</span>
                </button>
              )}

              <Link
                to="/bible"
                className="text-xs font-semibold text-ink-700 hover:text-ink-900 flex items-center gap-1"
              >
                <span>Read Bible Now</span>
                <Icon name="book" className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>

        {/* Auth Modal Portal */}
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          reason="Sign in with your mobile account to sync your streaks, reading calendar, and insights."
        />
      </main>
    </>
  )
}
