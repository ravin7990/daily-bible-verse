import { useCallback, useMemo } from 'react'
import { usePrefs, PREFS } from '@/auth/AuthProvider'
import { getPlan } from './readingPlans'

/** Today as YYYY-MM-DD in local time, matching the app's date format. */
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Calendar days between two YYYY-MM-DD strings (local-safe). */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const a = new Date(fy, fm - 1, fd).getTime()
  const b = new Date(ty, tm - 1, td).getTime()
  return Math.round((b - a) / 86_400_000)
}

/**
 * Reading-plan state, stored under the same keys the app uses
 * (`ReadingPlanPreferences`) so the two stay in lockstep through cloud sync:
 *
 *   active_plan_id      string
 *   current_day         int   (1-based)
 *   start_time          long  (epoch ms)
 *   completed_days_set  stringset of day numbers as strings
 */
export function useReadingPlan() {
    const [prefs, setPrefs] = usePrefs(PREFS.READING_PLAN)

  const activePlanId = typeof prefs.active_plan_id === 'string' ? prefs.active_plan_id : ''
  const plan = getPlan(activePlanId)
  const currentDay = Number(prefs.current_day ?? 1) || 1
  const startTime = Number(prefs.start_time ?? 0) || 0

  const completedDays = useMemo<number[]>(() => {
    const raw = prefs.completed_days_set
    return Array.isArray(raw)
      ? raw.map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b)
      : []
  }, [prefs.completed_days_set])

  const startPlan = useCallback((planId: string) => {
    // Matches ReadingPlanManager.startPlan exactly.
    setPrefs({
      active_plan_id: planId,
      current_day: 1,
      start_time: Date.now(),
      completed_days_set: [] as string[],
    })
  }, [setPrefs])

  const leavePlan = useCallback(() => {
    setPrefs({
      active_plan_id: '',
      current_day: 1,
      start_time: 0,
      completed_days_set: [] as string[],
    })
  }, [setPrefs])

  const setDay = useCallback((day: number) => {
    if (!plan) return
    setPrefs({ current_day: Math.min(Math.max(day, 1), plan.durationDays) })
  }, [plan, setPrefs])

  /**
   * Mark a day complete. Like the app, completing the *current* day advances
   * to the next one automatically.
   */
  const markDayComplete = useCallback((day: number, complete = true) => {
    const set = new Set(completedDays.map(String))
    if (complete) set.add(String(day))
    else set.delete(String(day))

    const patch: Record<string, string | number | string[]> = {
      completed_days_set: Array.from(set),
    }
    if (complete && day === currentDay && plan && day < plan.durationDays) {
      patch.current_day = day + 1
    }
    setPrefs(patch)
  }, [completedDays, currentDay, plan, setPrefs])

  /** Calendar days since the plan started; 1 on the day it begins. */
  const elapsedDays = useMemo(() => {
    if (!startTime) return 0
    const started = new Date(startTime)
    const startStr = `${started.getFullYear()}-${String(started.getMonth() + 1).padStart(2, '0')}-${String(started.getDate()).padStart(2, '0')}`
    return Math.max(1, daysBetween(startStr, todayStr()) + 1)
  }, [startTime])

  const progressPercent = plan
    ? Math.round((completedDays.length / plan.durationDays) * 100)
    : 0

  return {
    activePlanId,
    plan,
    currentDay,
    startTime,
    completedDays,
    elapsedDays,
    progressPercent,
    isDayComplete: (day: number) => completedDays.includes(day),
    startPlan,
    leavePlan,
    setDay,
    markDayComplete,
  }
}
/* ── Bible reading progress ──────────────────────────────────────────── */

/**
 * Chapter/verse completion and streaks, stored under `BibleProgressPreferences`
 * using the app's exact key names, including its per-translation suffix
 * (`read_chapters_set_WEB`), so progress follows the user across devices and
 * across translations independently.
 *
 * Chapter tokens are `bookIndex(1-based) + chapter(3-digit padded)` encoded as a
 * number, e.g. John 3 -> "43" + "003" -> 43003. The app uses the same encoding.
 */
