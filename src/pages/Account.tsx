import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '@/components/layout/SEO'
import PageHeader from '@/components/ui/PageHeader'
import Icon from '@/components/ui/Icon'
import AuthModal from '@/components/auth/AuthModal'
import { useAuth, usePrefs, PREFS } from '@/auth/AuthProvider'
import { useBibleProgress, useReadingPlan, useLastRead } from '@/utils/userProgress'
import { BOOK_NAMES, formatReadings, getReadingsForPlanDay } from '@/utils/readingPlans'
import { BIBLE_VERSIONS } from '@/utils/bibleService'

/** Last 12 weeks of activity, oldest first. */
function buildHeatmap(dates: string[]): { date: string; active: boolean }[] {
  const set = new Set(dates)
  const cells: { date: string; active: boolean }[] = []
  const today = new Date()

  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    cells.push({ date: key, active: set.has(key) })
  }
  return cells
}

export default function Account() {
  const { user, initialising, busy, signOut, synced, lastSyncError } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [versionKey, setVersionKey] = useState('WEB')

  const progress = useBibleProgress(versionKey)
  const planState = useReadingPlan()
  const lastRead = useLastRead()

  const [likedVerses] = usePrefs(PREFS.LIKED_VERSES)
  const [savedStories] = usePrefs(PREFS.SAVED_STORIES)

  const likedCount = Array.isArray(likedVerses.liked_verse_ids)
    ? likedVerses.liked_verse_ids.length
    : 0
  const savedStoryCount = Array.isArray(savedStories.saved_story_ids)
    ? savedStories.saved_story_ids.length
    : 0

  const heatmap = useMemo(() => buildHeatmap(progress.activityDates), [progress.activityDates])

  const recentChapters = useMemo(() => {
    return progress.readChapters
      .map(token => {
        const s = String(token).padStart(5, '0')
        const bookId = Number(s.slice(0, s.length - 3))
        const chapter = Number(s.slice(s.length - 3))
        return { bookId, chapter, name: BOOK_NAMES[bookId - 1] ?? `Book ${bookId}` }
      })
      .filter(c => c.name)
      .sort((a, b) => a.bookId * 1000 + a.chapter - (b.bookId * 1000 + b.chapter))
      .slice(0, 12)
  }, [progress.readChapters])

  if (initialising) {
    return (
      <main id="main-content" className="shell-narrow py-20">
        <div className="h-8 w-48 bg-parchment-200 rounded-lg animate-pulse" aria-hidden="true" />
      </main>
    )
  }

  /* -- Signed out -- */
  if (!user) {
    return (
      <>
        <SEO title="Your Account" description="Sign in to sync your reading progress." noIndex />
        <main id="main-content" className="shell-narrow py-16 text-center">
          <span
            aria-hidden="true"
            className="grid place-items-center w-16 h-16 rounded-2xl bg-ink-800 text-gold-300 mx-auto mb-5 shadow-soft"
          >
            <Icon name="sparkle" className="w-8 h-8" />
          </span>
          <h1 className="font-serif text-3xl font-bold text-ink-900 mb-3 tracking-tight">
            Sign in to sync your progress
          </h1>
          <p className="text-ink-600 mb-6 max-w-md mx-auto text-pretty">
            Connect your account to carry your reading progress, saved verses and reading
            plans between this website and the mobile app.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button type="button" onClick={() => setAuthOpen(true)} className="btn-primary">
              Sign in or create account
            </button>
            <Link to="/insights" className="btn-ghost border border-parchment-300 flex items-center gap-1.5 text-ink-800">
              <Icon name="sparkle" className="w-4 h-4 text-gold-600" />
              <span>View Reading Insights</span>
            </Link>
          </div>

          <div className="card p-5 mt-10 text-left">
            <p className="font-semibold text-ink-900 text-sm mb-2">No account yet?</p>
            <p className="text-sm text-ink-600">
              You can read everything without signing in. Progress is stored on this device
              and uploaded automatically the moment you create an account — nothing is lost.
            </p>
          </div>
        </main>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    )
  }
  /* -- Signed in -- */
  return (
    <>
      <SEO
        title="Your Account"
        description="Your synced Bible reading progress, streaks, saved verses and reading plans."
        noIndex
      />
      <main id="main-content" className="shell-narrow pb-16 sm:pb-20">
        <PageHeader
          icon="sparkle"
          eyebrow="Your account"
          title={user.displayName || 'Bible reader'}
          subtitle={user.email ?? undefined}
        />

        <div className="card p-4 mb-6 flex items-start gap-3 bg-parchment-100 border-parchment-200">
          <Icon
            name={synced && !lastSyncError ? 'check' : 'sparkle'}
            className="w-5 h-5 text-gold-700 mt-0.5 shrink-0"
          />
          <div className="text-sm">
            <p className="font-semibold text-ink-900">
              {!synced ? 'Syncing with the app…'
                : lastSyncError ? 'Signed in — some data could not sync'
                : 'Everything is in sync'}
            </p>
            <p className="text-ink-600 mt-0.5">
              {lastSyncError
                ? lastSyncError
                : 'Your progress is shared with the Bible Verse of the Day mobile app.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title text-xl">Reading stats</h2>
          <Link
            to="/insights"
            className="text-xs font-semibold text-gold-800 hover:text-gold-950 flex items-center gap-1.5 bg-gold-50 border border-gold-200 px-3 py-1.5 rounded-full transition-colors shadow-xs"
          >
            <Icon name="sparkle" className="w-3.5 h-3.5 text-gold-600" />
            <span>Open Full Insights</span>
            <Icon name="arrowRight" className="w-3 h-3" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Day streak', value: progress.currentStreak, icon: 'sparkle' as const },
            { label: 'Best streak', value: progress.maxStreak, icon: 'shield' as const },
            { label: 'Chapters read', value: progress.readChapters.length, icon: 'bible' as const },
            { label: 'Verses read', value: progress.readVerses.length, icon: 'book' as const },
          ].map(stat => (
            <li key={stat.label} className="card p-4 text-center">
              <Icon name={stat.icon} className="w-5 h-5 mx-auto mb-1.5 text-gold-700" />
              <p className="font-serif text-2xl font-bold text-ink-900">{stat.value}</p>
              <p className="text-xs text-ink-600 mt-0.5">{stat.label}</p>
            </li>
          ))}
        </ul>

        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">Last 12 weeks</h3>
          <div
            className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto no-scrollbar"
            role="img"
            aria-label={`Reading activity for the last 12 weeks. ${progress.activityDates.length} active days.`}
          >
            {heatmap.map(cell => (
              <span
                key={cell.date}
                title={cell.date}
                className={`w-3 h-3 rounded-sm ${cell.active ? 'bg-gold-600' : 'bg-parchment-200'}`}
              />
            ))}
          </div>
          <p className="text-xs text-ink-500 mt-2">
            {progress.activityDates.length} active day
            {progress.activityDates.length === 1 ? '' : 's'} recorded.
            {progress.lastReadDate && ` Last read: ${progress.lastReadDate}.`}
          </p>
        </div>
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-2">Translation</h3>
          <p className="text-xs text-ink-600 mb-3">
            Progress is tracked separately per translation, matching the mobile app.
          </p>
          <label htmlFor="progress-version" className="sr-only">Translation</label>
          <select
            id="progress-version"
            value={versionKey}
            onChange={e => setVersionKey(e.target.value)}
            className="w-full sm:w-auto border border-parchment-300 rounded-xl px-3 py-2 text-sm bg-white"
          >
            {BIBLE_VERSIONS.map(v => (
              <option key={v.key} value={v.key}>{v.name}</option>
            ))}
          </select>
        </div>

        {planState.plan && (
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-ink-900">Reading plan</h3>
              <Link to="/plans" className="text-xs font-semibold text-gold-800 hover:underline">
                Manage
              </Link>
            </div>
            <p className="font-serif text-lg font-semibold text-ink-900">
              {planState.plan.title}
            </p>
            <p className="text-sm text-ink-600 mt-1">
              Day {planState.currentDay} of {planState.plan.durationDays} ·{' '}
              {formatReadings(getReadingsForPlanDay(planState.plan.id, planState.currentDay - 1))}
            </p>
            <div className="h-2 bg-parchment-200 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gold-600"
                style={{ width: `${Math.min(100, planState.progressPercent)}%` }}
              />
            </div>
          </div>
        )}

        {lastRead.hasPosition && (
          <div className="card p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Icon name="book" className="w-5 h-5 text-gold-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-ink-600 uppercase tracking-eyebrow">
                  Continue reading
                </p>
                <p className="font-semibold text-ink-900">
                  {BOOK_NAMES[lastRead.bookIndex]} {lastRead.chapter}
                </p>
              </div>
            </div>
            <Link to="/bible" className="btn-primary !py-2 text-sm shrink-0">Open reader</Link>
          </div>
        )}

        {recentChapters.length > 0 && (
          <div className="card p-5 mb-6">
            <h3 className="text-sm font-semibold text-ink-900 mb-3">Recently read</h3>
            <ul className="flex flex-wrap gap-2">
              {recentChapters.map(c => (
                <li key={`${c.bookId}-${c.chapter}`}>
                  <Link
                    to={`/bible?book=${c.bookId}&chapter=${c.chapter}`}
                    className="inline-block text-xs font-medium px-2.5 py-1 rounded-full
                               bg-parchment-100 border border-parchment-200 text-ink-700
                               hover:bg-parchment-200 transition-colors"
                  >
                    {c.name} {c.chapter}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">Saved</h3>
          <ul className="grid grid-cols-2 gap-4 text-sm">
            <li>
              <span className="block font-serif text-xl font-bold text-ink-900">{likedCount}</span>
              <span className="text-ink-600">Liked verses</span>
            </li>
            <li>
              <span className="block font-serif text-xl font-bold text-ink-900">{savedStoryCount}</span>
              <span className="text-ink-600">Saved stories</span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => void signOut()}
          disabled={busy}
          className="btn-secondary w-full disabled:opacity-60"
        >
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
      </main>
    </>
  )
}