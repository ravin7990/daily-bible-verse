/**
 * Local (device-only) mirror of the sync buckets.
 *
 * Deliberately free of any Firebase import so it can be pulled into the entry
 * bundle safely. Keeping it separate is what lets the rest of cloudSync.ts --
 * and therefore the whole Firebase SDK -- stay off the critical rendering path.
 *
 * ── Namespacing (security-critical) ────────────────────────────────────────
 * Local data is namespaced per account. Anonymous visitors use the `anon`
 * namespace so their progress still works before they create an account; the
 * moment they sign in that data is migrated into their own namespace. Without
 * this, signing out of account A and into account B would push A's private
 * progress into B's cloud backup.
 *
 * ── Timestamps (conflict resolution) ───────────────────────────────────────
 * Alongside every values map we store a parallel `{ key: epochMillis }` map
 * recording when each key was last changed *on this device*. Sync compares
 * these against the cloud's `_ts` sidecar to decide who wins per key. That is
 * what makes deletions propagate: removing an item rewrites the whole array,
 * so the key's new value plus its newer timestamp simply wins.
 */

export type PrefsValue = string | number | boolean | string[]
export type PrefsMap = Record<string, PrefsValue>

/**
 * Prefs files the web owns. Each maps 1:1 to an Android SharedPreferences file,
 * which is what CloudSyncManager backs up and restores.
 *
 * Declared here (rather than in cloudSync.ts) so the file list is available
 * without importing Firebase.
 *
 * The first seven are the files the web reads *and* writes. The remainder are
 * files the app backs up that the web must pull down so it does not clobber
 * them, and that the web progressively adopts as features are built out.
 */
export const PREFS = {
  /* -- web-owned: full read + write -- */
  BIBLE_PROGRESS: 'BibleProgressPreferences',
  LAST_READ: 'LastReadPositionPrefs',
  READING_PLAN: 'ReadingPlanPreferences',
  LIKED_VERSES: 'LikedVersePreferences',
  SAVED_STORIES: 'SavedStoryPreferences',
  READ_STORIES: 'ReadStoryPreferences',
  TEACHINGS: 'JesusTeachingsPreferences',
  APP_SETTINGS: 'DailyBibleVersePrefs',
  VERSE_NOTES: 'VerseNotesPrefs',
  VERSE_HIGHLIGHTS: 'VerseHighlightPreferences',
  PERSONAL_PRAYERS: 'PersonalPrayersPrefs',
  CONFESSIONS: 'WeeklyConfessionsPrefs',
  STORY_LOCKS: 'story_locks',
  PRAYER_INTERACTIONS: 'prayer_interactions_prefs',
  VERSE_HISTORY: 'VerseHistoryPrefs',
  LIKED_COMMUNITY: 'liked_community_creations',
} as const

/** Files the web actively writes. Everything else is pull-only pass-through. */
export const OWNED_PREFS: readonly string[] = [
  PREFS.BIBLE_PROGRESS,
  PREFS.LAST_READ,
  PREFS.READING_PLAN,
  PREFS.LIKED_VERSES,
  PREFS.SAVED_STORIES,
  PREFS.READ_STORIES,
  PREFS.TEACHINGS,
  PREFS.APP_SETTINGS,
  PREFS.VERSE_NOTES,
  PREFS.VERSE_HIGHLIGHTS,
  PREFS.PERSONAL_PRAYERS,
  PREFS.CONFESSIONS,
]

const NS_ANON = 'anon'
const SCHEMA = 'bvtv_v2'

/**
 * The website keeps its own copy in localStorage so progress, saved verses and
 * plan progress all work without an account, then sync on sign-in. This mirrors
 * what the app does locally with SharedPreferences.
 *
 * The active namespace is held in module state (not read from localStorage on
 * every call) because it changes at most a few times per session, on
 * sign-in/sign-out. `initNamespace()` rehydrates it from the persisted session
 * marker at boot so a reload does not fall back to `anon`.
 */

let activeUid: string | null = null

function ns(): string {
  return activeUid || NS_ANON
}

function valuesKey(file: string) {
  return `${SCHEMA}_${ns()}_${file}`
}
function metaKey(file: string) {
  return `${SCHEMA}_${ns()}_ts_${file}`
}
const SESSION_KEY = `${SCHEMA}_session`

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private mode / quota: progress stays in memory for this session.
  }
}

