import { useState, useEffect } from 'react'
import SEO from '@/components/layout/SEO'
import { Skeleton, SkeletonLines } from '@/components/ui/Skeleton'
import { ref as dbRef, get, child } from 'firebase/database'
import { rtdb } from '@/firebase/config'
import type { BibleBook } from '@/types'

// Standard Bible book list
const BOOKS: BibleBook[] = [
  { id: 1,  name: 'Genesis',          abbrev: 'Gen',  chapters: 50 },
  { id: 2,  name: 'Exodus',           abbrev: 'Exo',  chapters: 40 },
  { id: 3,  name: 'Leviticus',        abbrev: 'Lev',  chapters: 27 },
  { id: 4,  name: 'Numbers',          abbrev: 'Num',  chapters: 36 },
  { id: 5,  name: 'Deuteronomy',      abbrev: 'Deu',  chapters: 34 },
  { id: 6,  name: 'Joshua',           abbrev: 'Jos',  chapters: 24 },
  { id: 7,  name: 'Judges',           abbrev: 'Jdg',  chapters: 21 },
  { id: 8,  name: 'Ruth',             abbrev: 'Rut',  chapters: 4  },
  { id: 9,  name: '1 Samuel',         abbrev: '1Sa',  chapters: 31 },
  { id: 10, name: '2 Samuel',         abbrev: '2Sa',  chapters: 24 },
  { id: 11, name: '1 Kings',          abbrev: '1Ki',  chapters: 22 },
  { id: 12, name: '2 Kings',          abbrev: '2Ki',  chapters: 25 },
  { id: 19, name: 'Psalms',           abbrev: 'Psa',  chapters: 150},
  { id: 20, name: 'Proverbs',         abbrev: 'Pro',  chapters: 31 },
  { id: 23, name: 'Isaiah',           abbrev: 'Isa',  chapters: 66 },
  { id: 40, name: 'Matthew',          abbrev: 'Mat',  chapters: 28 },
  { id: 41, name: 'Mark',             abbrev: 'Mar',  chapters: 16 },
  { id: 42, name: 'Luke',             abbrev: 'Luk',  chapters: 24 },
  { id: 43, name: 'John',             abbrev: 'Joh',  chapters: 21 },
  { id: 44, name: 'Acts',             abbrev: 'Act',  chapters: 28 },
  { id: 45, name: 'Romans',           abbrev: 'Rom',  chapters: 16 },
  { id: 46, name: '1 Corinthians',    abbrev: '1Co',  chapters: 16 },
  { id: 47, name: '2 Corinthians',    abbrev: '2Co',  chapters: 13 },
  { id: 48, name: 'Galatians',        abbrev: 'Gal',  chapters: 6  },
  { id: 49, name: 'Ephesians',        abbrev: 'Eph',  chapters: 6  },
  { id: 50, name: 'Philippians',      abbrev: 'Phi',  chapters: 4  },
  { id: 58, name: 'Hebrews',          abbrev: 'Heb',  chapters: 13 },
  { id: 59, name: 'James',            abbrev: 'Jam',  chapters: 5  },
  { id: 66, name: 'Revelation',       abbrev: 'Rev',  chapters: 22 },
]

interface VerseData {
  [verseNum: string]: string
}

export default function Bible() {
  const [selectedBook,    setBook]    = useState<BibleBook>(BOOKS.find(b => b.name === 'John')!)
  const [selectedChapter, setChapter] = useState(3)
  const [verses,          setVerses]  = useState<VerseData>({})
  const [loading,         setLoading] = useState(false)
  const [error,           setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!selectedBook) return
    setLoading(true)
    setError(null)
    setVerses({})

    const path = `bible/NIV/${selectedBook.abbrev}/${selectedChapter}`
    get(child(dbRef(rtdb), path))
      .then(snap => {
        if (snap.exists()) {
          setVerses(snap.val() as VerseData)
        } else {
          setError('Chapter not found. The Bible may still be loading.')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Unable to load Bible text. Please check your connection.')
        setLoading(false)
      })
  }, [selectedBook, selectedChapter])

  return (
    <>
      <SEO
        title="Read the Bible"
        description="Read the Bible online. Browse books, chapters, and verses from the New International Version (NIV)."
        canonical="/bible"
      />

      <main id="main-content" className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="section-title mb-1">Read the Bible</h1>
          <p className="text-gray-500 text-sm">New International Version (NIV)</p>
        </header>

        {/* Book + Chapter selectors */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <label htmlFor="book-select" className="sr-only">Select book</label>
            <select
              id="book-select"
              value={selectedBook.id}
              onChange={e => {
                const book = BOOKS.find(b => b.id === Number(e.target.value))!
                setBook(book)
                setChapter(1)
              }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
            >
              {BOOKS.map(book => (
                <option key={book.id} value={book.id}>{book.name}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label htmlFor="chapter-select" className="sr-only">Select chapter</label>
            <select
              id="chapter-select"
              value={selectedChapter}
              onChange={e => setChapter(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
            >
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                <option key={ch} value={ch}>Ch. {ch}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Breadcrumb */}
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">
          {selectedBook.name} · Chapter {selectedChapter}
        </p>

        {/* Verses */}
        {error && (
          <div role="alert" className="card p-4 text-red-600 text-sm bg-red-50 border-red-200 mb-4">{error}</div>
        )}

        <div className="card p-5 sm:p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-4 w-5 shrink-0" />
                  <SkeletonLines lines={1} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(verses).map(([verseNum, text]) => (
                <p key={verseNum} className="text-gray-700 leading-relaxed">
                  <sup className="text-sacred-500 font-bold text-xs mr-1">{verseNum}</sup>
                  {text}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Prev / Next chapter */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setChapter(c => Math.max(1, c - 1))}
            disabled={selectedChapter <= 1}
            className="btn-secondary text-sm disabled:opacity-40"
            aria-label="Previous chapter"
          >
            ← Previous
          </button>
          <button
            onClick={() => setChapter(c => Math.min(selectedBook.chapters, c + 1))}
            disabled={selectedChapter >= selectedBook.chapters}
            className="btn-secondary text-sm disabled:opacity-40"
            aria-label="Next chapter"
          >
            Next →
          </button>
        </div>
      </main>
    </>
  )
}
