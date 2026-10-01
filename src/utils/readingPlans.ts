/**
 * Guided Bible reading plans.
 *
 * Ported 1:1 from the Android app's `ReadingPlanManager.kt` so a user who
 * starts a plan on the phone sees the identical plan, identical day numbering
 * and identical readings on the website.
 *
 * Two indexing conventions matter here:
 *   - `planId` strings match the app exactly (they are persisted in
 *     ReadingPlanPreferences and synced via cloud).
 *   - The app addresses books by 0-BASED index (0 = Genesis ... 65 = Revelation).
 *     Readings below therefore use those same 0-based indices. Use
 *     `bookNameAt()` to resolve a display name, and remember to convert with
 *     `appIndexToManifestId()` when talking to the Bible reader.
 */

export interface ReadingPlan {
  id: string
  title: string
  description: string
  durationDays: number
  category: string
  /** Tailwind-safe icon name resolved by the UI. */
  icon: 'shield' | 'leaf' | 'sparkle' | 'scroll' | 'bible' | 'book' | 'prayer' | 'heart'
}

export const READING_PLANS: ReadingPlan[] = [
  {
    id: 'peace_7',
    title: '7 Days of Peace & Comfort',
    description:
      "Find peace, hope, and rest in God's presence through comforting Psalms, Philippians, and John.",
    durationDays: 7,
    category: 'Peace & Rest',
    icon: 'shield',
  },
  {
    id: 'anxiety_7',
    title: '7 Days Overcoming Anxiety',
    description:
      "Overcome fear, worry, and anxious thoughts with God's unshakable promises of protection and stillness.",
    durationDays: 7,
    category: 'Peace & Rest',
    icon: 'shield',
  },
  {
    id: 'faith_7',
    title: '7 Days of Unshakable Faith',
    description:
      'Strengthen your confidence and trust in the Lord through Abraham, Hebrews 11, and the miracles of Christ.',
    durationDays: 7,
    category: 'Spiritual Growth',
    icon: 'sparkle',
  },
  {
    id: 'healing_14',
    title: '14 Days of Healing & Hope',
    description:
      "Experience God's restoring heart, His healing miracles in the Gospels, and promises of renewed strength.",
    durationDays: 14,
    category: 'Healing & Hope',
    icon: 'leaf',
  },
  {
    id: 'wisdom_14',
    title: '14 Days of Proverbs & Wisdom',
    description:
      'Practical divine wisdom for relationships, speech, decisions, and integrity from Solomon and James.',
    durationDays: 14,
    category: 'Wisdom & Life',
    icon: 'book',
  },
  {
    id: 'psalms_30',
    title: '30 Days in the Psalms',
    description:
      "A 30-day journey of heartfelt worship, deep praise, and finding refuge in God's eternal shelter.",
    durationDays: 30,
    category: 'Worship & Devotion',
    icon: 'scroll',
  },
  {
    id: 'gospels_30',
    title: 'The Gospels in 30 Days',
    description:
      'Journey through the four Gospels (Matthew, Mark, Luke, and John) to explore the life, miracles, and teachings of Jesus.',
    durationDays: 30,
    category: 'Gospels & Jesus',
    icon: 'bible',
  },
  {
    id: 'nt_90',
    title: 'New Testament in 90 Days',
    description:
      'An inspiring, guided 90-day reading plan that walks you through all 27 books of the New Testament.',
    durationDays: 90,
    category: 'Whole Bible / NT',
    icon: 'book',
  },
]

export const PLAN_CATEGORIES = Array.from(new Set(READING_PLANS.map(p => p.category))).sort()

export function getPlan(planId: string | null | undefined): ReadingPlan | null {
  if (!planId) return null
  return READING_PLANS.find(p => p.id === planId) ?? null
}

export const BOOK_NAMES = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John',
  '3 John', 'Jude', 'Revelation',
] as const

/** Resolve a 0-based app book index to its display name. */
export function bookNameAt(appIndex: number): string {
  return BOOK_NAMES[appIndex] ?? `Book ${appIndex + 1}`
}

/** 0-based app index -> 1-based id used by the Bible reader manifest. */
export function appIndexToManifestId(appIndex: number): number {
  return appIndex + 1
}

/* A reading is a [0-based book index, chapter] pair, matching the app. */
export type Reading = [number, number]

