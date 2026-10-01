import { ref, getDownloadURL } from 'firebase/storage'
import { storage } from '@/firebase/config'

export interface BibleVersionInfo {
  key: string
  name: string
  fileName: string
  language: string
  /** Per-book transfer size, not the size of the whole translation. */
  sizeLabel: string
}

/**
 * `sizeLabel` now advertises what actually transfers on open: a ~4 kB manifest
 * plus one ~70 kB book. Previously it showed the full translation size (up to
 * 10.5 MB), which is what made the reader look slow before the split.
 */
export const BIBLE_VERSIONS: BibleVersionInfo[] = [
  {
    key: 'WEB',
    name: 'World English Bible (WEB)',
    fileName: 'WEB_bible.json',
    language: 'English',
    sizeLabel: '~70 KB per book',
  },
  {
    key: 'BSB',
    name: 'Berean Standard Bible (BSB)',
    fileName: 'BSB_bible.json',
    language: 'English',
    sizeLabel: '~70 KB per book',
  },
  {
    key: 'ASV',
    name: 'American Standard Version (ASV)',
    fileName: 'ASV_bible.json',
    language: 'English',
    sizeLabel: '~70 KB per book',
  },
  {
    key: 'KJV',
    name: 'King James Version (KJV)',
    fileName: 'bible.json',
    language: 'English',
    sizeLabel: '~70 KB per book',
  },
  {
    key: 'HINDI',
    name: 'Hindi Holy Bible (पवित्र बाइबिल)',
    fileName: 'bible_hindi.json',
    language: 'Hindi (हिंदी)',
    sizeLabel: '~70 KB per book',
  },
  {
    key: 'RV1909',
    name: 'Reina-Valera 1909 (Español)',
    fileName: 'RV1909_bible.json',
    language: 'Spanish',
    sizeLabel: '~70 KB per book',
  },
]

export const STANDARD_BOOK_NAMES = [
  // Old Testament (39)
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament (27)
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John',
  '3 John', 'Jude', 'Revelation'
]

export interface ParsedVerse {
  number: number
  text: string
}

export interface ParsedChapter {
  chapter: number
  verses: ParsedVerse[]
}

export interface ParsedBook {
  id: number
  name: string
  testament: 'OT' | 'NT'
  chapters: ParsedChapter[]
}

/**
 * Lightweight book descriptor from the per-version manifest.
 *
 * The reader only ever displays one chapter, but the old implementation
 * downloaded the whole translation (up to 10.5 MB) and JSON.parsed all of it
 * before it could render anything. The manifest is ~4 KB and carries everything
 * needed to draw the book list and know how many chapters each book has, so the
 * UI is interactive immediately and verse text is fetched per book on demand.
 */
export interface BibleManifestEntry {
  id: number
  name: string
  testament: 'OT' | 'NT'
  chapters: number
}

/** In-flight / resolved promises, so repeated asks for a book never refetch. */
const bookCache = new Map<string, Promise<ParsedBook>>()
const manifestCache = new Map<string, Promise<BibleManifestEntry[]>>()

/**
 * Normalizes different JSON structures (WEB/ASV/BSB vs Hindi vs KJV) into unified ParsedBook[]
 */
