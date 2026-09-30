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
      { to: '/',          label: "Today's Verse"    },
      { to: '/archive',   label: 'Verse Archive'    },
      { to: '/prayers',   label: 'Prayer Library'   },
      { to: '/teachings', label: 'Teachings of Jesus' },
    ],
  },
  {
    heading: 'Read',
    links: [
      { to: '/bible',   label: 'Bible Reader'      },
      { to: '/stories', label: 'Bible Stories'     },
      { to: '/teachings', label: 'Sayings of Jesus' },
    ],
  },
  {
    heading: 'Popular Verses',
    links: [
      { to: '/archive', label: 'John 3:16'   },
      { to: '/archive', label: 'Psalm 23:1'  },
      { to: '/archive', label: 'Philippians 4:13' },
      { to: '/archive', label: 'Proverbs 3:5-6' },
    ],
  },
  {
    heading: 'More',
    links: [
      { to: '/community', label: 'Verse Wallpapers' },
      { to: '/bible',     label: 'Read the Bible'   },
    ],
  },
]

const TRUST: { icon: IconName; label: string }[] = [
  { icon: 'book',    label: '100% Free'          },
  { icon: 'shield',  label: 'Ad-free reading'    },
  { icon: 'download', label: 'Works offline'     },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-parchment-200 bg-white pb-nav md:pb-0">
      <div className="shell py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
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
          <p>© {year} Bible Verse of the Day. All rights reserved.</p>
          <p>Made with care for daily devotionals</p>
        </div>
      </div>
    </footer>
  )
}
