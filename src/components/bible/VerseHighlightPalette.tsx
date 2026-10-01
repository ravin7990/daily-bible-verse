import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import Icon from '@/components/ui/Icon'
import {
  HIGHLIGHT_COLORS,
  type HighlightColorName,
  type ParsedHighlight,
} from '@/utils/verseAnnotations'

interface VerseHighlightPaletteProps {
  /** The highlight currently stored for this verse, or null. */
  current: ParsedHighlight | null
  onPick: (color: HighlightColorName) => void
  onClear: () => void
  onClose: () => void
}

/**
 * Colour swatches for one verse.
 *
 * Mirrors `dialog_verse_highlight` in the app: the same five named colours, plus
 * a clear button. Selecting the colour that is already applied removes the
 * highlight, so a mis-tap is undone with a second tap rather than a hunt for the
 * clear button.
 */
export default function VerseHighlightPalette({
  current,
  onPick,
  onClear,
  onClose,
}: VerseHighlightPaletteProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const activeColor = current ? current.colorName.toLowerCase() : ''

  /* Click-away and Escape both dismiss; the verse row's own buttons stay clickable. */
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onClose()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-label="Highlight colour"
      className="absolute right-0 top-full z-30 mt-1 flex items-center gap-1 rounded-xl
                 border border-parchment-300 bg-white p-1.5 shadow-lift animate-fade-in"
      onClick={e => e.stopPropagation()}
    >
      {HIGHLIGHT_COLORS.map(swatch => {
        const isActive = activeColor === swatch.name
        return (
          <button
            key={swatch.name}
            type="button"
            onClick={() => { onPick(swatch.name); onClose() }}
            aria-pressed={isActive}
            title={swatch.label}
            className={clsx(
              'w-6 h-6 rounded-full border transition-transform',
              isActive
                ? 'border-ink-800 scale-110 ring-2 ring-ink-800/20'
                : 'border-parchment-300 hover:scale-110',
            )}
            style={{ backgroundColor: swatch.solid }}
          >
            <span className="sr-only">{swatch.label}</span>
          </button>
        )
      })}

      {current && (
        <>
          <span aria-hidden="true" className="w-px h-5 bg-parchment-300 mx-0.5" />
          <button
            type="button"
            onClick={() => { onClear(); onClose() }}
            title="Remove highlight"
            className="inline-flex items-center gap-1 px-2 h-6 rounded-lg text-[11px]
                       font-semibold text-ink-700 hover:bg-parchment-100 transition-colors"
          >
            <Icon name="close" className="w-3.5 h-3.5" />
            Clear
          </button>
        </>
      )}
    </div>
  )
}