export function getActiveUid(): string | null {
  return activeUid
}

/** True once the visitor has an account, so data is stored under their UID. */
export function isSignedInNamespace(): boolean {
  return activeUid !== null
}

/**
 * Point the storage layer at a namespace. Passing `null` returns to `anon`.
 * Idempotent, so it is safe to call on every auth state change.
 */
export function setNamespace(uid: string | null): void {
  activeUid = uid || null
  try {
    if (activeUid) localStorage.setItem(SESSION_KEY, activeUid)
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* non-fatal */
  }
}

/** Restore the namespace persisted by a previous session, before React mounts. */
export function initNamespace(): void {
  const stored = safeGet(SESSION_KEY)
  activeUid = stored && stored !== NS_ANON ? stored : null
}

/* ── Values ──────────────────────────────────────────────────────────────── */

export function readLocalPrefs(file: string): PrefsMap {
  const raw = safeGet(valuesKey(file))
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as PrefsMap) : {}
  } catch {
    return {}
  }
}

export function writeLocalPrefs(file: string, values: PrefsMap): void {
  safeSet(valuesKey(file), JSON.stringify(values))
}

/* ── Per-key timestamps ──────────────────────────────────────────────────── */

export function readLocalMeta(file: string): Record<string, number> {
  const raw = safeGet(metaKey(file))
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, number>)
      : {}
  } catch {
    return {}
  }
}

export function writeLocalMeta(file: string, meta: Record<string, number>): void {
  safeSet(metaKey(file), JSON.stringify(meta))
}

/**
 * Stamp the given keys as changed right now. Returns the new metadata map so
 * callers can push the same timestamps to the cloud.
 */
export function stampKeys(
  file: string,
  keys: readonly string[],
  at: number = Date.now(),
): Record<string, number> {
  const meta = readLocalMeta(file)
  for (const k of keys) meta[k] = at
  writeLocalMeta(file, meta)
  return meta
}

/* ── Migration & teardown ────────────────────────────────────────────────── */

/**
 * Fold whatever the anonymous visitor accumulated into their new account
 * namespace, then wipe `anon` so it cannot leak into the *next* account to sign
 * in on this device.
 *
 * Existing keys keep their value but are stamped `at`, so the data the user
 * just created on this device beats an older cloud backup rather than being
 * silently replaced by it.
 *
 * Returns the set of files that were touched.
 */
export function migrateAnonTo(uid: string, files: readonly string[], at = Date.now()): string[] {
  if (activeUid === uid) return []
  const previous = activeUid
  setNamespace(uid)
  const touched: string[] = []

  for (const file of files) {
    const anonValues = readLocalPrefsFrom(NS_ANON, file)
    if (!Object.keys(anonValues).length) continue

    const targetValues = readLocalPrefs(file)
    const targetMeta = readLocalMeta(file)
    const merged: PrefsMap = { ...targetValues }

    for (const [k, v] of Object.entries(anonValues)) {
      // Deliberately overwrite on conflict: this is fresher, local user intent.
      merged[k] = v
      targetMeta[k] = at
    }

    writeLocalPrefs(file, merged)
    writeLocalMeta(file, targetMeta)
    touched.push(file)
  }

  if (previous === null || previous === NS_ANON) {
    for (const file of files) {
      safeSet(valuesKeyFrom(NS_ANON, file), '')
      safeSet(metaKeyFrom(NS_ANON, file), '')
    }
  }
  return touched
}

/** Remove one file's data from the active namespace. */
export function clearLocalPrefs(file: string): void {
  safeSet(valuesKey(file), '')
  safeSet(metaKey(file), '')
}

/* -- namespace-parameterised readers, used only during migration ----------- */

function valuesKeyFrom(namespace: string, file: string) {
  return `${SCHEMA}_${namespace}_${file}`
}
function metaKeyFrom(namespace: string, file: string) {
  return `${SCHEMA}_${namespace}_ts_${file}`
}

function readLocalPrefsFrom(namespace: string, file: string): PrefsMap {
  const raw = safeGet(valuesKeyFrom(namespace, file))
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as PrefsMap) : {}
  } catch {
    return {}
  }
}

/** Every file the web knows about, used to drive migration and full syncs. */
export function allPrefsFiles(): string[] {
  return Array.from(new Set(Object.values(PREFS) as string[]))
}