export function useBibleProgress(versionKey: string) {
    const [prefs, setPrefs] = usePrefs(PREFS.BIBLE_PROGRESS)

  const chaptersKey = `read_chapters_set_${versionKey}`
  const versesKey = `read_verses_set_${versionKey}`

  const readChapters = useMemo<number[]>(() => {
    const raw = prefs[chaptersKey]
    return Array.isArray(raw) ? raw.map(Number).filter(n => !Number.isNaN(n)) : []
  }, [prefs, chaptersKey])

  const readVerses = useMemo<number[]>(() => {
    const raw = prefs[versesKey]
    return Array.isArray(raw) ? raw.map(Number).filter(n => !Number.isNaN(n)) : []
  }, [prefs, versesKey])

  const currentStreak = Number(prefs.current_streak ?? 0) || 0
  const maxStreak = Number(prefs.max_streak ?? 0) || 0
  const maxWeeklyStreak = Number(prefs.max_weekly_streak ?? 0) || 0
  const lastReadDate = typeof prefs.last_read_date_string === 'string'
    ? prefs.last_read_date_string
    : ''

  const activityDates = useMemo<string[]>(() => {
    const raw = prefs.activity_dates_set
    return Array.isArray(raw) ? raw.map(String).sort() : []
  }, [prefs.activity_dates_set])

  /** Encode a chapter reference the way the app stores it. */
  const chapterToken = useCallback(
    (bookIndex: number, chapter: number) =>
      Number(`${bookIndex + 1}${String(chapter).padStart(3, '0')}`),
    [],
  )

  /**
   * Record reading a chapter, updating the streak the same way the app does:
   * repeated reads on the same day are ignored, consecutive days increment the
   * streak, and a gap resets it to 1.
   */
  const markChapterRead = useCallback((bookIndex: number, chapter: number) => {
    const token = chapterToken(bookIndex, chapter)
    const today = todayStr()

    setPrefs(prev => {
      const existing = Array.isArray(prev[chaptersKey])
        ? (prev[chaptersKey] as string[]).map(Number)
        : []
      if (existing.includes(token)) return prev

      const patch: Record<string, string | number | string[]> = {
        [chaptersKey]: [...existing, token].map(String),
      }

      if (lastReadDate !== today) {
        const y = new Date()
        y.setDate(y.getDate() - 1)
        const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`

        const nextStreak = lastReadDate === yesterday ? currentStreak + 1 : 1
        patch.current_streak = nextStreak
        patch.max_streak = Math.max(maxStreak, nextStreak)
        patch.last_read_date_string = today
        patch.activity_dates_set = Array.from(
          new Set([...(Array.isArray(prev.activity_dates_set)
            ? (prev.activity_dates_set as string[])
            : []), today]),
        ).sort()
      }

      return { ...prev, ...patch }
    })
  }, [setPrefs, chaptersKey, chapterToken, lastReadDate, currentStreak, maxStreak])

  const markVerseRead = useCallback((token: number) => {
    setPrefs(prev => {
      const existing = Array.isArray(prev[versesKey])
        ? (prev[versesKey] as string[]).map(Number)
        : []
      if (existing.includes(token)) return prev
      return { ...prev, [versesKey]: [...existing, token].map(String) }
    })
  }, [setPrefs, versesKey])

  const isChapterRead = useCallback(
    (bookIndex: number, chapter: number) => readChapters.includes(chapterToken(bookIndex, chapter)),
    [readChapters, chapterToken],
  )

  const isVerseRead = useCallback(
    (token: number) => readVerses.includes(token),
    [readVerses],
  )

  return {
    readChapters,
    readVerses,
    currentStreak,
    maxStreak,
    maxWeeklyStreak,
    lastReadDate,
    activityDates,
    markChapterRead,
    markVerseRead,
    isChapterRead,
    isVerseRead,
    chapterToken,
  }
}

/* ── Last read position ──────────────────────────────────────────────── */

/**
 * Last place the user was reading, stored under `LastReadPositionPrefs`.
 * The app keys these by 0-based book index.
 */
export function useLastRead() {
    const [prefs, setPrefs] = usePrefs(PREFS.LAST_READ)

  const bookIndex = Number(prefs.last_read_book_index ?? -1)
  const chapter = Number(prefs.last_read_chapter_number ?? -1)
  const versePosition = Number(prefs.last_read_verse_position ?? 0)

  const hasPosition = bookIndex >= 0 && chapter >= 0

  const savePosition = useCallback((
    nextBookIndex: number,
    nextChapter: number,
    nextVersePosition = 0,
  ) => {
    setPrefs({
      last_read_book_index: nextBookIndex,
      last_read_chapter_number: nextChapter,
      last_read_verse_position: nextVersePosition,
    })
  }, [setPrefs])

  const clearPosition = useCallback(() => {
    setPrefs({
      last_read_book_index: -1,
      last_read_chapter_number: -1,
      last_read_verse_position: 0,
    })
  }, [setPrefs])

  return { bookIndex, chapter, versePosition, hasPosition, savePosition, clearPosition }
}