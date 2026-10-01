import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '@/components/layout/SEO'
import PageHeader from '@/components/ui/PageHeader'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/auth/AuthProvider'
import {
  loadBibleBook,
  loadBibleManifest,
  type BibleManifestEntry,
} from '@/utils/bibleService'
import {
  bookKey,
  dailyContentDate,
  formatVerseReference,
  highlightSwatch,
  isDailyContentId,
  parseVerseId,
  useVerseHighlights,
  useVerseNotes,
  type VerseHighlight,
} from '@/utils/verseAnnotations'
import { formatLongDate } from '@/utils/dateUtils'
import clsx from 'clsx'

/** Text previews use the reader's default translation; verse ids are version-agnostic. */
const PREVIEW_VERSION = 'WEB'

interface ResolvedRef {
  /** "John 3:16", or a daily-verse label for notes saved from the home card. */
  label: string
  /** Manifest book id for the deep link. */
  bookId: number
  chapter: number
  verse: number
  /** `/bible?...` for a reader verse, `/archive` for a daily verse, null if unknown. */
  href: string | null
}

/**
 * Notes & Highlights — the web counterpart of the app's AllHighlightsFragment
 * plus the note list in its Saved / Dashboard screens.
 *
 * Both collections come straight out of the shared prefs files, so anything
 * highlighted or annotated on the phone shows up here (and vice versa) without
 * any web-only storage of its own.
 */
