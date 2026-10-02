import { Link } from 'react-router-dom'
import Icon, { type IconName } from '@/components/ui/Icon'

interface FooterColumn {
  heading: string
  links: { to: string; label: string }[]
}

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Devotional',
    links: [
      { to: '/',           label: "Today's Verse"      },
      { to: '/archive',    label: 'Verse Archive'      },
      { to: '/prayers',    label: 'Prayer Library'     },
      { to: '/teachings',  label: 'Teachings of Jesus' },
      { to: '/plans',      label: 'Reading Plans'      },
    ],
  },
  {
    heading: 'Read',
    links: [
      { to: '/bible',          label: 'Bible Reader'      },
      { to: '/bible/notes',    label: 'Notes & Highlights'},
      { to: '/stories',        label: 'Bible Stories'     },
      { to: '/teachings',      label: 'Sayings of Jesus'  },
      { to: '/community',      label: 'Verse Wallpapers'  },
    ],
  },
  {
    heading: 'Company',
    links: [
      { to: '/about',   label: 'About'         },
      { to: '/contact', label: 'Contact'       },
      { to: '/privacy', label: 'Privacy Policy'},
      { to: '/terms',   label: 'Terms of Use'  },
    ],
  },
]

/**
 * Trust signals shown under the wordmark.
 *
 * The previous list advertised "Ad-free reading", which cannot stay once the
 * site serves AdSense: a visible claim that there is no advertising, made while
 * asking to be approved to show advertising, is exactly the kind of
 * misrepresentation AdSense penalises. "Free to read" is accurate, because
 * access costs nothing either way.
 */
const TRUST: { icon: IconName; label: string }[] = [
  { icon: 'book',    label: 'Free to read'  },
  { icon: 'shield',  label: 'No sign-up needed' },
  { icon: 'download', label: 'Works offline' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-parchment-200 bg-white pb-nav md:pb-0">
      <div className="shell py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand + trust signals */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <span
                aria-hidden="true"
                className="grid place-items-center w-9 h-9 rounded-lg bg-ink-800 text-gold-300 font-serif text-lg"
              >
                B
              </span>
              <span className="font-serif font-semibold text-ink-900 text-[15px] leading-tight">
                Bible Verse
                <span className="block text-[11px] font-sans font-medium text-ink-500">
                  of the Day
                </span>
              </span>
            </Link>

            <p className="text-sm text-ink-600 leading-relaxed mt-3 max-w-xs">
              A free daily Bible verse with reflection, prayer and life application —
              plus a complete Bible reader, 180+ stories and 500+ prayers.
            </p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {TRUST.map(({ icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium
                             text-ink-600 bg-parchment-100 border border-parchment-200
                             px-2 py-1 rounded-full"
                >
                  <Icon name={icon} className="w-3.5 h-3.5 text-gold-700" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns — internal linking for SEO */}
          {COLUMNS.map(col => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="text-xs font-semibold text-ink-900 uppercase tracking-eyebrow mb-3">
                {col.heading}
              </h2>
              <ul className="space-y-2">
                {col.links.map(({ to, label }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-ink-600 hover:text-ink-900 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* App install bar */}
        <div className="mt-10 pt-8 border-t border-parchment-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-serif text-lg font-semibold text-ink-900">
              Take God's Word with you
            </p>
            <p className="text-sm text-ink-600 mt-0.5">
              Daily verse on your lock screen, offline reading, and widgets.
            </p>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.bible.verseoftheday2026"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary shrink-0"
          >
            <Icon name="download" className="w-4 h-4" />
            Download on Google Play
          </a>
        </div>

        <div
          className="mt-8 pt-6 border-t border-parchment-200 flex flex-col sm:flex-row
                     items-center justify-between gap-2 text-xs text-ink-500"
        >
          <p>© {year} Bible Verse of the Day.</p>
          <p>
            Scripture translations remain the property of their publishers — see the{' '}
            <Link to="/privacy" className="underline">Privacy Policy</Link> for the
            licence that applies to each one.
          </p>
        </div>
      </div>
    </footer>
  )
}
