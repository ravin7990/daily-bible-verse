import { ref, getDownloadURL } from 'firebase/storage'
import { storage } from '@/firebase/config'

export interface BibleVersionInfo {
  key: string
  name: string
  fileName: string
  language: string
  sizeLabel: string
}

export const BIBLE_VERSIONS: BibleVersionInfo[] = [
  {
    key: 'WEB',
    name: 'World English Bible (WEB)',
    fileName: 'WEB_bible.json',
    language: 'English',
    sizeLabel: '4.7 MB',
  },
  {
    key: 'BSB',
    name: 'Berean Standard Bible (BSB)',
    fileName: 'BSB_bible.json',
    language: 'English',
    sizeLabel: '7.8 MB',
  },
  {
    key: 'ASV',
    name: 'American Standard Version (ASV)',
    fileName: 'ASV_bible.json',
    language: 'English',
    sizeLabel: '8.0 MB',
  },
  {
    key: 'KJV',
    name: 'King James Version (KJV)',
    fileName: 'bible.json',
    language: 'English',
    sizeLabel: '5.5 MB',
  },
  {
    key: 'HINDI',
    name: 'Hindi Holy Bible (पवित्र बाइबिल)',
    fileName: 'bible_hindi.json',
    language: 'Hindi (हिंदी)',
    sizeLabel: '10.5 MB',
  },
  {
    key: 'RV1909',
    name: 'Reina-Valera 1909 (Español)',
    fileName: 'RV1909_bible.json',
    language: 'Spanish',
    sizeLabel: '6.3 MB',
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

// In-memory cache across version switches
const versionCache = new Map<string, ParsedBook[]>()

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

/**
 * Loads a Bible version:
 * 1. Checks in-memory cache.
 * 2. Tries local bundled file at /bibles/{fileName}.
 * 3. Fallback: fetches from Firebase Storage.
 */
export async function loadBibleVersion(
  versionKey: string,
  onProgress?: (msg: string) => void
): Promise<ParsedBook[]> {
  const info = BIBLE_VERSIONS.find(v => v.key.toUpperCase() === versionKey.toUpperCase()) || BIBLE_VERSIONS[0]

  if (versionCache.has(info.key)) {
    return versionCache.get(info.key)!
  }

  onProgress?.(`Loading ${info.name}...`)

  const base = import.meta.env.BASE_URL || '/'
  const localUrl = `${base}bibles/${info.fileName}`

  // 1. Try local URL first
  try {
    const res = await fetch(localUrl)
    if (res.ok) {
      const json = await res.json()
      const parsed = normalizeBibleJson(json)
      versionCache.set(info.key, parsed)
      return parsed
    }
  } catch (e) {
    console.warn(`Local fetch failed for ${info.fileName}, trying Firebase Storage fallback:`, e)
  }

  // 2. Fallback to Firebase Storage
  onProgress?.(`Fetching ${info.name} from Firebase Storage...`)
  try {
    const fileRef = ref(storage, info.fileName)
    const downloadUrl = await getDownloadURL(fileRef)
    const res = await fetch(downloadUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const parsed = normalizeBibleJson(json)
    versionCache.set(info.key, parsed)
    return parsed
  } catch (error) {
    console.error(`Failed to load Bible version ${info.key}:`, error)
    throw new Error(`Unable to load ${info.name}. Please check connection.`)
  }
}
