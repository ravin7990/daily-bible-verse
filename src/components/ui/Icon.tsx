/**
 * Inline SVG icon set.
 *
 * Replaces the emoji icons that were previously used for navigation. Emoji
 * render differently on every OS, are announced inconsistently by screen
 * readers, and add several KB of font-glyph lookup. Inline SVG is:
 *   - visually identical on every device
 *   - currentColor, so it inherits text colour
 *   - aria-hidden, because the accessible name comes from the adjacent label
 *
 * All icons share a 24x24 viewBox and are stroked (not filled) unless noted.
 */

import type { ReactElement } from 'react'

export type IconName =
  | 'home'
  | 'archive'
  | 'book'
  | 'prayer'
  | 'image'
  | 'bible'
  | 'bookmark'
  | 'search'
  | 'share'
  | 'copy'
  | 'check'
  | 'volume'
  | 'stop'
  | 'download'
  | 'chevronDown'
  | 'chevronRight'
  | 'arrowRight'
  | 'clock'
  | 'close'
  | 'menu'
  | 'sparkle'
  | 'leaf'
  | 'heart'
  | 'shield'
  | 'scroll'
  | 'note'
  | 'highlighter'
  | 'user'
  | 'settings'

interface IconProps {
  name: IconName
  className?: string
  /** Provide only when the icon is the sole label for a control. */
  title?: string
}

const PATHS: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h3.5v-6h5v6H18a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  archive: (
    <>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v13.5" />
      <path d="M6.5 17.5A1.5 1.5 0 0 1 8 16h12v5H8a1.5 1.5 0 0 1-1.5-1.5v-2Z" />
      <path d="M9 7.5h7" />
    </>
  ),
  prayer: (
    <>
      <path d="M12 3.5c-1.2 2.4-3 3.6-3 6a3 3 0 0 0 6 0c0-2.4-1.8-3.6-3-6Z" />
      <path d="M6 12.5a6 6 0 0 0 12 0" />
      <path d="M4.5 20.5h15" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 4.5-4.5 3.5 3.5 3-3 5 5" />
    </>
  ),
  bible: (
    <>
      <path d="M12 6.5S10 4 6 4H3v14h3c4 0 6 2.5 6 2.5" />
      <path d="M12 6.5S14 4 18 4h3v14h-3c-4 0-6 2.5-6 2.5" />
      <path d="M12 6.5v14" />
    </>
  ),
  bookmark: (
    <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  share: (
    <>
      <path d="M12 3.5v11" />
      <path d="m8 7 4-3.5L16 7" />
      <path d="M5 12v7.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V12" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V5.5a1.5 1.5 0 0 0-1.5-1.5h-9A1.5 1.5 0 0 0 3 5.5v9A1.5 1.5 0 0 0 4.5 16H9" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  volume: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
      <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M18 7a7 7 0 0 1 0 10" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  download: (
    <>
      <path d="M12 3.5v11" />
      <path d="m8 11 4 3.5 4-3.5" />
      <path d="M4 16v3.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V16" />
    </>
  ),
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  arrowRight: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sparkle: (
    <>
      <path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9 12 3.5Z" />
      <path d="M18.5 16.5 19 18l1.5.5L19 19l-.5 1.5L18 19l-1.5-.5L18 18l.5-1.5Z" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-7 5-12 14-12 0 9-5 13-11 13H5Z" />
      <path d="M9 15c2-3 5-5 8-6" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.4-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20Z" />
  ),
  shield: <path d="M12 3.5 19 6v6c0 4-3 7-7 8.5C8 19 5 16 5 12V6l7-2.5Z" />,
  scroll: (
    <>
      <path d="M6 4.5h11a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.5" />
      <path d="M9 8.5h6M9 12h6" />
    </>
  ),
  note: (
    <>
      <path d="M4.5 19.5h4L19 9a2.83 2.83 0 0 0-4-4L4.5 15.5v4Z" />
      <path d="m14 6 4 4" />
    </>
  ),
  highlighter: (
    <>
      <path d="m14 4 6 6-8.5 8.5H5.5v-6L14 4Z" />
      <path d="m11 7 6 6" />
      <path d="M3 21h9" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </>
  ),
}

export default function Icon({ name, className = 'w-5 h-5', title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  )
}
