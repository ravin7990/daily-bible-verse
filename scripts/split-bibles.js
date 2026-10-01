/**
 * Splits each large Bible JSON into a tiny manifest plus one file per book.
 *
 * Why: Bible.tsx only ever renders ONE chapter at a time, yet it downloaded the
 * entire translation (WEB = 4.62 MB raw / 1.25 MB gzipped) and then ran
 * JSON.parse over all of it on the main thread. That dominated the page's load
 * time and blocked interaction.
 *
 * After the split:
 *   manifest.json  ~4 KB  -> book list + chapter counts render instantly
 *   01.json ...    ~70 KB -> fetched only for the book actually being read
 *
 * That is roughly a 40x reduction on first load, and the reader stays responsive
 * while parsing because only one book is parsed at a time.
 *
 * Output is skipped when it is already newer than its source file, so
 * repeat builds are fast.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const biblesDir = path.resolve(rootDir, 'public', 'bibles')

const STANDARD_BOOK_NAMES = [
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
]

const VERSIONS = [
  { key: 'WEB',    file: 'WEB_bible.json' },
  { key: 'BSB',    file: 'BSB_bible.json' },
  { key: 'ASV',    file: 'ASV_bible.json' },
  { key: 'KJV',    file: 'bible.json' },
  { key: 'HINDI',  file: 'bible_hindi.json' },
  { key: 'RV1909', file: 'RV1909_bible.json' },
]

/** Normalise either source shape into a uniform book list. */
function extractBooks(json) {
  if (json && Array.isArray(json.books)) {
    return json.books.map((b, i) => ({
      name: b.name || STANDARD_BOOK_NAMES[i],
      chapters: b.chapters || [],
    }))
  }
  const rawBooks = json?.Book || json?.book
  if (Array.isArray(rawBooks)) {
    return rawBooks.map((b, i) => ({
      name: STANDARD_BOOK_NAMES[i],
      chapters: b.Chapter || b.chapter || [],
    }))
  }
  if (Array.isArray(json)) {
    return json.map((b, i) => ({
      name: b.name || STANDARD_BOOK_NAMES[i],
      chapters: b.chapters || [],
    }))
  }
  throw new Error('Unsupported Bible JSON structure')
}

/** Chapter count for a book, tolerant of both chapter shapes. */
function chapterCount(book) {
  return book.chapters.length
}

function splitVersion({ key, file }) {
  const srcPath = path.join(biblesDir, file)
  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️  ${file} not found, skipping`)
    return
  }

  const outDir = path.join(biblesDir, key)
  const manifestPath = path.join(outDir, 'manifest.json')

  // Skip work when the split output is already newer than the source.
  if (fs.existsSync(manifestPath)) {
    if (fs.statSync(manifestPath).mtimeMs > fs.statSync(srcPath).mtimeMs) {
      console.log(`⏭️  ${key}: already up to date`)
      return
    }
  }

  const srcStat = fs.statSync(srcPath)
  const json = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  const books = extractBooks(json)

  fs.mkdirSync(outDir, { recursive: true })

  const manifest = books.map((b, i) => ({
    id: i + 1,
    name: b.name,
    testament: i >= 39 ? 'NT' : 'OT',
    chapters: chapterCount(b),
  }))

  // One file per book, zero-padded so they sort naturally.
  books.forEach((b, i) => {
    const id = String(i + 1).padStart(2, '0')
    fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(b.chapters))
  })

  fs.writeFileSync(manifestPath, JSON.stringify(manifest))

  const manifestSize = fs.statSync(manifestPath).size
  const largest = books.reduce(
    (max, b) => Math.max(max, JSON.stringify(b.chapters).length), 0,
  )
  console.log(
    `✅ ${key}: ${books.length} books · manifest ${(manifestSize / 1024).toFixed(1)} kB ` +
    `(was ${(srcStat.size / 1048576).toFixed(2)} MB) · largest book ${(largest / 1024).toFixed(0)} kB`,
  )
}

function main() {
  if (!fs.existsSync(biblesDir)) {
    console.warn('⚠️  public/bibles not found, skipping Bible split')
    return
  }
  for (const v of VERSIONS) splitVersion(v)
}

main()