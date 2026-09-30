import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/',          label: 'Home'       },
  { to: '/archive',   label: 'Archive'    },
  { to: '/stories',   label: 'Stories'    },
  { to: '/community', label: 'Wallpapers' },
  { to: '/prayers',   label: 'Prayers'    },
  { to: '/teachings', label: 'Teachings'  },
  { to: '/bible',     label: 'Bible'      },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-serif font-bold text-lg text-sacred-700 hover:text-sacred-800 transition-colors"
          aria-label="Bible Verse of the Day — Home"
        >
          <span aria-hidden="true" className="text-2xl">✝</span>
          <span className="hidden sm:inline">Bible Verse of the Day</span>
          <span className="sm:hidden">BibleVerse</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sacred-50 text-sacred-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile: hidden (BottomNav handles it) */}
        <div className="md:hidden" aria-hidden="true" />
      </div>
    </header>
  )
}