export default function BibleNotes() {
  const { user, synced } = useAuth()
  const { notes, deleteNote, count: noteCount } = useVerseNotes()
  const { highlights, removeHighlight, count: highlightCount } = useVerseHighlights()

  /* Only the ~4 kB manifest is needed to turn a verse id into a book name and a
     working deep link; verse text stays behind an explicit click. */
  const [manifest, setManifest] = useState<BibleManifestEntry[]>([])
  useEffect(() => {
    let cancelled = false
    loadBibleManifest(PREVIEW_VERSION)
      .then(list => { if (!cancelled) setManifest(list) })
      .catch(() => { /* The list still renders with raw ids if this fails. */ })
    return () => { cancelled = true }
  }, [])

  const bookByKey = useMemo(() => {
    const map = new Map<string, { id: number; name: string; index: number }>()
    manifest.forEach((b, index) => map.set(bookKey(b.name), { id: b.id, name: b.name, index }))
    return map
  }, [manifest])

  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])

  const resolve = useCallback((verseId: string): ResolvedRef | null => {
    const parsed = parseVerseId(verseId)
    if (parsed) {
      const book = bookByKey.get(parsed.bookKey)
      return {
        label: formatVerseReference(verseId, book?.name) ?? verseId,
        bookId: book?.id ?? 0,
        chapter: parsed.chapter,
        verse: parsed.verse,
        href: book
          ? `/bible?book=${book.id}&chapter=${parsed.chapter}&verse=${parsed.verse}`
          : '/bible',
      }
    }
    if (isDailyContentId(verseId)) {
      return {
        label: `Daily verse · ${formatLongDate(dailyContentDate(verseId))}`,
        bookId: 0,
        chapter: 0,
        verse: 0,
        href: '/archive',
      }
    }
    return null
  }, [bookByKey])

  /* ── Lazy verse text ─────────────────────────────────────────────────────
     Fetched one book at a time and cached by `loadBibleBook`, so a page full of
     highlights from the same book still costs a single ~70 kB download. */
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const toggleText = useCallback(async (verseId: string) => {
    if (expandedId === verseId) { setExpandedId(null); return }
    setExpandedId(verseId)
    if (texts[verseId] !== undefined) return

    const parsed = parseVerseId(verseId)
    const book = parsed ? bookByKey.get(parsed.bookKey) : undefined
    if (!parsed || !book) return

    setLoadingId(verseId)
    try {
      const data = await loadBibleBook(PREVIEW_VERSION, book.id)
      const chapter = data.chapters.find(c => c.chapter === parsed.chapter) ?? data.chapters[0]
      const text = chapter?.verses.find(v => v.number === parsed.verse)?.text ?? ''
      if (mounted.current) setTexts(prev => ({ ...prev, [verseId]: text }))
    } catch {
      if (mounted.current) setTexts(prev => ({ ...prev, [verseId]: '' }))
    } finally {
      if (mounted.current) setLoadingId(null)
    }
  }, [bookByKey, expandedId, texts])

  /* Notes carry no timestamp in the shared format, so they are ordered by
     passage to stay stable between renders. */
  const noteEntries = useMemo(
    () =>
      Object.entries(notes)
        .map(([verseId, text]) => ({ verseId, text, ref: resolve(verseId) }))
        .sort((a, b) => {
          const ax = a.ref?.bookId ?? Number.MAX_SAFE_INTEGER
          const bx = b.ref?.bookId ?? Number.MAX_SAFE_INTEGER
          if (ax !== bx) return ax - bx
          const ac = a.ref ? a.ref.chapter * 1000 + a.ref.verse : 0
          const bc = b.ref ? b.ref.chapter * 1000 + b.ref.verse : 0
          return ac - bc
        }),
    [notes, resolve],
  )

  const highlightEntries = useMemo(
    () =>
      highlights
        .map(highlight => ({ highlight, ref: resolve(highlight.verseId) }))
        .sort((a, b) => b.highlight.timestamp - a.highlight.timestamp),
    [highlights, resolve],
  )

  const isEmpty = noteCount === 0 && highlightCount === 0

  return (
    <>
      <SEO
        title="Notes & Highlights"
        description="Every personal note and highlighted verse you have saved, synced with the mobile app."
        noIndex
      />

      <main id="main-content" className="shell-narrow pb-16 sm:pb-20">
        <PageHeader
          icon="bookmark"
          eyebrow="Your Study Library"
          title="Notes & Highlights"
          subtitle="Everything you have annotated while reading, in one place."
          actions={
            <Link to="/bible" className="btn-secondary !px-4 !py-2 text-xs whitespace-nowrap">
              <Icon name="bible" className="w-4 h-4" />
              Back to Reader
            </Link>
          }
        />

        <p className="flex items-start gap-2 text-xs text-ink-600 leading-relaxed mb-6
                      border border-parchment-200 bg-parchment-100 rounded-xl px-4 py-3">
          <Icon name={user && synced ? 'check' : 'shield'} className="w-4 h-4 mt-0.5 shrink-0 text-gold-700" />
          <span>
            {user
              ? 'Signed in — these notes and highlights sync automatically with the Android app.'
              : 'Saved on this device. Sign in with your mobile account and they sync automatically.'}
          </span>
        </p>

        {/* Counts */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <CountTile icon="note" label="Notes" value={noteCount} />
          <CountTile icon="highlighter" label="Highlights" value={highlightCount} />
        </div>

        {isEmpty ? (
          <div className="card p-10 text-center">
            <span
              aria-hidden="true"
              className="grid place-items-center w-12 h-12 rounded-full bg-parchment-100 text-ink-400 mx-auto mb-3"
            >
              <Icon name="note" className="w-6 h-6" />
            </span>
            <h2 className="font-serif font-bold text-lg text-ink-900">Nothing saved yet</h2>
            <p className="text-sm text-ink-600 mt-1 mb-5 max-w-sm mx-auto">
              Open the reader, then use the pencil to add a note or the highlighter to
              colour a verse. Everything you save appears here.
            </p>
            <Link to="/bible" className="btn-primary text-sm inline-flex">
              <Icon name="bible" className="w-4 h-4" />
              Start Reading
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* ── Highlights ── */}
            {highlightEntries.length > 0 && (
              <section aria-labelledby="highlights-heading">
                <h2 id="highlights-heading" className="section-title text-xl sm:text-2xl mb-1">
                  Highlights
                </h2>
                <p className="text-xs text-ink-500 mb-4">
                  Newest first. Open one to jump straight to that verse.
                </p>

                <ul className="space-y-3">
                  {highlightEntries.map(({ highlight, ref }) => (
                    <HighlightRow
                      key={highlight.verseId}
                      highlight={highlight}
                      resolved={ref}
                      text={texts[highlight.verseId]}
                      expanded={expandedId === highlight.verseId}
                      loading={loadingId === highlight.verseId}
                      onToggleText={() => { void toggleText(highlight.verseId) }}
                      onDelete={() => removeHighlight(highlight.verseId)}
                    />
                  ))}
                </ul>
              </section>
            )}

            {/* ── Notes ── */}
            {noteEntries.length > 0 && (
              <section aria-labelledby="notes-heading">
                <h2 id="notes-heading" className="section-title text-xl sm:text-2xl mb-1">
                  Notes
                </h2>
                <p className="text-xs text-ink-500 mb-4">
                  Saved from the reader and from the daily verse card.
                </p>

                <ul className="space-y-3">
                  {noteEntries.map(({ verseId, text, ref }) => (
                    <li key={verseId} className="card p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon name="note" className="w-4 h-4 text-gold-700 shrink-0" />
                          <span className="font-semibold text-sm text-ink-900 truncate">
                            {ref?.label ?? verseId}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteNote(verseId)}
                          aria-label={`Delete note for ${ref?.label ?? verseId}`}
                          className="p-1.5 rounded-lg text-ink-400 hover:text-red-700 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <Icon name="close" className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{text}</p>

                      {ref?.href && (
                        <Link
                          to={ref.href}
                          className="inline-flex items-center gap-1 mt-3 text-xs font-semibold
                                     text-gold-700 hover:text-gold-900"
                        >
                          {ref.href === '/archive' ? 'Open archive' : 'Open in reader'}
                          <Icon name="arrowRight" className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
    </>
  )
}

interface CountTileProps {
  icon:  'note' | 'highlighter'
  label: string
  value: number
}

function CountTile({ icon, label, value }: CountTileProps) {
  return (
    <div className="card p-4 sm:p-5 flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid place-items-center w-10 h-10 rounded-full bg-gold-50 text-gold-700 shrink-0"
      >
        <Icon name={icon} className="w-5 h-5" />
      </span>
      <div>
        <p className="font-serif text-2xl font-bold text-ink-900 leading-none">{value}</p>
        <p className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mt-1">
          {label}
        </p>
      </div>
    </div>
  )
}

interface HighlightRowProps {
  highlight:    VerseHighlight
  resolved:     ResolvedRef | null
  /** Loaded lazily; undefined until "Show verse" is used. */
  text:         string | undefined
  expanded:     boolean
  loading:      boolean
  onToggleText: () => void
  onDelete:     () => void
}

/** One highlighted passage: colour chip, reference, lazy verse text, actions. */
function HighlightRow({
  highlight,
  resolved,
  text,
  expanded,
  loading,
  onToggleText,
  onDelete,
}: HighlightRowProps) {
  const swatch = highlightSwatch(highlight.colorName)
  const isRange = highlight.start !== null && highlight.end !== null
  const day = highlight.timestamp ? new Date(highlight.timestamp) : null

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-parchment-300"
            style={{ backgroundColor: swatch.solid }}
          />
          <span className="font-semibold text-sm text-ink-900 truncate">
            {resolved?.label ?? highlight.verseId}
          </span>
          {isRange && (
            <span className="tag-badge !text-[10px] !px-2 !py-0.5 shrink-0">Selected words</span>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete highlight for ${resolved?.label ?? highlight.verseId}`}
          className="p-1.5 rounded-lg text-ink-400 hover:text-red-700 hover:bg-red-50 transition-colors shrink-0"
        >
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <p
          className="mt-3 font-serif text-sm sm:text-base leading-relaxed text-ink-800 rounded-sm px-1 -mx-1"
          style={{ backgroundColor: swatch.wash }}
        >
          {loading ? 'Loading verse…' : text || 'Verse text unavailable.'}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
        {resolved?.href && (
          <Link
            to={resolved.href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:text-gold-900"
          >
            Open in reader
            <Icon name="arrowRight" className="w-3.5 h-3.5" />
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleText}
          className={clsx(
            'text-xs font-semibold transition-colors',
            expanded ? 'text-ink-900 underline' : 'text-ink-600 hover:text-ink-900',
          )}
        >
          {expanded ? 'Hide verse' : 'Show verse'}
        </button>
        <span className="text-[11px] text-ink-500 ml-auto">
          {day ? formatLongDate(day.toISOString().slice(0, 10)) : 'Date unavailable'}
        </span>
      </div>
    </li>
  )
}
