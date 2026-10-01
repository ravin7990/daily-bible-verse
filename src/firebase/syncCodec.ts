/**
 * The pure, side-effect-free half of the sync protocol.
 *
 * Split out from `cloudSync.ts` deliberately: these are the functions whose
 * correctness is a matter of data safety rather than plumbing, they must be
 * testable without booting Firebase, and both platforms have to agree with them
 * byte for byte. Nothing here touches the network, the DOM or module state.
 *
 * ── The wire format (must match CloudSyncManager.kt) ────────────────────────
 * Each prefs file is a flat map whose keys carry a type prefix, because
 * Realtime Database has no int/long/float distinction and SharedPreferences
 * does:
 *
 *     "ReadingPlanPreferences": {
 *        "active_plan_id": "peace_7",            // String  -> bare
 *        "__int__current_day": 3,                // Int     -> __int__
 *        "__long__start_time": 1750000000000,    // Long    -> __long__
 *        "__float__volume": 0.5,                 // Float   -> __float__
 *        "__bool__darkModeEnabled": true,        // Boolean -> __bool__
 *        "__stringset__liked_verses_set": ["a"]  // Set<String>
 *     }
 *
 * ── Why timestamps exist ────────────────────────────────────────────────────
 * A "union wins" merge cannot express a deletion: un-bookmarking a verse on the
 * phone would be undone forever by the web's cached copy. So every key also
 * carries an epoch-millis timestamp in the `_ts` sidecar, written by both
 * platforms, and the merge is plain Last-Write-Wins per key. Since a key is
 * written whole, an array losing an item is just a newer write of that array -
 * so removals propagate correctly in both directions.
 */

import type { PrefsMap } from '@/utils/localPrefs'

/**
 * Android's `SharedPreferences.getInt` is 32-bit, so any integer outside this
 * range must be tagged `__long__`.
 *
 * Getting this wrong is not cosmetic: writing epoch millis as `__int__` makes the
 * app call `.toInt()` on 1.75e12, which overflows, and the reading plan the user
 * started lands in 1970.
 */
const INT32_MIN = -2147483648
const INT32_MAX = 2147483647

/**
 * Keys whose value is a record high-water mark rather than current state. These
 * always take the maximum, regardless of timestamps, so a device with a stale
 * clock (or a stale snapshot) can never lower somebody's best streak.
 *
 * Mirrors `MONOTONIC_KEYS` in CloudSyncManager.kt.
 */
export const MONOTONIC_KEYS: ReadonlySet<string> = new Set([
  'max_streak',
  'max_weekly_streak',
  'previous_streak',
])

/** One prefs file as stored in the cloud: the values plus their timestamps. */
export interface CloudPrefs {
  values: PrefsMap
  ts: Record<string, number>
}

/** Convert a decoded wire map back into plain values. */
export function decodePrefs(raw: Record<string, unknown> | null | undefined): PrefsMap {
  const out: PrefsMap = {}
  if (!raw) return out
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('__int__'))          out[key.slice(7)]  = Number(value)
    else if (key.startsWith('__long__'))    out[key.slice(8)]  = Number(value)
    else if (key.startsWith('__float__'))   out[key.slice(9)]  = Number(value)
    else if (key.startsWith('__bool__'))    out[key.slice(8)]  = value === true || value === 'true'
    else if (key.startsWith('__stringset__')) out[key.slice(13)] = Array.isArray(value) ? value.map(String) : []
    else out[key] = typeof value === 'string' ? value : String(value)
  }
  return out
}

/**
 * Convert plain values into the wire format.
 *
 * The number branch is the whole point: RTDB stores every number as a double, so
 * the prefix is the only signal the app gets about which SharedPreferences type
 * to read back into.
 */
export function encodePrefs(values: PrefsMap): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'boolean') {
      out[`__bool__${key}`] = value
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value)) continue
      if (!Number.isInteger(value))                    out[`__float__${key}`] = value
      else if (value < INT32_MIN || value > INT32_MAX) out[`__long__${key}`]  = Math.trunc(value)
      else                                             out[`__int__${key}`]   = Math.trunc(value)
    } else if (Array.isArray(value)) {
      out[`__stringset__${key}`] = value.map(String)
    } else {
      out[key] = String(value)
    }
  }
  return out
}

/**
 * Keys whose value is a JSON *object* mapping an id to a payload, e.g. a verse
 * note per verse or a confession per week.
 *
 * These cannot be resolved by Last-Write-Wins: each side routinely adds its own
 * entry while leaving the other's alone, so "newer wins" would silently delete
 * whichever entry was written first. They are unioned per key instead, which is
 * what `mergeJsonMaps` does in CloudSyncManager.
 */
const JSON_MAP_KEYS: ReadonlySet<string> = new Set([
  'personal_verse_notes_map',
  'weekly_confessions_map',
])

