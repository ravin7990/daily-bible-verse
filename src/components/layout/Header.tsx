import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Icon from '@/components/ui/Icon'
import UserMenu from '@/components/auth/UserMenu'

const navLinks = [
  { to: '/',          label: 'Today'      },
  { to: '/archive',   label: 'Archive'    },
  { to: '/stories',   label: 'Stories'    },
  { to: '/prayers',   label: 'Prayers'    },
  { to: '/teachings', label: 'Teachings'  },
  { to: '/bible',     label: 'Bible'      },
  { to: '/plans',     label: 'Plans'      },
  { to: '/community', label: 'Wallpapers' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  /* While the drawer is open: lock scroll, trap focus, close on Escape/resize. */
  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    const onResize = () => {
      if (window.matchMedia('(min-width: 768px)').matches) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      previouslyFocused?.focus()
    }
  }, [open])

  return (
    <header className="sticky top-0 z-40 bg-parchment-50/90 backdrop-blur-md border-b border-parchment-200">
      <div className="shell">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          <Link
            to="/"
            className="group flex items-center gap-2.5 rounded-lg py-1"
            aria-label="Bible Verse of the Day — home"
          >
            <span
              aria-hidden="true"
              className="grid place-items-center w-9 h-9 rounded-lg bg-ink-800 text-gold-300
                         font-serif text-lg leading-none shadow-soft
                         group-hover:bg-ink-900 transition-colors"
            >
              B
            </span>
            <span className="font-serif font-semibold text-[15px] sm:text-base text-ink-900 leading-tight">
              <span className="hidden sm:block">Bible Verse of the Day</span>
              <span className="sm:hidden">Bible Verse</span>
              <span className="block text-[11px] font-sans font-medium text-ink-500 leading-tight">
                Daily Scripture &amp; Devotional
              </span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-0.5">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `inline-block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-ink-900 bg-parchment-200/70'
                          : 'text-ink-600 hover:text-ink-900 hover:bg-parchment-100'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <UserMenu />

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="md:hidden grid place-items-center w-11 h-11 -mr-2 rounded-lg text-ink-800
                         hover:bg-parchment-200/70 transition-colors"
            >
              <Icon name={open ? 'close' : 'menu'} className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="md:hidden border-t border-parchment-200 bg-parchment-50 animate-fade-in"
      >
        <nav aria-label="Mobile" className="shell py-3">
          <ul className="grid gap-0.5">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                      isActive
                        ? 'bg-ink-800 text-white'
                        : 'text-ink-800 hover:bg-parchment-200/70'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{label}</span>
                      <Icon
                        name="chevronRight"
                        className={`w-4 h-4 ${isActive ? 'text-gold-300' : 'text-ink-400'}`}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <a
            href="https://play.google.com/store/apps/details?id=com.bible.verseoftheday2026"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="btn-gold w-full mt-3"
          >
            <Icon name="download" className="w-4 h-4" />
            Get the App
          </a>
        </nav>
      </div>
    </header>
  )
}