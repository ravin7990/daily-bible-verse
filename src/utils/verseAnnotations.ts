/**
 * Per-verse notes + highlights, stored exactly the way the Android app stores
 * them so the two platforms stay in lockstep through cloud sync.
 *
 * ── Notes ── `VerseNotesPrefs` ──────────────────────────────────────────────
 * One String key, `personal_verse_notes_map`, holding a JSON object:
 *
 *     personal_verse_notes_map = '{"john_3_16":"God so loved the world"}'
 *
 * Mirrors VerseNotesPreferences.kt. Saving a blank note DELETES that verse id
 * from the map, which is what the app's `saveNote` does.
 *
 * ── Highlights ── `VerseHighlightPreferences` ───────────────────────────────
 * A *flat* map where the preference key IS the verse id and the value is a
 * String `"<color>:<start>:<end>:<timestampMillis>"` (empty start/end = the whole
 * verse, so a colour with no colon serialises as `"<color>::<timestamp>"`).
 * Mirrors VerseHighlightPrefs.kt. There is deliberately no wrapper object: the
 * app would not understand one, so the web reads every String-valued key in the
 * file as a highlight instead.
 *
 * Removal note: `usePrefs` can only merge keys (RTDB `update()` cannot express a
 * delete), so removing a highlight writes an empty String. Both platforms treat
 * that as "no highlight" -- `getHighlightColor` returns null for an empty value
 * and `getAllHighlights` skips empty ones -- so it is behaviourally identical to
 * the app's `remove()`, which drops the key outright.
 */

import { useCallback, useMemo } from 'react'
import { usePrefs, PREFS } from '@/auth/AuthProvider'
import type { PrefsMap } from '@/utils/localPrefs'

/** The one key the app uses inside `VerseNotesPrefs`. */
const NOTES_MAP_KEY = 'personal_verse_notes_map'

/* ── Highlight colours ─────────────────────────────────────────────────────── */

/**
 * The app's colour vocabulary, taken from `dialog_verse_highlight.xml` and the
 * `when (colorName)` branches in VerseAdapter / AllHighlightsFragment.
 *
 * These names are the sync contract: writing "gold" instead of "yellow" would
 * produce a highlight the phone renders with its `else -> yellow` fallback.
 */
export type HighlightColorName = 'yellow' | 'green' | 'blue' | 'pink' | 'orange'

export interface HighlightSwatch {
  name:  HighlightColorName
  label: string
  /** Opaque dot / border colour (AllHighlightsFragment's `dotColor`). */
  solid: string
  /** Translucent wash behind the verse text (its 0x66-alpha background). */
  wash:  string
}

export const HIGHLIGHT_COLORS: readonly HighlightSwatch[] = [
  { name: 'yellow', label: 'Yellow', solid: '#FFE066', wash: 'rgba(255, 224, 102, 0.55)' },
  { name: 'green',  label: 'Green',  solid: '#69F59B', wash: 'rgba(105, 245, 155, 0.55)' },
  { name: 'blue',   label: 'Blue',   solid: '#33B3FF', wash: 'rgba(51, 179, 255, 0.55)' },
  { name: 'pink',   label: 'Pink',   solid: '#FF66B2', wash: 'rgba(255, 102, 178, 0.55)' },
  { name: 'orange', label: 'Orange', solid: '#FF9F40', wash: 'rgba(255, 159, 64, 0.55)' },
]

/** Look up a swatch by name, falling back to the app's own default (yellow). */
export function highlightSwatch(name: string): HighlightSwatch {
  return HIGHLIGHT_COLORS.find(c => c.name === name.toLowerCase()) ?? HIGHLIGHT_COLORS[0]
}

/* ── Verse ids ────────────────────────────────────────────────────────────── */

/**
 * Build the id both platforms use for a Bible-reader verse.
 *
 * Byte-for-byte identical to `LikedVersePrefs.createUniqueVerseId`, which is what
 * the app passes to both VerseNotesPreferences and VerseHighlightPrefs from the
 * reader: `"${bookName.lowercase().replace(" ", "")}_${chapter}_${verse}"`.
 */
export function createVerseId(bookName: string, chapter: number, verse: number): string {
  return `${bookKey(bookName)}_${chapter}_${verse}`
}

/** `"1 Samuel"` -> `"1samuel"`. The id prefix the app derives from the book name. */
export function bookKey(bookName: string): string {
  return bookName.toLowerCase().replace(/\s+/g, '')
}

