import { useState, useEffect, useMemo } from 'react'
import SEO from '@/components/layout/SEO'
import PageHeader from '@/components/ui/PageHeader'
import Icon from '@/components/ui/Icon'
import {
  BIBLE_VERSIONS,
  loadBibleVersion,
  type ParsedBook,
  type ParsedChapter,
  type ParsedVerse,
} from '@/utils/bibleService'
import clsx from 'clsx'

export default function Bible() {
  const [selectedVersionKey, setVersionKey] = useState<string>('WEB')
  const [books, setBooks]                   = useState<ParsedBook[]>([])
  const [selectedBookIndex, setBookIndex]   = useState<number>(42) // John (index 42 in 0-indexed list)
  const [selectedChapterNum, setChapterNum] = useState<number>(3)  // John 3
  const [loading, setLoading]               = useState<boolean>(true)
  const [statusMessage, setStatusMessage]   = useState<string>('')
  const [error, setError]                   = useState<string | null>(null)

  // Reader UI settings
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL')
  const [bookSearch, setBookSearch]           = useState<string>('')
  const [fontSize, setFontSize]               = useState<'sm' | 'base' | 'lg' | 'xl'>('base')
  const [copiedVerse, setCopiedVerse]         = useState<number | null>(null)
  const [isPlayingAudio, setIsPlayingAudio]   = useState<boolean>(false)

  // Load Bible version when changed
  useEffect(() => {
    setLoading(true)
    setError(null)
    setStatusMessage(`Preparing ${selectedVersionKey}...`)

    loadBibleVersion(selectedVersionKey, msg => setStatusMessage(msg))
      .then(loadedBooks => {
        setBooks(loadedBooks)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Unable to load Bible version.')
        setLoading(false)
      })
  }, [selectedVersionKey])

  // Current active book and chapter
  const currentBook: ParsedBook | undefined = books[selectedBookIndex] || books[0]

  const currentChapter: ParsedChapter | undefined = useMemo(() => {
    if (!currentBook) return undefined
    return currentBook.chapters.find(c => c.chapter === selectedChapterNum) || currentBook.chapters[0]
  }, [currentBook, selectedChapterNum])

  // Filtered books for the book selector modal / dropdown
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchesTestament =
        testamentFilter === 'ALL' ||
        (testamentFilter === 'OT' && b.testament === 'OT') ||
        (testamentFilter === 'NT' && b.testament === 'NT')

      const matchesSearch =
        !bookSearch.trim() || b.name.toLowerCase().includes(bookSearch.toLowerCase().trim())

      return matchesTestament && matchesSearch
    })
  }, [books, testamentFilter, bookSearch])

  // Navigation handlers
  function handlePrevChapter() {
    if (!currentBook) return
    if (selectedChapterNum > 1) {
      setChapterNum(selectedChapterNum - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (selectedBookIndex > 0) {
      const prevBook = books[selectedBookIndex - 1]
      setBookIndex(selectedBookIndex - 1)
      setChapterNum(prevBook.chapters.length)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleNextChapter() {
    if (!currentBook) return
    if (selectedChapterNum < currentBook.chapters.length) {
      setChapterNum(selectedChapterNum + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (selectedBookIndex < books.length - 1) {
      setBookIndex(selectedBookIndex + 1)
      setChapterNum(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleCopyVerse(verse: ParsedVerse) {
    if (!currentBook) return
    const text = `"${verse.text}" — ${currentBook.name} ${currentChapter?.chapter}:${verse.number} (${selectedVersionKey})`
    navigator.clipboard.writeText(text).then(() => {
      setCopiedVerse(verse.number)
      setTimeout(() => setCopiedVerse(null), 2000)
    })
  }

  function toggleSpeech() {
    if (!('speechSynthesis' in window) || !currentChapter || !currentBook) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis.cancel()
    const fullText = `${currentBook.name} chapter ${currentChapter.chapter}. ` +
      currentChapter.verses.map(v => `${v.number}. ${v.text}`).join(' ')

    const utterance = new SpeechSynthesisUtterance(fullText)
    utterance.rate = 0.95
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    // Set Hindi voice if Hindi is selected
    if (selectedVersionKey === 'HINDI') {
      utterance.lang = 'hi-IN'
    } else if (selectedVersionKey === 'RV1909') {
      utterance.lang = 'es-ES'
    } else {
      utterance.lang = 'en-US'
    }

    setIsPlayingAudio(true)
    window.speechSynthesis.speak(utterance)
  }

  const selectedVersionInfo = BIBLE_VERSIONS.find(v => v.key === selectedVersionKey) || BIBLE_VERSIONS[0]

  return (
    <>
      <SEO
        title={`Read the Holy Bible — ${selectedVersionInfo.name}`}
        description={`Read the full 66 books of the Holy Bible online. Complete Old & New Testament with translations: WEB, KJV, ASV, BSB, Hindi, and Spanish.`}
        canonical="/bible"
      />

      <main id="main-content" className="shell-narrow pb-16 sm:pb-20">
        <PageHeader
          icon="bible"
          eyebrow="Complete Scripture Reader"
          title="The Holy Bible"
          subtitle="Read and search all 66 sacred books with multiple authentic translations."
        />

        {/* ── Controls Toolbar ── */}
        <div className="card p-4 mb-6 shadow-soft space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Version Selector */}
            <div>
              <label htmlFor="version-select" className="block text-xs font-bold text-ink-600 uppercase tracking-wider mb-1">
                Translation
              </label>
              <select
                id="version-select"
                value={selectedVersionKey}
                onChange={e => setVersionKey(e.target.value)}
                className="w-full border border-parchment-300 rounded-xl px-3 py-2 text-sm bg-white font-medium"
              >
                {BIBLE_VERSIONS.map(v => (
                  <option key={v.key} value={v.key}>
                    {v.name} ({v.language})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Book Selector */}
            <div>
              <label htmlFor="book-select" className="block text-xs font-bold text-ink-600 uppercase tracking-wider mb-1">
                Book ({books.length} Books)
              </label>
              <select
                id="book-select"
                disabled={loading || books.length === 0}
                value={selectedBookIndex}
                onChange={e => {
                  setBookIndex(Number(e.target.value))
                  setChapterNum(1)
                }}
                className="w-full border border-parchment-300 rounded-xl px-3 py-2 text-sm bg-white font-medium"
              >
                {books.map((b, idx) => (
                  <option key={b.id || idx} value={idx}>
                    {idx + 1}. {b.name} ({b.chapters.length} ch)
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Chapter Selector */}
            <div>
              <label htmlFor="chapter-select" className="block text-xs font-bold text-ink-600 uppercase tracking-wider mb-1">
                Chapter
              </label>
              <select
                id="chapter-select"
                disabled={loading || !currentBook}
                value={selectedChapterNum}
                onChange={e => setChapterNum(Number(e.target.value))}
                className="w-full border border-parchment-300 rounded-xl px-3 py-2 text-sm bg-white font-medium"
              >
                {currentBook?.chapters.map(c => (
                  <option key={c.chapter} value={c.chapter}>
                    Chapter {c.chapter}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter & Search Bar for Books */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-parchment-200">
            <div className="inline-flex rounded-lg bg-parchment-200 p-0.5" role="group" aria-label="Filter testament">
              {(['ALL', 'OT', 'NT'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTestamentFilter(t)}
                  className={clsx(
                    'px-3 py-1 text-xs font-semibold rounded-md transition-colors',
                    testamentFilter === t ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-700 hover:text-ink-900'
                  )}
                >
                  {t === 'ALL' ? 'All (66)' : t === 'OT' ? 'Old Testament (39)' : 'New Testament (27)'}
                </button>
              ))}
            </div>

            {/* Font Size & Audio Controls */}
            <div className="flex items-center gap-2">
              {'speechSynthesis' in window && (
                <button
                  onClick={toggleSpeech}
                  disabled={loading}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors',
                    isPlayingAudio
                      ? 'bg-ink-800 text-white border-ink-800'
                      : 'bg-white text-ink-800 border-parchment-300 hover:bg-parchment-100'
                  )}
                  aria-label={isPlayingAudio ? 'Stop reading' : 'Listen to chapter audio'}
                >
                  <Icon name={isPlayingAudio ? 'stop' : 'volume'} className="w-4 h-4" />
                  <span className="hidden sm:inline">{isPlayingAudio ? 'Stop' : 'Listen'}</span>
                </button>
              )}

              <div className="inline-flex rounded-lg border border-parchment-300 bg-white p-0.5 text-xs font-bold text-ink-700">
                <button
                  onClick={() => setFontSize('sm')}
                  className={clsx('px-2 py-1 rounded', fontSize === 'sm' && 'bg-gold-50 text-sacred-800')}
                  title="Small text"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('base')}
                  className={clsx('px-2 py-1 rounded', fontSize === 'base' && 'bg-gold-50 text-sacred-800')}
                  title="Normal text"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  className={clsx('px-2 py-1 rounded', fontSize === 'lg' && 'bg-gold-50 text-sacred-800')}
                  title="Large text"
                >
                  A+
                </button>
                <button
                  onClick={() => setFontSize('xl')}
                  className={clsx('px-2 py-1 rounded', fontSize === 'xl' && 'bg-gold-50 text-sacred-800')}
                  title="Extra large text"
                >
                  A++
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div role="alert" className="card p-4 text-red-800 bg-red-50 border-red-200 mb-6">
            <p className="font-semibold text-sm mb-1">Failed to load translation</p>
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* ── Reader Viewport ── */}
        {loading ? (
          <div className="card p-12 text-center text-ink-600 animate-pulse">
            <Icon name="bible" className="w-10 h-10 mx-auto mb-3 animate-spin text-ink-400" />
            <h3 className="font-serif font-bold text-lg text-ink-900 mb-1">
              Loading {selectedVersionInfo.name}
            </h3>
            <p className="text-xs text-ink-500">{statusMessage || 'Preparing scripture text...'}</p>
          </div>
        ) : !currentBook || !currentChapter ? (
          <div className="card p-10 text-center text-ink-600">
            <p>No chapter data found.</p>
          </div>
        ) : (
          <article className="card shadow-soft overflow-hidden animate-fade-in">
            {/* Chapter Header Banner */}
            <div className="bg-gradient-to-r from-sacred-800 via-sacred-700 to-sacred-900 text-white p-6 sm:p-8 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-gold-300">
                  {currentBook.testament === 'OT' ? 'Old Testament' : 'New Testament'}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
                  {currentBook.name} {currentChapter.chapter}
                </h2>
                <p className="text-xs text-white/80 mt-1">
                  {selectedVersionInfo.name} • {currentChapter.verses.length} verses
                </p>
              </div>

              <div className="text-4xl opacity-30 select-none font-serif" aria-hidden="true">
                
              </div>
            </div>

            {/* Verses Container */}
            <div
              className={clsx(
                'p-6 sm:p-10 leading-relaxed font-serif text-ink-900 space-y-4 select-text',
                fontSize === 'sm' && 'text-sm sm:text-base leading-relaxed',
                fontSize === 'base' && 'text-base sm:text-lg leading-loose',
                fontSize === 'lg' && 'text-lg sm:text-xl leading-loose',
                fontSize === 'xl' && 'text-xl sm:text-2xl leading-loose'
              )}
            >
              {currentChapter.verses.map(v => (
                <div
                  key={v.number}
                  id={`verse-${v.number}`}
                  onClick={() => handleCopyVerse(v)}
                  className="group relative cursor-pointer hover:bg-gold-50/50 p-1.5 -mx-1.5 rounded-lg transition-colors"
                  title="Click to copy verse"
                >
                  <sup className="font-sans font-bold text-ink-700 text-xs sm:text-sm mr-2 select-none group-hover:text-gold-600">
                    {v.number}
                  </sup>
                  <span className="text-ink-900 group-hover:text-black">{v.text}</span>

                  {copiedVerse === v.number && (
                    <span className="ml-2 font-sans text-xs bg-ink-800 text-white px-2 py-0.5 rounded-md shadow-soft">
                      Copied
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Chapter Navigation Footer */}
            <footer className="bg-parchment-100 border-t border-parchment-200 p-4 sm:p-6 flex items-center justify-between">
              <button
                onClick={handlePrevChapter}
                disabled={selectedBookIndex === 0 && selectedChapterNum === 1}
                className="btn-ghost text-xs sm:text-sm border border-parchment-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Icon name="arrowRight" className="w-4 h-4 rotate-180" />
                <span>Previous Chapter</span>
              </button>

              <div className="text-xs text-ink-500 font-medium hidden sm:block">
                Click any verse to copy
              </div>

              <button
                onClick={handleNextChapter}
                disabled={selectedBookIndex === books.length - 1 && selectedChapterNum === currentBook.chapters.length}
                className="btn-primary text-xs sm:text-sm flex items-center gap-1.5"
              >
                <span>Next Chapter</span>
                <Icon name="arrowRight" className="w-4 h-4" />
              </button>
            </footer>
          </article>
        )}

        {/* ── All 66 Books Quick Grid ── */}
        <section className="mt-12 card p-6" aria-label="Browse all 66 books">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-serif font-bold text-lg text-ink-900">
              Browse All Books of the Bible
            </h3>
            <input
              type="text"
              placeholder="Search books (e.g. Genesis, John)..."
              value={bookSearch}
              onChange={e => setBookSearch(e.target.value)}
              className="border border-parchment-300 rounded-xl px-3 py-1.5 text-xs bg-white focus-visible:outline-none w-full sm:w-64"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {filteredBooks.map((b, idx) => {
              const originalIndex = books.indexOf(b)
              const isSelected = originalIndex === selectedBookIndex
              return (
                <button
                  key={b.id || idx}
                  onClick={() => {
                    setBookIndex(originalIndex)
                    setChapterNum(1)
                    window.scrollTo({ top: 180, behavior: 'smooth' })
                  }}
                  className={clsx(
                    'p-2.5 rounded-xl border text-left text-xs transition-all',
                    isSelected
                      ? 'bg-ink-800 text-white border-ink-800 shadow-md font-semibold'
                      : 'bg-white text-ink-800 border-parchment-300 hover:border-gold-400 hover:bg-parchment-100'
                  )}
                >
                  <p className="font-semibold truncate">{b.name}</p>
                  <p className={clsx('text-[10px] mt-0.5', isSelected ? 'text-gold-700' : 'text-ink-500')}>
                    {b.chapters.length} chapters
                  </p>
                </button>
              )
            })}
          </div>
        </section>
      </main>
    </>
  )
}
