/**
 * Local (device-only) mirror of the sync buckets.
 *
 * Deliberately free of any Firebase import so it can be pulled into the entry
 * bundle safely. Keeping it separate is what lets the rest of cloudSync.ts --
 * and therefore the whole Firebase SDK -- stay off the critical rendering path.
 */

export type PrefsMap = Record<string, string | number | boolean | string[]>

/**
 * Prefs files the web owns. Each maps 1:1 to an Android SharedPreferences file,
 * which is what CloudSyncManager backs up and restores.
 *
 * Declared here (rather than in cloudSync.ts) so the file list is available
 * without importing Firebase.
 */
export const PREFS = {
  BIBLE_PROGRESS: 'BibleProgressPreferences',
  LAST_READ: 'LastReadPositionPrefs',
  READING_PLAN: 'ReadingPlanPreferences',
  LIKED_VERSES: 'LikedVersePreferences',
  SAVED_STORIES: 'SavedStoryPreferences',
  READ_STORIES: 'ReadStoryPreferences',
  TEACHINGS: 'JesusTeachingsPreferences',
} as const

const LOCAL_PREFIX = 'bvtv_'

/**
 * The website keeps its own copy in localStorage so progress, saved verses and
 * plan progress all work without an account, then sync on sign-in. This mirrors
 * what the app does locally with SharedPreferences.
 */
export function readLocalPrefs(file: string): PrefsMap {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + file)
    return raw ? (JSON.parse(raw) as PrefsMap) : {}
  } catch {
    return {}
  }
}

export function writeLocalPrefs(file: string, values: PrefsMap) {
  try {
    localStorage.setItem(LOCAL_PREFIX + file, JSON.stringify(values))
  } catch {
    // Private mode / quota: progress stays in memory for this session.
  }
}