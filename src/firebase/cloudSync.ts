/**
 * Cross-platform cloud sync with the Android app.
 *
 * The app (CloudSyncManager.kt) stores backups in Realtime Database under
 * `user_backups/{uid}`, serialising each SharedPreferences file as a flat map
 * with type-prefixed keys:
 *
 *     "ReadingPlanPreferences": {
 *        "active_plan_id": "peace_7",          // String  -> bare key
 *        "__int__current_day": 3,              // Int     -> __int__
 *        "__long__start_time": 1750000000000,  // Long    -> __long__
 *        "__stringset__completed_days_set": ["1","2"]  // Set<String>
 *     }
 *
 * ── Safety rule ────────────────────────────────────────────────────────────
 * This module NEVER calls `setValue`/`set` on a prefs file. The app's original
 * `backupToCloud` did exactly that, which replaced the whole node and silently
 * destroyed anything the web had written. Both sides now write with
 * `update`/`updateChildren` so only the keys each side actually owns are
 * touched, and keys we do not understand pass through untouched in both
 * directions.
 *
 * ── Conflict resolution ────────────────────────────────────────────────────
 * A plain "union wins" merge cannot express *deletions*: un-bookmarking a verse
 * on the phone would be undone by the web's cached copy forever. So alongside
 * the values we keep a sidecar node
 *
 *     user_backups/{uid}/_ts/{file}/{key} = epochMillis
 *
 * recording when each key last changed, written by both platforms. Sync is then
 * plain Last-Write-Wins per key, with a small set of monotonic keys (streak
 * counters) that always take the maximum. Because each key is written whole,
 * an array losing an item is just a newer write of that array, so deletions
 * propagate correctly.
 *
 * The sidecar is namespaced (`_ts`) so it never collides with the prefs files
 * themselves, which are plain `String` keys at that level.
 */

import {
  ref as dbRef,
  get,
  update,
  onValue,
  type DatabaseReference,
} from 'firebase/database'
import { rtdb } from './config'
import {
  readLocalPrefs,
  writeLocalPrefs,
  readLocalMeta,
  writeLocalMeta,
  stampKeys,
  OWNED_PREFS,
  type PrefsMap,
} from '@/utils/localPrefs'
import type { AuthUser } from './auth'

/** Must match CloudSyncManager.SYNC_ROOT. */
const SYNC_ROOT = 'user_backups'
/** Must match CloudSyncManager.TS_NODE. */
const TS_NODE = '_ts'

/**
 * Android's `SharedPreferences.getInt` stores a 32-bit int, so any integer that
 * cannot round-trip through one must be tagged `__long__`. Without this the web
 * would write `start_time` (epoch millis, ~1.75e12) as `__int__`, and the app's
 * restore would call `.toInt()` on it, overflowing to a nonsense date.
 */
const INT32_MIN = -2147483648
const INT32_MAX = 2147483647

/* -- Typed codec & merge -------------------------------------------------
 *
 * Both live in ./syncCodec, which imports neither Firebase nor the DOM, so the
 * two functions that decide whether a user's data survives a round trip can be
 * unit tested directly. Re-exported here because callers already import them
 * from this module.
 */
export {
  decodePrefs,
  encodePrefs,
  mergePrefs,
  MONOTONIC_KEYS,
  type CloudPrefs,
  type MergeResult,
} from './syncCodec'

import {
  decodePrefs,
  encodePrefs,
  mergePrefs,
  type CloudPrefs,
} from './syncCodec'

/* -- Cloud IO ------------------------------------------------------- */

function userRef(uid: string, path = ''): DatabaseReference {
  return path
    ? dbRef(rtdb, `${SYNC_ROOT}/${uid}/${path}`)
    : dbRef(rtdb, `${SYNC_ROOT}/${uid}`)
}

function tsRef(uid: string, file: string): DatabaseReference {
  return dbRef(rtdb, `${SYNC_ROOT}/${uid}/${TS_NODE}/${file}`)
}

