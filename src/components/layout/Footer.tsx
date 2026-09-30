import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16 pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="font-serif font-bold text-sacred-700 text-lg mb-2">
              ✝ Bible Verse of the Day
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Nourish your faith daily with Scripture, reflection, and prayer.
            </p>
          </div>

          {/* Content links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Content</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              {[
                { to: '/',          label: 'Today\'s Verse' },
                { to: '/archive',   label: 'Archive'        },
                { to: '/stories',   label: 'Bible Stories'  },
                { to: '/teachings', label: 'Teachings'      },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-sacred-600 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pray links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Prayer</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              {[
                { to: '/prayers',    label: 'Prayer Library' },
                { to: '/bible',      label: 'Read the Bible' },
                { to: '/community',  label: 'Community'      },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-sacred-600 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* App download */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Get the App</h3>
            <a
              href="https://play.google.com/store/apps/details?id=com.bible.verseoftheday2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-sacred-600 transition-colors"
              aria-label="Download on Google Play"
            >
              <span aria-hidden="true">📱</span> Google Play
            </a>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <p>© {year} Bible Verse of the Day. All rights reserved.</p>
          <p>Made with ❤️ for daily devotionals</p>
        </div>
      </div>
    </footer>
  )
}