function normalizeBibleJson(data: any): ParsedBook[] {
  // Shape 1: { books: [ { name, chapters: [ { chapter, verses: [ { verse, text } ] } ] } ] }
  if (data && Array.isArray(data.books)) {
    return data.books.map((b: any, index: number) => {
      const isNT = index >= 39
      const bookName = b.name || STANDARD_BOOK_NAMES[index] || `Book ${index + 1}`
      const chapters: ParsedChapter[] = (b.chapters || []).map((c: any, cIdx: number) => {
        const chapNum = typeof c.chapter === 'number' ? c.chapter : cIdx + 1
        const verses: ParsedVerse[] = (c.verses || []).map((v: any, vIdx: number) => ({
          number: typeof v.verse === 'number' ? v.verse : vIdx + 1,
          text: (v.text || v.Verse || '').trim(),
        }))
        return { chapter: chapNum, verses }
      })
      return {
        id: index + 1,
        name: bookName,
        testament: isNT ? 'NT' : 'OT',
        chapters,
      }
    })
  }

  // Shape 2: { Book: [ { Chapter: [ { Verse: [ { Verse, Verseid } ] } ] } ] } (Hindi, KJV)
  const rawBooks = data?.Book || data?.book
  if (Array.isArray(rawBooks)) {
    return rawBooks.map((b: any, index: number) => {
      const isNT = index >= 39
      const bookName = STANDARD_BOOK_NAMES[index] || `Book ${index + 1}`
      const rawChapters = b.Chapter || b.chapter || []
      const chapters: ParsedChapter[] = rawChapters.map((c: any, cIdx: number) => {
        const chapNum = cIdx + 1
        const rawVerses = c.Verse || c.verse || []
        const verses: ParsedVerse[] = rawVerses.map((v: any, vIdx: number) => ({
          number: vIdx + 1,
          text: (typeof v === 'string' ? v : v.Verse || v.verse || v.text || '').trim(),
        }))
        return { chapter: chapNum, verses }
      })
      return {
        id: index + 1,
        name: bookName,
        testament: isNT ? 'NT' : 'OT',
        chapters,
      }
    })
  }

  // Shape 3: Direct Array of Books
  if (Array.isArray(data)) {
    return data.map((b: any, index: number) => ({
      id: index + 1,
      name: b.name || STANDARD_BOOK_NAMES[index] || `Book ${index + 1}`,
      testament: index >= 39 ? 'NT' : 'OT',
      chapters: (b.chapters || []).map((c: any, cIdx: number) => ({
        chapter: c.chapter || cIdx + 1,
        verses: (c.verses || []).map((v: any, vIdx: number) => ({
          number: v.verse || vIdx + 1,
          text: (v.text || '').trim(),
        })),
      })),
    }))
  }

  throw new Error('Unsupported Bible JSON structure')
}

function getVersionInfo(versionKey: string): BibleVersionInfo {
  return BIBLE_VERSIONS.find(v => v.key.toUpperCase() === versionKey.toUpperCase()) || BIBLE_VERSIONS[0]
}

const base = () => import.meta.env.BASE_URL || '/'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json() as Promise<T>
}

/**
 * Load the book manifest for a version (~4 KB).
 *
 * This is all the reader needs to render its chrome: book names, testament and
 * chapter counts. Returning it separately from the verse text is what makes the
 * page feel instant instead of hanging on a multi-megabyte download.
 */
export async function loadBibleManifest(versionKey: string): Promise<BibleManifestEntry[]> {
  const info = getVersionInfo(versionKey)
  const cached = manifestCache.get(info.key)
  if (cached) return cached

  const promise = (async () => {
    const url = `${base()}bibles/${info.key}/manifest.json`
    const manifest = await fetchJson<BibleManifestEntry[]>(url)
    manifestCache.set(info.key, Promise.resolve(manifest))
    return manifest
  })()

  manifestCache.set(info.key, promise)
  return promise
}

/** Normalise one book's chapter payload (both source shapes) into ParsedChapter[]. */
function parseChapters(raw: any[]): ParsedChapter[] {
  return raw.map((c, cIdx) => {
    const verses = (c.verses || c.Verse || c.verse || []).map((v: any, vIdx: number) => ({
      number: typeof v === 'object'
        ? (typeof v.verse === 'number' ? v.verse : typeof v.Verse === 'number' ? v.Verse : vIdx + 1)
        : vIdx + 1,
      text: (typeof v === 'string' ? v : (v.text || v.Verse || v.verse || '')).trim(),
    }))
    return { chapter: c.chapter || cIdx + 1, verses }
  })
}

/**
 * Load a single book (~70 KB) on demand and cache it.
 *
 * Called whenever the reader changes book or translation. Only the book being
 * read is transferred and parsed, which is roughly 40x less data than the whole
 * translation and keeps the main thread free.
 */
export async function loadBibleBook(
  versionKey: string,
  bookId: number,
): Promise<ParsedBook> {
  const info = getVersionInfo(versionKey)
  const cacheKey = `${info.key}:${bookId}`

  const cached = bookCache.get(cacheKey)
  if (cached) return cached

  const promise = (async () => {
    const manifest = await loadBibleManifest(info.key)
    const meta = manifest.find(m => m.id === bookId)
    const name = meta?.name || STANDARD_BOOK_NAMES[bookId - 1] || `Book ${bookId}`
    const testament = meta?.testament ?? (bookId > 39 ? 'NT' : 'OT')

    const url = `${base()}bibles/${info.key}/${String(bookId).padStart(2, '0')}.json`
    const chapters = parseChapters(await fetchJson<any[]>(url))

    return { id: bookId, name, testament, chapters }
  })()

  // Cache the promise itself so concurrent callers share one request.
  bookCache.set(cacheKey, promise)

  try {
    return await promise
  } catch (e) {
    // Do not cache failures: a transient network error should be retryable.
    bookCache.delete(cacheKey)
    throw e
  }
}