/**
 * Keys holding a JSON *array* of objects with an `id`, e.g. the personal prayer
 * journal. Unioned by id, mirroring `mergePrayersJson` in CloudSyncManager.
 */
const JSON_ID_LIST_KEYS: ReadonlySet<string> = new Set([
  'personal_prayers_list',
])

function tryParseJson(raw: string): unknown | undefined {
  const text = raw.trim()
  if (!text || text === 'null') return undefined
  try {
    return JSON.parse(text)
  } catch {
    // Not valid JSON: leave it to Last-Write-Wins rather than destroying it.
    return undefined
  }
}

/** Union two JSON object strings entry by entry. Falls back to plain LWW input. */
function mergeJsonMaps(localValue: string, cloudValue: string): string | undefined {
  const local = tryParseJson(localValue)
  const cloud = tryParseJson(cloudValue)
  if (!local || !cloud || typeof local !== 'object' || typeof cloud !== 'object') return undefined
  if (Array.isArray(local) || Array.isArray(cloud)) return undefined
  return JSON.stringify({ ...(cloud as object), ...(local as object) })
}

/** Union two JSON array-of-{id} strings by id, preserving both sides' entries. */
function mergeIdLists(localValue: string, cloudValue: string): string | undefined {
  const local = tryParseJson(localValue)
  const cloud = tryParseJson(cloudValue)
  if (!Array.isArray(local) || !Array.isArray(cloud)) return undefined

  const seen = new Set<string>()
  const out: unknown[] = []
  // Cloud first so an id present on both sides keeps the cloud's payload, matching
  // the tie-break used everywhere else.
  for (const item of [...cloud, ...local]) {
    if (item && typeof item === 'object') {
      const id = (item as { id?: unknown }).id
      const key = id == null ? null : String(id)
      if (key !== null) {
        if (seen.has(key)) continue
        seen.add(key)
      }
    }
    out.push(item)
  }
  return JSON.stringify(out)
}

/** The result of reconciling one prefs file. */
export interface MergeResult {
  values: PrefsMap
  ts: Record<string, number>
  /** Keys the local side won and therefore still has to push. */
  dirty: string[]
}

/**
 * Reconcile one prefs file, resolved per key with Last-Write-Wins.
 *
 * Ties - equal or missing timestamps - go to the cloud. That direction is
 * deliberate: a device which has simply never seen this data before must not be
 * able to clobber an established account, which is what made a first web visit
 * wipe a phone backup.
 *
 * Mirrors `mergePrefsAgainstCloud` in CloudSyncManager.kt.
 */
export function mergePrefs(
  local: PrefsMap,
  cloud: PrefsMap,
  localTs: Record<string, number>,
  cloudTs: Record<string, number>,
): MergeResult {
  const values: PrefsMap = {}
  const ts: Record<string, number> = {}
  const dirty: string[] = []
  const keys = new Set([...Object.keys(local), ...Object.keys(cloud)])

  for (const key of keys) {
    const inLocal = key in local
    const inCloud = key in cloud
    const lts = localTs[key] ?? 0
    const cts = cloudTs[key] ?? 0

    if (!inLocal) {
      // Known only to the cloud: adopt it, nothing to send back.
      values[key] = cloud[key]
      ts[key] = cts
      continue
    }
    if (!inCloud) {
      // Known only here. This MUST stay dirty: without it, anything the user
      // creates on a device the cloud has not seen yet (a brand-new bookmark, a
      // note, a reading-plan day) would be silently dropped instead of uploaded.
      values[key] = local[key]
      ts[key] = lts
      dirty.push(key)
      continue
    }

    if (MONOTONIC_KEYS.has(key)) {
      values[key] = Math.max(Number(local[key]), Number(cloud[key]))
      ts[key] = Math.max(lts, cts)
      continue
    }

    // Independently-added entries inside a JSON payload have to be unioned, not
    // resolved by age, or each side loses the other's rows.
    if (typeof local[key] === 'string' && typeof cloud[key] === 'string') {
      const merged = JSON_MAP_KEYS.has(key)
        ? mergeJsonMaps(local[key] as string, cloud[key] as string)
        : JSON_ID_LIST_KEYS.has(key)
          ? mergeIdLists(local[key] as string, cloud[key] as string)
          : undefined

      if (merged !== undefined) {
        values[key] = merged
        // Both sides changed relative to each other, so re-publish the union and
        // advance the timestamp so the next sync sees it as settled.
        ts[key] = Math.max(lts, cts) + 1
        dirty.push(key)
        continue
      }
    }

    if (lts > cts) {
      values[key] = local[key]
      ts[key] = lts
      dirty.push(key)
    } else {
      values[key] = cloud[key]
      ts[key] = cts
    }
  }

  return { values, ts, dirty }
}