/** `<bookKey>_<chapter>_<verse>` -- the shape both platforms write. */
const VERSE_ID_RE = /^([a-z0-9]+)_(\d+)_(\d+)$/
/** Daily devotional content ids, e.g. `2026-01-01-001` (VerseCard `content.id`). */
const DAILY_ID_RE = /^(\d{4}-\d{2}-\d{2})-\d{3}$/

export interface ParsedVerseId {
  bookKey: string
  chapter: number
  verse:   number
}

export function parseVerseId(verseId: string): ParsedVerseId | null {
  const m = VERSE_ID_RE.exec(verseId)
  if (!m) return null
  return { bookKey: m[1], chapter: Number(m[2]), verse: Number(m[3]) }
}

export function isDailyContentId(id: string): boolean {
  return DAILY_ID_RE.test(id)
}

/** The date embedded in a daily content id, e.g. `2026-01-01-001` -> `2026-01-01`. */
export function dailyContentDate(id: string): string {
  return DAILY_ID_RE.exec(id)?.[1] ?? ''
}

/** `"John 3:16"`, or null when the id is not a reader verse id. */
export function formatVerseReference(verseId: string, bookName?: string): string | null {
  const parsed = parseVerseId(verseId)
  if (!parsed) return null
  return `${bookName ?? parsed.bookKey} ${parsed.chapter}:${parsed.verse}`
}
/* ── Highlight value format ───────────────────────────────────────────────── */

export interface ParsedHighlight {
  colorName: string
  /** Character offsets, or null for a whole-verse highlight. */
  start:    number | null
  end:      number | null
  timestamp: number
}

/** Kotlin `toIntOrNull()`: digits only, otherwise null. */
function toIntOrNull(raw: string | undefined): number | null {
  if (raw === undefined || raw === '') return null
  const n = Number.parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

/** Kotlin `toLongOrNull()`, used for the epoch-millis stamp. */
function toLongOrNull(raw: string | undefined): number {
  if (raw === undefined || raw === '') return 0
  const n = Number(raw)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

/**
 * Port of `VerseHighlightPrefs.parseHighlight`.
 *
 * Accepts 2, 3 or 4 colon-separated parts so it reads back values written by
 * older app builds (a bare colour name, a colour + range, or the current
 * colour + range + timestamp form).
 */
export function parseHighlight(value: string): ParsedHighlight {
  const parts = value.split(':')
  const colorName = parts[0] ?? ''

  if (parts.length === 4) {
    return {
      colorName,
      start: toIntOrNull(parts[1]),
      end: toIntOrNull(parts[2]),
      timestamp: toLongOrNull(parts[3]),
    }
  }
  if (parts.length === 3) {
    // `"<color>::<timestamp>"` -- the empty second part means whole verse.
    if (parts[1] === '') {
      return { colorName, start: null, end: null, timestamp: toLongOrNull(parts[2]) }
    }
    return { colorName, start: toIntOrNull(parts[1]), end: toIntOrNull(parts[2]), timestamp: 0 }
  }
  return { colorName, start: null, end: null, timestamp: 0 }
}

/**
 * Serialise a whole-verse highlight the way `saveHighlightColor` does.
 *
 * The app branches on whether the colour itself contains a colon; our palette
 * never does, so the result is always `"<color>::<timestamp>"`, which
 * `parseHighlight` reads back as a whole-verse highlight with a real timestamp.
 */
export function formatHighlight(colorName: string, timestamp: number = Date.now()): string {
  return colorName.includes(':') ? `${colorName}:${timestamp}` : `${colorName}::${timestamp}`
}

export interface VerseHighlight extends ParsedHighlight {
  verseId: string
}

/**
 * Split verse text around the highlighted range.
 *
 * The app's offsets are relative to `"<verseNumber> <text>"` (VerseAdapter builds
 * exactly that string), so the verse-number prefix is subtracted before slicing --
 * the same adjustment AllHighlightsFragment makes when it lists highlights.
 * Returns null when the whole verse is highlighted.
 */
export function highlightSegments(
  text: string,
  verseNumber: number,
  highlight: ParsedHighlight | null,
): { before: string; marked: string; after: string } | null {
  if (!highlight || highlight.start === null || highlight.end === null) return null

  const prefix = `${verseNumber} `
  const start = Math.max(0, highlight.start - prefix.length)
  const end = Math.min(text.length, highlight.end - prefix.length)
  if (start >= end || start >= text.length) return null

  return { before: text.slice(0, start), marked: text.slice(start, end), after: text.slice(end) }
}

/* ── Notes ────────────────────────────────────────────────────────────────── */

/** Parse `personal_verse_notes_map`, dropping anything that is not usable text. */
export function readNotesMap(prefs: PrefsMap): Record<string, string> {
  const raw = prefs[NOTES_MAP_KEY]
  if (typeof raw !== 'string' || !raw.trim()) return {}

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

  const out: Record<string, string> = {}
  for (const [id, text] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof text === 'string' && text.trim()) out[id] = text
  }
  return out
}

/**
 * Every personal note, keyed by verse id.
 *
 * Reading works signed out (localStorage) and updates the moment the app writes
 * on the phone, because `usePrefs` merges cloud changes straight into its state.
 */
export function useVerseNotes() {
  const [prefs, setPrefs] = usePrefs(PREFS.VERSE_NOTES)
  const notes = useMemo(() => readNotesMap(prefs), [prefs])

  const getNote = useCallback((verseId: string) => notes[verseId] ?? '', [notes])

  /**
   * Write (or clear) one note. A blank note removes the verse from the map,
   * matching `VerseNotesPreferences.saveNote`.
   *
   * Uses the updater form so a note saved here cannot clobber a note that
   * arrived from the phone between render and click.
   */
  const saveNote = useCallback((verseId: string, text: string) => {
    setPrefs(prev => {
      const next = readNotesMap(prev)
      if (text.trim()) next[verseId] = text
      else delete next[verseId]
      return { ...prev, [NOTES_MAP_KEY]: JSON.stringify(next) }
    })
  }, [setPrefs])

  const deleteNote = useCallback((verseId: string) => saveNote(verseId, ''), [saveNote])

  return { notes, getNote, saveNote, deleteNote, count: Object.keys(notes).length }
}

/* ── Highlights ───────────────────────────────────────────────────────────── */

/**
 * Collect the highlight map out of the flat `VerseHighlightPreferences` file.
 *
 * Mirrors `getAllHighlights` (String values only, non-empty) and, like
 * `AllHighlightsFragment`, skips any key that is not a verse id -- so a stray
 * preference in the same file, or a type-prefixed wire artefact, can never be
 * mistaken for a highlight.
 */
export function readHighlightMap(prefs: PrefsMap): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(prefs)) {
    if (typeof value !== 'string' || !value) continue
    if (key.startsWith('__')) continue
    if (!VERSE_ID_RE.test(key)) continue
    out[key] = value
  }
  return out
}

