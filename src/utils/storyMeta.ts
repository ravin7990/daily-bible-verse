/**
 * Helpers for rendering story metadata honestly.
 */

/** Words per minute for adult silent reading, as used by most estimators. */
const WORDS_PER_MINUTE = 220

/**
 * Reading time derived from the actual text.
 *
 * The stored `read_time` field claims "7 min read" for entries of roughly 265
 * words — off by about seven times, and near-identical across almost the whole
 * corpus. A visibly wrong reading-time badge is exactly the kind of detail that
 * makes a site read as bulk-generated, so the displayed value is computed from
 * the real text and the stored field is ignored.
 */
export function computeReadTime(story: {
  story?: string
  summary?: string
  reflection?: string
}): string {
  const words = [story.story, story.summary]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length

  if (words === 0) return '1 min read'
  return `${Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min read`
}
