import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',          label: 'Home',       icon: '🏠' },
  { to: '/archive',   label: 'Archive',    icon: '📅' },
  { to: '/community', label: 'Wallpapers', icon: '🖼️' },
  { to: '/stories',   label: 'Stories',    icon: '📖' },
  { to: '/prayers',   label: 'Prayers',    icon: '🙏' },
]

export default function BottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 pb-safe"
    >
      <ul className="flex items-stretch h-16" role="list">
        {tabs.map(({ to, label, icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full gap-0.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-sacred-700'
                    : 'text-gray-500 hover:text-gray-800'
                }`
              }
              aria-current={undefined}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`text-xl leading-none ${isActive ? 'scale-110' : ''} transition-transform`}
                    aria-hidden="true"
                  >
                    {icon}
                  </span>
                  <span>{label}</span>
                  {isActive && (
                    <span className="sr-only">(current page)</span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