/** Every highlight in the current account/device, newest first. */
export function useVerseHighlights() {
  const [prefs, setPrefs] = usePrefs(PREFS.VERSE_HIGHLIGHTS)
  const raw = useMemo(() => readHighlightMap(prefs), [prefs])

  const highlights = useMemo<VerseHighlight[]>(
    () =>
      Object.entries(raw)
        .map(([verseId, value]) => ({ verseId, ...parseHighlight(value) }))
        .sort((a, b) => b.timestamp - a.timestamp),
    [raw],
  )

  const getHighlight = useCallback(
    (verseId: string): ParsedHighlight | null => {
      const value = raw[verseId]
      return value === undefined ? null : parseHighlight(value)
    },
    [raw],
  )

  /** Write the flat `verseId -> "colour::timestamp"` pair the app expects. */
  const setHighlight = useCallback((verseId: string, colorName: HighlightColorName) => {
    setPrefs(prev => ({ ...prev, [verseId]: formatHighlight(colorName) }))
  }, [setPrefs])

  /**
   * Remove a highlight.
   *
   * The key is blanked rather than deleted because the shared sync layer can
   * only merge; see the file header for why that is equivalent to the app's
   * `removeHighlight` on both platforms.
   */
  const removeHighlight = useCallback((verseId: string) => {
    setPrefs(prev => ({ ...prev, [verseId]: '' }))
  }, [setPrefs])

  /** Pick a colour; picking the colour already applied clears the highlight. */
  const toggleHighlight = useCallback((verseId: string, colorName: HighlightColorName) => {
    setPrefs(prev => {
      const current = prev[verseId]
      const applied = typeof current === 'string'
        ? parseHighlight(current).colorName.toLowerCase()
        : ''
      return {
        ...prev,
        [verseId]: applied === colorName ? '' : formatHighlight(colorName),
      }
    })
  }, [setPrefs])

  return {
    highlights,
    getHighlight,
    setHighlight,
    removeHighlight,
    toggleHighlight,
    count: highlights.length,
  }
}

