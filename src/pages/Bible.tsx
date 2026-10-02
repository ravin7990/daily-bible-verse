import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SEO from '@/components/layout/SEO'
import { useLastRead, useBibleProgress } from '@/utils/userProgress'
import PageHeader from '@/components/ui/PageHeader'
import Icon from '@/components/ui/Icon'
import VerseNoteDialog from '@/components/bible/VerseNoteDialog'
import VerseHighlightPalette from '@/components/bible/VerseHighlightPalette'
import TranslationCredit from '@/components/bible/TranslationCredit'
import {
  BIBLE_VERSIONS,
  loadBibleManifest,
  loadBibleBook,
  type BibleManifestEntry,
  type ParsedBook,
  type ParsedChapter,
  type ParsedVerse,
} from '@/utils/bibleService'
import {
  createVerseId,
  highlightSegments,
  highlightSwatch,
  useVerseHighlights,
  useVerseNotes,
  type HighlightColorName,
} from '@/utils/verseAnnotations'
import clsx from 'clsx'

export default function Bible() {
  const [selectedVersionKey, setVersionKey] = useState<string>('WEB')

  // Book list comes from the tiny manifest (~4 KB) so the page shell renders
  // immediately. Only the book actually being read is downloaded.
  const [manifest, setManifest]             = useState<BibleManifestEntry[]>([])
  const [currentBook, setCurrentBook]       = useState<ParsedBook | null>(null)
  const [selectedBookIndex, setBookIndex]   = useState<number>(42) // John
  const [selectedChapterNum, setChapterNum] = useState<number>(3)   // John 3

  // `manifestLoading` gates the book list; `bookLoading` gates only the verse
  // viewport, so switching translations never blanks the whole page.
  const [manifestLoading, setManifestLoading] = useState(true)
  const [bookLoading, setBookLoading]       = useState(true)
  const [statusMessage, setStatusMessage]   = useState<string>('')
  const [error, setError]                   = useState<string | null>(null)

  // Reader UI settings
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL')
  const [bookSearch, setBookSearch]           = useState<string>('')
  const [fontSize, setFontSize]               = useState<'sm' | 'base' | 'lg' | 'xl'>('base')
  const [copiedVerse, setCopiedVerse]         = useState<number | null>(null)
  const [isPlayingAudio, setIsPlayingAudio]   = useState<boolean>(false)

  /* Personal notes + highlights. Both live in the same SharedPreferences files
     the app uses, so `usePrefs` reads localStorage signed out and the merged
     cloud copy once signed in -- including edits made on the phone. */
  const { getNote, saveNote, deleteNote, count: noteCount } = useVerseNotes()
  const { getHighlight, toggleHighlight, removeHighlight, count: highlightCount } = useVerseHighlights()

  // Which verse currently has its editor / palette open (null = none).
  const [noteVerse, setNoteVerse]     = useState<number | null>(null)
  const [paletteVerse, setPaletteVerse] = useState<number | null>(null)

  // 1. Book list: one tiny request per translation, cached after first load.
  useEffect(() => {
    let cancelled = false
    setManifestLoading(true)
    setError(null)

    loadBibleManifest(selectedVersionKey)
      .then(list => {
        if (cancelled) return
        setManifest(list)
        setManifestLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message || 'Unable to load the book list.')
        setManifestLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedVersionKey])

  // 2. Verse text: fetched only for the selected book (~70 KB, cached).
  useEffect(() => {
    if (manifest.length === 0) return

    let cancelled = false
    setBookLoading(true)
    setError(null)
    setStatusMessage(`Loading ${manifest[selectedBookIndex]?.name ?? ''}...`)

    // Book id is 1-based in the manifest.
    const bookId = (manifest[selectedBookIndex]?.id ?? selectedBookIndex + 1)

    loadBibleBook(selectedVersionKey, bookId)
      .then(book => {
        if (cancelled) return
        setCurrentBook(book)
        setBookLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message || 'Unable to load this book.')
        setBookLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedVersionKey, selectedBookIndex, manifest])

  /* 3. Deep links: /bible?book=43&chapter=3 (used by reading plans and the
        account page). Manifest ids are 1-based, and this runs once per arrival. */
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkApplied = useRef(false)

  useEffect(() => {
    if (deepLinkApplied.current || manifest.length === 0) return

    const bookParam = searchParams.get('book')
    const chapterParam = searchParams.get('chapter')
    if (!bookParam) return

    const bookId = Number(bookParam)
    const index = manifest.findIndex(m => m.id === bookId)
    if (index !== -1) {
      setBookIndex(index)
      setChapterNum(Math.max(1, Number(chapterParam) || 1))
    }
    deepLinkApplied.current = true
    // Intentionally runs only when the manifest first arrives.
  }, [manifest, searchParams, setSearchParams])

  // Chapter bounds come from the manifest, so they are correct before the
  // book body has finished downloading.
  const currentBookMeta = manifest[selectedBookIndex]
  const totalChapters = currentBookMeta?.chapters ?? 0

  // Current chapter within the loaded book
  const currentChapter: ParsedChapter | undefined = useMemo(() => {
    if (!currentBook) return undefined
    return currentBook.chapters.find(c => c.chapter === selectedChapterNum) || currentBook.chapters[0]
  }, [currentBook, selectedChapterNum])

  /* 3b. Verse-level deep link: /bible?book=43&chapter=3&verse=16, used by the
        Notes & Highlights page. Waits for the chapter's text, then centres the
        verse so the jump is obvious. */
  const deepLinkVerse = searchParams.get('verse')
  const verseScrolled = useRef(false)

  useEffect(() => {
    if (verseScrolled.current || manifestLoading || bookLoading || !currentChapter) return

    const verseNumber = Number(deepLinkVerse)
    if (!verseNumber) return
    verseScrolled.current = true

    const target = document.getElementById(`verse-${verseNumber}`)
    if (!target) return
    // Defer a beat so the browser has painted the verse list.
    const t = window.setTimeout(
      () => target.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      80,
    )
    return () => window.clearTimeout(t)
  }, [manifestLoading, bookLoading, currentChapter, deepLinkVerse])

  /* 4. Record the position + chapter completion so it syncs to the app. */
  const { savePosition } = useLastRead()
  const { markChapterRead } = useBibleProgress(selectedVersionKey)

  useEffect(() => {
    if (!currentBook || !currentChapter || manifestLoading || bookLoading) return
    savePosition(selectedBookIndex, currentChapter.chapter, 0)
    markChapterRead(selectedBookIndex, currentChapter.chapter)
    // Re-run when the reader lands somewhere new, not on every progress write.
  }, [currentBook, currentChapter, manifestLoading, bookLoading, selectedBookIndex, savePosition, markChapterRead])

  // Filtered books for the book selector modal / dropdown
  const filteredBooks = useMemo(() => {
    return manifest.filter(b => {
      const matchesTestament =
        testamentFilter === 'ALL' ||
        (testamentFilter === 'OT' && b.testament === 'OT') ||
        (testamentFilter === 'NT' && b.testament === 'NT')

      const matchesSearch =
        !bookSearch.trim() || b.name.toLowerCase().includes(bookSearch.toLowerCase().trim())

      return matchesTestament && matchesSearch
    })
  }, [manifest, testamentFilter, bookSearch])

  // Navigation handlers
  function handlePrevChapter() {
    if (selectedChapterNum > 1) {
      setChapterNum(selectedChapterNum - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (selectedBookIndex > 0) {
      const prevIndex = selectedBookIndex - 1
      setBookIndex(prevIndex)
      // Jump to the last chapter of the previous book using manifest data,
      // so this works before the previous book's text has been downloaded.
      setChapterNum(manifest[prevIndex]?.chapters ?? 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleNextChapter() {
    if (selectedChapterNum < totalChapters) {
      setChapterNum(selectedChapterNum + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (selectedBookIndex < manifest.length - 1) {
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

  /* ── Notes & highlights ───────────────────────────────────────────────────
     Verse ids are the app's `LikedVersePrefs.createUniqueVerseId` strings, so a
     highlight written here is the same key the phone writes for John 3:16. */
  const readerBookName = currentBook?.name ?? currentBookMeta?.name ?? ''

  function verseIdFor(verseNumber: number): string {
    if (!readerBookName || !currentChapter) return ''
    return createVerseId(readerBookName, currentChapter.chapter, verseNumber)
  }

  /* Leaving the passage closes whatever editor was open, the same way the app's
     bottom sheet is dismissed on navigation. */
  useEffect(() => {
    setNoteVerse(null)
    setPaletteVerse(null)
  }, [selectedBookIndex, selectedChapterNum])

  function toggleNoteEditor(verseNumber: number) {
    setPaletteVerse(null)
    setNoteVerse(prev => (prev === verseNumber ? null : verseNumber))
  }

  function togglePalette(verseNumber: number) {
    setNoteVerse(null)
    setPaletteVerse(prev => (prev === verseNumber ? null : verseNumber))
  }

  function pickHighlightColor(verseNumber: number, color: HighlightColorName) {
    const verseId = verseIdFor(verseNumber)
    if (verseId) toggleHighlight(verseId, color)
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
        description={`Read the full 66 books of the Holy Bible online. Complete Old & New Testament in six translations: WEB, KJV, ASV, BSB, Hindi and Spanish — with notes, highlights and offline reading.`}
        canonical="/bible"
      />

      <main id="main-content" className="shell-narrow pb-16 sm:pb-20">
        <PageHeader
          icon="bible"
          eyebrow="Complete Scripture Reader"
          title="The Holy Bible"
          subtitle="Read all 66 books in six translations, with notes, highlights and offline access."
          actions={
            <Link
              to="/bible/notes"
              className="btn-secondary !px-4 !py-2 text-xs whitespace-nowrap"
            >
              <Icon name="note" className="w-4 h-4" />
              Notes &amp; Highlights
              {(noteCount + highlightCount) > 0 && (
                <span className="ml-1 rounded-full bg-gold-100 text-gold-800 px-1.5 py-0.5 text-[10px] font-bold">
                  {noteCount + highlightCount}
                </span>
              )}
            </Link>
          }
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
                Book ({manifest.length} Books)
              </label>
              <select
                id="book-select"
                disabled={manifestLoading || manifest.length === 0}
                value={selectedBookIndex}
                onChange={e => {
                  setBookIndex(Number(e.target.value))
                  setChapterNum(1)
                }}
                className="w-full border border-parchment-300 rounded-xl px-3 py-2 text-sm bg-white font-medium"
              >
                {manifest.map((b, idx) => (
                  <option key={b.id} value={idx}>
                    {idx + 1}. {b.name} ({b.chapters} ch)
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Chapter Selector — options come from the manifest, so this
                is populated as soon as the 4 kB manifest arrives rather than
                waiting for the book's verse text. */}
            <div>
              <label htmlFor="chapter-select" className="block text-xs font-bold text-ink-600 uppercase tracking-wider mb-1">
                Chapter
              </label>
              <select
                id="chapter-select"
                disabled={manifestLoading || totalChapters === 0}
                value={selectedChapterNum}
                onChange={e => setChapterNum(Number(e.target.value))}
                className="w-full border border-parchment-300 rounded-xl px-3 py-2 text-sm bg-white font-medium"
              >
                {Array.from({ length: totalChapters }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Chapter {i + 1}
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
                  disabled={bookLoading || !currentChapter}
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
        {manifestLoading || bookLoading ? (
          <div className="card p-12 text-center text-ink-600 animate-pulse">
            <Icon name="bible" className="w-10 h-10 mx-auto mb-3 animate-spin text-ink-400" />
            <h3 className="font-serif font-bold text-lg text-ink-900 mb-1">
              {currentBookMeta
                ? `Loading ${currentBookMeta.name}`
                : `Loading ${selectedVersionInfo.name}`}
            </h3>
            <p className="text-xs text-ink-500">
              {statusMessage || 'Preparing scripture text...'}
            </p>
            {/* Skeleton keeps the layout stable so the page does not jump when
                the verses arrive. */}
            <div className="mt-6 mx-auto max-w-md space-y-2" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-3 bg-parchment-200 rounded-full w-full" />
              ))}
            </div>
          </div>
        ) : !currentBook || !currentChapter ? (
          <div className="card p-10 text-center text-ink-600">
            <p>No chapter data found.</p>
          </div>
        ) : (
          <article className="card shadow-soft overflow-hidden animate-fade-in">
            {/* Chapter Header Banner */}
            <div className="bg-gradient-to-r from-ink-900 via-ink-800 to-ink-950 text-white p-6 sm:p-8 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-eyebrow text-gold-300">
                  {currentBook.testament === 'OT' ? 'Old Testament' : 'New Testament'}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
                  {currentBook.name} {currentChapter.chapter}
                </h2>
                <p className="text-xs text-parchment-200 mt-1">
                  {selectedVersionInfo.name} · {currentChapter.verses.length} verses
                </p>
              </div>

              <Icon name="bible" className="w-14 h-14 text-white opacity-20 shrink-0" />
            </div>

            {/* Translation credit. Required for the in-copyright translations and
                good practice for the public-domain ones: the reader previously
                reproduced the Berean Standard Bible and the Hindi Bible with no
                notice at all. */}
            <TranslationCredit versionKey={selectedVersionInfo.key} />

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
              {currentChapter.verses.map(v => {
                const verseId = verseIdFor(v.number)
                const highlight = verseId ? getHighlight(verseId) : null
                const note = verseId ? getNote(verseId) : ''
                const swatch = highlight ? highlightSwatch(highlight.colorName) : null
                const segments = highlightSegments(v.text, v.number, highlight)

                return (
                  <div
                    key={v.number}
                    id={`verse-${v.number}`}
                    onClick={() => handleCopyVerse(v)}
                    className="group relative cursor-pointer hover:bg-gold-50/50 p-1.5 -mx-1.5 rounded-lg transition-colors"
                    title="Click to copy verse"
                  >
                    <sup
                      className={clsx(
                        'font-sans font-bold text-xs sm:text-sm mr-2 select-none',
                        note ? 'text-gold-700' : 'text-ink-700 group-hover:text-gold-600',
                      )}
                    >
                      {v.number}
                    </sup>

                    {segments ? (
                      /* A range highlight made on the phone: only the selected
                         words carry the colour, as VerseAdapter renders it. */
                      <span className="text-ink-900 group-hover:text-black">
                        {segments.before}
                        <mark
                          className="rounded-sm px-0.5 text-ink-900"
                          style={{ backgroundColor: swatch?.wash }}
                        >
                          {segments.marked}
                        </mark>
                        {segments.after}
                      </span>
                    ) : (
                      <span
                        className={clsx('rounded-sm', swatch && 'px-1 -mx-1')}
                        style={swatch ? { backgroundColor: swatch.wash } : undefined}
                      >
                        <span className="text-ink-900 group-hover:text-black">{v.text}</span>
                      </span>
                    )}

                    {copiedVerse === v.number && (
                      <span className="ml-2 font-sans text-xs bg-ink-800 text-white px-2 py-0.5 rounded-md shadow-soft">
                        Copied
                      </span>
                    )}

                    {/* Per-verse tools. Kept in the flow rather than absolutely
                        positioned so long verses wrap underneath them. */}
                    <span
                      className="ml-2 align-top font-sans text-[11px] whitespace-nowrap inline-flex items-center gap-0.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => toggleNoteEditor(v.number)}
                        aria-expanded={noteVerse === v.number}
                        title={note ? 'Edit note' : 'Add a note'}
                        aria-label={note ? `Edit note on verse ${v.number}` : `Add a note on verse ${v.number}`}
                        className={clsx(
                          'p-1 rounded-md transition-colors',
                          note
                            ? 'text-gold-700 hover:bg-gold-100'
                            : 'text-ink-300 hover:text-ink-700 hover:bg-parchment-100',
                          noteVerse === v.number && 'bg-gold-100 text-gold-800',
                        )}
                      >
                        <Icon name="note" className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => togglePalette(v.number)}
                        aria-expanded={paletteVerse === v.number}
                        title="Highlight this verse"
                        aria-label={`Highlight verse ${v.number}`}
                        className={clsx(
                          'p-1 rounded-md transition-colors',
                          highlight
                            ? 'hover:bg-parchment-100'
                            : 'text-ink-300 hover:text-ink-700 hover:bg-parchment-100',
                        )}
                        style={highlight ? { color: swatch?.solid } : undefined}
                      >
                        <Icon name="highlighter" className="w-3.5 h-3.5" />
                      </button>
                    </span>

                    {paletteVerse === v.number && (
                      <VerseHighlightPalette
                        current={highlight}
                        onPick={color => pickHighlightColor(v.number, color)}
                        onClear={() => { if (verseId) removeHighlight(verseId) }}
                        onClose={() => setPaletteVerse(null)}
                      />
                    )}
                  </div>
                )
              })}
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
                Click any verse to copy · use the pencil and highlighter to annotate
              </div>

              <button
                onClick={handleNextChapter}
                disabled={selectedBookIndex === manifest.length - 1 && selectedChapterNum === totalChapters}
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
            {filteredBooks.map(b => {
              // filteredBooks is derived from manifest, so the manifest index
              // is the canonical book index the reader state expects.
              const originalIndex = manifest.indexOf(b)
              const isSelected = originalIndex === selectedBookIndex
              return (
                <button
                  key={b.id}
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
                  <p className={clsx('text-[10px] mt-0.5', isSelected ? 'text-gold-300' : 'text-ink-500')}>
                    {b.chapters} chapters
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Note editor (portalled, so it is never clipped by the reader) ── */}
        <VerseNoteDialog
          open={noteVerse !== null}
          reference={noteVerse !== null && currentChapter && currentBookMeta
            ? `${currentBookMeta.name} ${currentChapter.chapter}:${noteVerse}`
            : ''}
          initialText={noteVerse !== null ? getNote(verseIdFor(noteVerse)) : ''}
          onSave={text => { if (noteVerse !== null) saveNote(verseIdFor(noteVerse), text) }}
          onDelete={() => { if (noteVerse !== null) deleteNote(verseIdFor(noteVerse)) }}
          onClose={() => setNoteVerse(null)}
        />
      </main>
    </>
  )
}