/**
 * Read one prefs file plus its timestamp sidecar.
 *
 * Both reads are issued together so the pair is as close to a consistent
 * snapshot as RTDB allows. A missing sidecar (an account that predates this
 * format) decodes to zeros, which makes the local side win on first sync and
 * lets the next push seed the timestamps.
 */
export async function pullPrefsWithMeta(uid: string, file: string): Promise<CloudPrefs> {
  try {
    const [valuesSnap, tsSnap] = await Promise.all([
      get(userRef(uid, file)),
      get(tsRef(uid, file)),
    ])
    return {
      values: decodePrefs(valuesSnap.val() as Record<string, unknown> | null),
      ts: (tsSnap.val() as Record<string, number> | null) ?? {},
    }
  } catch {
    // Offline or permission denied - caller falls back to local values.
    return { values: {}, ts: {} }
  }
}

/** Backwards-compatible single-map read. */
export async function pullPrefs(uid: string, file: string): Promise<PrefsMap> {
  return (await pullPrefsWithMeta(uid, file)).values
}

/**
 * Write specific keys plus their timestamps.
 *
 * Only the supplied keys are written, so every other prefs file (and every key
 * inside this one the web does not own) is left exactly as the app left it.
 * This is what makes the two platforms safe to use side by side.
 */
export async function pushPrefs(
  uid: string,
  file: string,
  values: PrefsMap,
  ts: Record<string, number>,
): Promise<void> {
  const payload = encodePrefs(values)
  if (Object.keys(payload).length === 0) return
  await update(userRef(uid, file), payload)
  if (Object.keys(ts).length) await update(tsRef(uid, file), ts)
}

/** Merge several prefs files (and their timestamps) in one round trip. */
export async function pushMany(
  uid: string,
  files: Record<string, CloudPrefs>,
): Promise<void> {
  const data: Record<string, unknown> = {}
  const ts: Record<string, unknown> = {}
  for (const [file, entry] of Object.entries(files)) {
    const encoded = encodePrefs(entry.values)
    if (Object.keys(encoded).length) data[file] = encoded
    if (Object.keys(entry.ts).length) ts[file] = entry.ts
  }
  if (Object.keys(data).length) await update(userRef(uid), data)
  if (Object.keys(ts).length) await update(dbRef(rtdb, `${SYNC_ROOT}/${uid}/${TS_NODE}`), ts)
}

/**
 * Read the app's sync timestamp. Mirrors CloudSyncManager.checkBackupExists.
 * The web writes its marker to `_web_sync_meta` rather than `_sync_meta` so
 * neither platform overwrites the other's timestamp.
 */
export async function getAppLastSync(uid: string): Promise<{ timestamp: number; email?: string } | null> {
  try {
    const snap = await get(userRef(uid, '_sync_meta'))
    const meta = snap.val() as { timestamp?: number; email?: string } | null
    if (!meta?.timestamp) return null
    return { timestamp: meta.timestamp, email: meta.email }
  } catch {
    return null
  }
}

/** Write a web-side sync marker without touching the app's `_sync_meta`. */
export async function markWebSynced(uid: string, user: AuthUser | null): Promise<void> {
  try {
    await update(userRef(uid), {
      _web_sync_meta: {
        timestamp: Date.now(),
        platform: 'web',
        email: user?.email ?? 'unknown',
      },
    })
  } catch {
    // Non-fatal: the data is already synced, only the marker failed.
  }
}

/**
 * Live updates for one prefs file: the phone -> browser push channel.
 *
 * Both the values and the sidecar are watched, because a change made on the
 * phone lands in two writes and applying the first without its timestamp would
 * let a stale value win. The callback fires only once both halves are known.
 */
export function watchPrefs(
  uid: string,
  file: string,
  onChange: (values: PrefsMap, ts: Record<string, number>) => void,
): () => void {
  let values: PrefsMap | null = null
  let ts: Record<string, number> | null = null
  let cancelled = false

  const emit = () => {
    if (!cancelled && values !== null && ts !== null) onChange(values, ts)
  }

  const offValues = onValue(userRef(uid, file), snap => {
    values = decodePrefs(snap.val() as Record<string, unknown> | null)
    emit()
  })
  const offTs = onValue(tsRef(uid, file), snap => {
    ts = (snap.val() as Record<string, number> | null) ?? {}
    emit()
  })

  return () => {
    cancelled = true
    offValues()
    offTs()
  }
}

