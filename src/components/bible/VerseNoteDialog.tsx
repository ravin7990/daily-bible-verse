import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/components/ui/Icon'

interface VerseNoteDialogProps {
  open: boolean
  /** "John 3:16" -- shown as the dialog's subtitle. */
  reference: string
  /** The note already stored for this verse, if any. */
  initialText: string
  /** Blank text deletes the note, matching VerseNotesPreferences.saveNote. */
  onSave: (text: string) => void
  onDelete: () => void
  onClose: () => void
}

/**
 * Personal note editor for a single verse.
 *
 * Mirrors the app's `dialog_edit_note` bottom sheet (VerseAdapter's note button):
 * prefilled text, Save and Delete. The web equivalent of the sheet's Save button
 * is both an explicit Save *and* an auto-save on blur -- typing alone never
 * touches RTDB, so a long note costs one write when the field is left, not one
 * per keystroke.
 */
export default function VerseNoteDialog({
  open,
  reference,
  initialText,
  onSave,
  onDelete,
  onClose,
}: VerseNoteDialogProps) {
  const [text, setText] = useState(initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const labelId = useId()
  /** Last value handed to `onSave`, so a blur + click never double-writes. */
  const savedRef = useRef(initialText)

  /* Reseed the field each time the dialog opens for a (possibly new) verse. */
  useEffect(() => {
    if (!open) return
    setText(initialText)
    savedRef.current = initialText
    const t = window.setTimeout(() => textareaRef.current?.focus(), 30)
    return () => window.clearTimeout(t)
  }, [open, initialText])

  function commit() {
    const next = text.trim()
    if (next === savedRef.current.trim()) return
    savedRef.current = next
    onSave(next)
  }

  function close() {
    commit()
    onClose()
  }

  /* Escape closes (committing first), and the page behind must not scroll.
     No dependency array on purpose: the handler must always close over the
     current `text`, and re-binding one document listener per keystroke is
     cheaper than a ref that can go stale. */
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  })

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6
                 overflow-y-auto bg-ink-950/70 backdrop-blur-sm animate-fade-in"
      onClick={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="card w-full max-w-lg shadow-lift animate-slide-up my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              aria-hidden="true"
              className="grid place-items-center w-8 h-8 rounded-full bg-gold-50 text-gold-700 shrink-0"
            >
              <Icon name="note" className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 id={labelId} className="font-serif font-bold text-lg text-ink-900">
                Personal Note
              </h2>
              <p className="text-xs text-ink-500 truncate">{reference}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close note editor"
            className="text-ink-400 hover:text-ink-800 transition-colors shrink-0"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-6 pb-5">
          <label htmlFor="verse-note" className="sr-only">Note for {reference}</label>
          <textarea
            id="verse-note"
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={commit}
            rows={6}
            placeholder="What does this verse mean to you?"
            className="w-full border border-parchment-300 rounded-xl px-3 py-2.5 text-sm
                       bg-white text-ink-800 resize-y focus-visible:outline-none leading-relaxed"
          />
          <p className="mt-2 text-[11px] text-ink-500">
            Saved automatically when you leave the field, and synced with the mobile app.
          </p>
        </div>

        <div className="flex items-center gap-2 px-5 sm:px-6 py-4 border-t border-parchment-200 bg-parchment-50">
          {initialText.trim() ? (
            <button
              type="button"
              onClick={() => { onDelete(); onClose() }}
              className="btn-secondary !px-3.5 !py-2 text-xs border-red-200 text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          ) : (
            <button type="button" onClick={close} className="btn-secondary !px-3.5 !py-2 text-xs">
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={() => { commit(); onClose() }}
            className="btn-primary !px-4 !py-2 text-xs sm:ml-auto flex items-center gap-1.5"
          >
            <Icon name="check" className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
