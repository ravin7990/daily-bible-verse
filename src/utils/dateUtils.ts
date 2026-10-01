import type { DailyContent } from '@/types'

/** Convert a Date to the "YYYY_MM" key used for local JSON files */
export function dateToMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}_${m}`
}

/** Format date as "September 30, 2026" */
export function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Format date as "Mon, Sep 30" */
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** Get today's date string as "YYYY-MM-DD" in local time */
export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Fetch daily content for a given date from bundled monthly JSON */
export async function fetchDailyContent(dateStr: string): Promise<DailyContent | null> {
  const [year, month] = dateStr.split('-')
  const key = `${year}_${month}`
  try {
    // Dynamic import of bundled JSON asset
    const mod = await import(`@/assets/verses/${key}.json`)
    const entries: DailyContent[] = mod.default
    return entries.find(e => e.date === dateStr) ?? null
  } catch {
    return null
  }
}

/** Get all available dates for a given month key */
export async function fetchMonthContent(monthKey: string): Promise<DailyContent[]> {
  try {
    const mod = await import(`@/assets/verses/${monthKey}.json`)
    return mod.default as DailyContent[]
  } catch {
    return []
  }
}

/** Slugify a story title for SEO-friendly URLs */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/** Parse story slug back to story id format */
export function slugToId(slug: string): string {
  return slug
}