/* -- Merge ---------------------------------------------------------- */

/**
 * Two-way merge for one prefs file, resolved per key with Last-Write-Wins.
 *
 * Ties (equal or missing timestamps) go to the cloud, so a device that has
 * simply never seen this data before cannot clobber an established account -
 * the alternative made a brand-new web visit wipe a phone backup on first
 * sign-in.
 *
 * `dirty` lists the keys the local side won and therefore still has to push.
 */

export interface SyncSummary {
  restored: number
  uploaded: number
  errors: string[]
}

/**
 * Full sync: pull every web-owned prefs file, merge per key, then write the
 * result both locally and to the cloud. Idempotent - a second run with no
 * intervening edits writes nothing.
 */
export async function syncAll(uid: string, user: AuthUser | null): Promise<SyncSummary> {
  const summary: SyncSummary = { restored: 0, uploaded: 0, errors: [] }
  const toPush: Record<string, CloudPrefs> = {}

  for (const file of OWNED_PREFS) {
    try {
      const local = readLocalPrefs(file)
      const localMeta = readLocalMeta(file)
      const cloud = await pullPrefsWithMeta(uid, file)
      const { values, ts, dirty } = mergePrefs(local, cloud.values, localMeta, cloud.ts)

      if (!Object.keys(values).length) continue

      writeLocalPrefs(file, values)
      writeLocalMeta(file, ts)
      summary.restored += Object.keys(cloud.values).length

      if (dirty.length) {
        const delta: PrefsMap = {}
        const deltaTs: Record<string, number> = {}
        for (const key of dirty) {
          delta[key] = values[key]
          deltaTs[key] = ts[key]
        }
        toPush[file] = { values: delta, ts: deltaTs }
        summary.uploaded += dirty.length
      }
    } catch (e) {
      summary.errors.push(`${file}: ${(e as Error).message}`)
    }
  }

  try {
    if (Object.keys(toPush).length) await pushMany(uid, toPush)
    await markWebSynced(uid, user)
  } catch (e) {
    summary.errors.push(`upload: ${(e as Error).message}`)
  }

  return summary
}

/* -- Offline outbox ------------------------------------------------- */

/**
 * Writes attempted while offline used to be dropped on the floor
 * (`.catch(() => {})`), so a bookmark made on the subway simply vanished.
 * Anything that fails to reach the cloud is queued here and replayed when the
 * connection returns.
 *
 * The queue is per-account and holds only the latest value per key, so it
 * cannot grow without bound and replaying it is idempotent.
 */
const outbox = new Map<string, { uid: string; file: string; values: PrefsMap; ts: Record<string, number> }>()

export function queuePush(
  uid: string,
  file: string,
  values: PrefsMap,
  ts: Record<string, number>,
): void {
  const existing = outbox.get(`${uid}/${file}`)
  if (existing) {
    outbox.set(`${uid}/${file}`, {
      uid,
      file,
      values: { ...existing.values, ...values },
      ts: { ...existing.ts, ...ts },
    })
  } else {
    outbox.set(`${uid}/${file}`, { uid, file, values: { ...values }, ts: { ...ts } })
  }
}

export function pendingPushCount(uid: string): number {
  let n = 0
  for (const entry of outbox.values()) if (entry.uid === uid) n++
  return n
}

/** Replay everything queued for one account. Returns the number flushed. */
export async function flushOutbox(uid: string): Promise<number> {
  const entries = Array.from(outbox.values()).filter(e => e.uid === uid)
  let flushed = 0
  for (const entry of entries) {
    try {
      await pushPrefs(uid, entry.file, entry.values, entry.ts)
      outbox.delete(`${uid}/${entry.file}`)
      flushed++
    } catch {
      // Still offline; leave it queued for the next attempt.
    }
  }
  return flushed
}