/* Fixed, hand-curated day-by-day readings, verbatim from the app. */
const STATIC_DAY_READINGS: Record<string, Reading[][]> = {
  peace_7: [
    [[42, 14]],
    [[18, 23], [18, 27]],
    [[49, 4]],
    [[39, 6]],
    [[18, 91], [18, 121]],
    [[44, 8]],
    [[65, 21]],
  ],
  anxiety_7: [
    [[49, 4]],
    [[39, 6]],
    [[18, 23], [18, 27]],
    [[22, 41], [22, 43]],
    [[59, 5], [54, 1]],
    [[18, 91], [18, 46]],
    [[44, 8]],
  ],
  faith_7: [
    [[57, 11]],
    [[0, 15], [0, 22]],
    [[39, 8], [39, 9]],
    [[40, 9], [40, 11]],
    [[44, 4], [44, 10]],
    [[58, 1], [58, 2]],
    [[61, 5]],
  ],
  healing_14: [
    [[1, 15], [18, 103]],
    [[18, 147], [23, 17]],
    [[23, 30], [22, 53]],
    [[39, 8]],
    [[39, 9]],
    [[40, 5]],
    [[41, 8]],
    [[41, 17]],
    [[42, 5]],
    [[42, 9]],
    [[43, 3], [43, 4]],
    [[58, 5]],
    [[59, 2]],
    [[65, 22]],
  ],
  wisdom_14: [
    [[19, 1]],
    [[19, 2]],
    [[19, 3]],
    [[19, 4]],
    [[19, 15]],
    [[19, 16]],
    [[19, 18]],
    [[19, 22]],
    [[19, 25]],
    [[19, 31]],
    [[20, 3]],
    [[58, 1]],
    [[58, 3]],
    [[50, 3]],
  ],
  psalms_30: [
    [[18, 1], [18, 2]],
    [[18, 8], [18, 19]],
    [[18, 23], [18, 24]],
    [[18, 27], [18, 34]],
    [[18, 37]],
    [[18, 42], [18, 43]],
    [[18, 46], [18, 51]],
    [[18, 62], [18, 63]],
    [[18, 84], [18, 86]],
    [[18, 90], [18, 91]],
    [[18, 95], [18, 96]],
    [[18, 100], [18, 103]],
    [[18, 104]],
    [[18, 116], [18, 118]],
    [[18, 119]],
    [[18, 121], [18, 122], [18, 126]],
    [[18, 130], [18, 131]],
    [[18, 138], [18, 139]],
    [[18, 143], [18, 145]],
    [[18, 146], [18, 147]],
    [[18, 148], [18, 149], [18, 150]],
    [[18, 3], [18, 4], [18, 5]],
    [[18, 16], [18, 18]],
    [[18, 25], [18, 30]],
    [[18, 31], [18, 32]],
    [[18, 40], [18, 41]],
    [[18, 65], [18, 67]],
    [[18, 71], [18, 72]],
    [[18, 77], [18, 78]],
    [[18, 107]],
  ],
}

/* New Testament book indices, for the generated gospels_30 / nt_90 plans. */
const GOSPEL_BOOKS: [number, number][] = [[39, 28], [40, 16], [41, 24], [42, 21]]
const NT_BOOKS: [number, number][] = [
  [39, 28], [40, 16], [41, 24], [42, 21], [43, 28], [44, 16], [45, 16], [46, 13],
  [47, 6], [48, 6], [49, 4], [50, 4], [51, 5], [52, 3], [53, 6], [54, 4],
  [55, 3], [56, 1], [57, 13], [58, 5], [59, 5], [60, 3], [61, 5], [62, 1],
  [63, 1], [64, 1], [65, 22],
]

/**
 * Slice a book's chapters into `totalDays` days.
 *
 * Reproduces the app's distribution exactly: 3 chapters/day for the first
 * `sizeDays` days, then 2 per day. Matching this matters because `current_day`
 * is synced between platforms — if the two disagreed about which chapters
 * belong to day 12, a user moving between them would jump around mid-plan.
 */
function chunkIntoDays(books: [number, number][], totalDays: number, sizeDays: number): Reading[][] {
  const all: Reading[] = []
  for (const [bookIndex, chapters] of books) {
    for (let chapter = 1; chapter <= chapters; chapter++) {
      all.push([bookIndex, chapter])
    }
  }

  const days: Reading[][] = []
  let index = 0
  for (let day = 0; day < totalDays; day++) {
    const size = day < sizeDays ? 3 : 2
    const dayList: Reading[] = []
    for (let k = 0; k < size; k++) {
      if (index < all.length) {
        dayList.push(all[index])
        index++
      }
    }
    days.push(dayList)
  }
  return days
}

/* Generated day lists, memoised because they walk every chapter once. */
let gospelsDays: Reading[][] | null = null
let ntDays: Reading[][] | null = null

/**
 * Readings for a plan day.
 *
 * @param dayIndex0 zero-based day index (the app stores a 1-based `current_day`)
 */
export function getReadingsForPlanDay(planId: string, dayIndex0: number): Reading[] {
  const staticDays = STATIC_DAY_READINGS[planId]
  if (staticDays) return staticDays[dayIndex0] ?? []

  if (planId === 'gospels_30') {
    // 89 chapters across 30 days: 29 days of 3, final day of 2.
    if (!gospelsDays) gospelsDays = chunkIntoDays(GOSPEL_BOOKS, 30, 29)
    return gospelsDays[dayIndex0] ?? []
  }

  if (planId === 'nt_90') {
    // 260 chapters across 90 days: 80 days of 3, final 10 days of 2.
    if (!ntDays) ntDays = chunkIntoDays(NT_BOOKS, 90, 80)
    return ntDays[dayIndex0] ?? []
  }

  return []
}

/**
 * Format readings the way the app does: grouped by book, contiguous chapters
 * collapsed into a range, books joined with " & ".
 *   [[42,14],[42,15]]            -> "John 14-15"
 *   [[42,14],[43,3]]             -> "John 14 & Acts 3"
 */
export function formatReadings(readings: Reading[]): string {
  if (!readings.length) return ''

  const grouped = new Map<number, number[]>()
  for (const [book, chapter] of readings) {
    const list = grouped.get(book)
    if (list) list.push(chapter)
    else grouped.set(book, [chapter])
  }

  const parts: string[] = []
  for (const [book, chapters] of grouped) {
    const name = bookNameAt(book)
    const sorted = [...chapters].sort((a, b) => a - b)

    if (sorted.length === 1) {
      parts.push(`${name} ${sorted[0]}`)
      continue
    }

    const isContiguous = sorted.every((c, i) => i === 0 || c === sorted[i - 1] + 1)
    parts.push(
      isContiguous
        ? `${name} ${sorted[0]}-${sorted[sorted.length - 1]}`
        : `${name} ${sorted.join(', ')}`,
    )
  }

  return parts.join(' & ')
}