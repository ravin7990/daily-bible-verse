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
 * CRITICAL: the app backs up with `setValue(backupData)`, which REPLACES the
 * whole node. If the web did the same it would erase app-only data (confessions,
 * verse notes, highlights, the Room prayer/studio databases). So this module
 * only ever calls `update()` on individual prefs-file paths, leaving every
 * sibling key untouched, and never deletes keys it did not write.
 *
 * The web owns a deliberately small, well-understood subset. Anything it does
 * not understand passes through untouched in both directions.
 */

import {
  ref as dbRef,
  get,
  update,
  onValue,
  type DatabaseReference,
} from 'firebase/database'
import { rtdb } from './config'
import { readLocalPrefs, writeLocalPrefs, PREFS, type PrefsMap } from '@/utils/localPrefs'
import type { AuthUser } from './auth'

/** Must match CloudSyncManager.SYNC_ROOT. */
const SYNC_ROOT = 'user_backups'

/* -- Typed codec (mirrors the app's prefix scheme) ------------------- */

// PrefsMap (and the local localStorage helpers) live in ./localPrefs so this
// module can be dynamically imported without dragging Firebase into the entry
// bundle.

/** Convert a decoded prefs map back into plain values. */
export function decodePrefs(raw: Record<string, unknown> | null | undefined): PrefsMap {
  const out: PrefsMap = {}
  if (!raw) return out
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('__int__'))        out[key.slice(7)]  = Number(value)
    else if (key.startsWith('__long__'))   out[key.slice(8)]  = Number(value)
    else if (key.startsWith('__float__')) out[key.slice(9)]  = Number(value)
    else if (key.startsWith('__bool__'))   out[key.slice(8)]  = Boolean(value)
    else if (key.startsWith('__stringset__')) {
      out[key.slice(13)] = Array.isArray(value) ? value.map(String) : []
    } else {
      out[key] = typeof value === 'string' ? value : String(value)
    }
  }
  return out
}

/** Convert plain values into the app's prefixed wire format. */
export function encodePrefs(values: PrefsMap): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'boolean')     out[`__bool__${key}`] = value
    else if (typeof value === 'number') out[`__int__${key}`] = Math.trunc(value)
    else if (Array.isArray(value))      out[`__stringset__${key}`] = value.map(String)
    else                                out[key] = String(value)
  }
  return out
}

/* -- Cloud IO ------------------------------------------------------- */

function userRef(uid: string, path = ''): DatabaseReference {
  return path
    ? dbRef(rtdb, `${SYNC_ROOT}/${uid}/${path}`)
    : dbRef(rtdb, `${SYNC_ROOT}/${uid}`)
}

/** Read one prefs file from the cloud. Empty map when never backed up. */
export async function pullPrefs(uid: string, file: string): Promise<PrefsMap> {
  try {
    const snap = await get(userRef(uid, file))
    return decodePrefs(snap.val() as Record<string, unknown> | null)
  } catch {
    // Offline or permission denied - caller falls back to local values.
    return {}
  }
}

/**
 * Merge one prefs file to the cloud using `update()`.
 *
 * Only the supplied keys are written, so every other prefs file (and every key
 * inside this one the web does not own) is left exactly as the app left it.
 * This is what makes the two platforms safe to use side by side.
 */
export async function pushPrefs(uid: string, file: string, values: PrefsMap): Promise<void> {
  const payload = encodePrefs(values)
  if (Object.keys(payload).length === 0) return
  await update(userRef(uid, file), payload)
}

/** Merge several prefs files in one round trip. */
export async function pushMany(uid: string, files: Record<string, PrefsMap>): Promise<void> {
  const payload: Record<string, unknown> = {}
  for (const [file, values] of Object.entries(files)) {
    payload[file] = encodePrefs(values)
  }
  if (Object.keys(payload).length === 0) return
  await update(userRef(uid), payload)
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

/** Live updates for one prefs file. Returns an unsubscribe function. */
export function watchPrefs(
  uid: string,
  file: string,
  onChange: (values: PrefsMap) => void,
): () => void {
  return onValue(userRef(uid, file), (snap) => {
    onChange(decodePrefs(snap.val() as Record<string, unknown> | null))
  })
}

/* -- Merge ---------------------------------------------------------- */

/**
 * Two-way merge for one prefs file: "union wins" for set-like keys, "highest
 * wins" for numeric counters, cloud wins for other scalars.
 *
 * The app's own restore uses the same philosophy (mergeJsonMaps keeps whichever
 * side has a key the other lacks), so both platforms converge rather than
 * clobbering each other.
 */
export function mergePrefs(local: PrefsMap, cloud: PrefsMap): PrefsMap {
  const merged: PrefsMap = { ...cloud }

  for (const [key, localValue] of Object.entries(local)) {
    const cloudValue = cloud[key]

    if (cloudValue === undefined) {
      merged[key] = localValue
      continue
    }

    if (Array.isArray(localValue) && Array.isArray(cloudValue)) {
      merged[key] = Array.from(new Set([...cloudValue, ...localValue]))
      continue
    }

    // Counters (streaks, day numbers) should never go backwards on merge.
    if (typeof localValue === 'number' && typeof cloudValue === 'number') {
      merged[key] = Math.max(localValue, cloudValue)
      continue
    }

    merged[key] = cloudValue
  }

  return merged
}

export interface SyncSummary {
  restored: number
  uploaded: number
  errors: string[]
}

/**
 * Full sync: pull every web-owned prefs file, merge with local, write the
 * result locally and back to the cloud. Idempotent, because merges are unions.
 */
export async function syncAll(uid: string, user: AuthUser | null): Promise<SyncSummary> {
  const files = Object.values(PREFS)
  const summary: SyncSummary = { restored: 0, uploaded: 0, errors: [] }
  const merged: Record<string, PrefsMap> = {}

  for (const file of files) {
    try {
      const local = readLocalPrefs(file)
      const cloud = await pullPrefs(uid, file)
      const result = mergePrefs(local, cloud)

      if (Object.keys(result).length) {
        writeLocalPrefs(file, result)
        merged[file] = result
        summary.restored += Object.keys(cloud).length
        summary.uploaded += Object.keys(local).filter(
          k => JSON.stringify(local[k]) !== JSON.stringify(result[k]),
        ).length
      }
    } catch (e) {
      summary.errors.push(`${file}: ${(e as Error).message}`)
    }
  }

  try {
    if (Object.keys(merged).length) await pushMany(uid, merged)
    await markWebSynced(uid, user)
  } catch (e) {
    summary.errors.push(`upload: ${(e as Error).message}`)
  }

  return summary
}