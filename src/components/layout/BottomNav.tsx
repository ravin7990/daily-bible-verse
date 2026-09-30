import { NavLink } from 'react-router-dom'
import Icon, { type IconName } from '@/components/ui/Icon'

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/',          label: 'Today',      icon: 'home'    },
  { to: '/archive',   label: 'Archive',    icon: 'archive' },
  { to: '/stories',   label: 'Stories',    icon: 'book'    },
  { to: '/prayers',   label: 'Prayers',    icon: 'prayer'  },
  { to: '/community', label: 'Wallpapers', icon: 'image'   },
]

export default function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-parchment-50/95
                 backdrop-blur-md border-t border-parchment-200 pb-safe"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 h-[60px] text-[11px] font-medium transition-colors ${
                  isActive ? 'text-ink-900' : 'text-ink-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active marker sits above the icon, not as a colour-only cue */}
                  <span
                    aria-hidden="true"
                    className={`w-8 h-[3px] rounded-full transition-colors ${
                      isActive ? 'bg-gold-600' : 'bg-transparent'
                    }`}
                  />
                  <Icon name={icon} className="w-[22px] h-[22px]" />
                  <span className="leading-none">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
