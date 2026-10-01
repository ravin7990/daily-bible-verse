import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import AuthModal from '@/components/auth/AuthModal'
import Icon from '@/components/ui/Icon'

/**
 * Header account control.
 *
 * Signed out it shows a "Sign in" button; signed in it shows an avatar menu with
 * the account, sync status, and sign out. Rendered as a real menu with
 * aria-expanded/aria-haspopup and Escape-to-close.
 */
export default function UserMenu() {
  const { user, initialising, busy, signOut, synced, lastSyncError } = useAuth()
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  /* Signed out — don't render a button that does nothing while auth boots. */
  if (initialising) {
    return (
      <div
        className="w-24 h-9 rounded-lg bg-parchment-200 animate-pulse"
        aria-hidden="true"
      />
    )
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="btn-primary !px-4 !py-2 text-sm shrink-0"
        >
          <Icon name="user" className="w-4 h-4" />
          <span className="hidden sm:inline">Sign in</span>
          <span className="sm:hidden">In</span>
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    )
  }

  const initial = (user.displayName || user.email || 'U').trim().charAt(0).toUpperCase()

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full
                   hover:bg-parchment-200/70 transition-colors"
      >
        <span className="grid place-items-center w-8 h-8 rounded-full bg-ink-800 text-gold-300
                         text-sm font-bold shrink-0">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" loading="lazy" />
          ) : initial}
        </span>
        <span className="hidden lg:block text-sm font-medium text-ink-800 max-w-[9rem] truncate">
          {user.displayName || user.email}
        </span>
        <Icon name="chevronDown" className="w-3.5 h-3.5 text-ink-500 hidden lg:block" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 card shadow-lift p-2 z-50 animate-slide-up"
        >
          <div className="px-3 py-2.5 border-b border-parchment-200">
            <p className="text-sm font-semibold text-ink-900 truncate">
              {user.displayName || 'Bible reader'}
            </p>
            {user.email && (
              <p className="text-xs text-ink-500 truncate">{user.email}</p>
            )}
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium
                          text-gold-800 bg-gold-50 border border-gold-200 px-2 py-0.5 rounded-full">
              {user.provider === 'google' ? 'Google account' : 'Email account'}
              {user.emailVerified ? ' · verified' : ' · unverified'}
            </p>
          </div>

          <div className="py-1.5">
            <Link
              to="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                         text-ink-800 hover:bg-parchment-100 transition-colors"
            >
              <Icon name="archive" className="w-4 h-4 text-ink-500" />
              Your progress
            </Link>
            <Link
              to="/insights"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                         text-ink-800 hover:bg-parchment-100 transition-colors"
            >
              <Icon name="sparkle" className="w-4 h-4 text-gold-600" />
              Reading insights
            </Link>
            <Link
              to="/plans"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                         text-ink-800 hover:bg-parchment-100 transition-colors"
            >
              <Icon name="scroll" className="w-4 h-4 text-ink-500" />
              Reading plans
            </Link>
            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                         text-ink-800 hover:bg-parchment-100 transition-colors"
            >
              <Icon name="settings" className="w-4 h-4 text-ink-500" />
              Settings
            </Link>
          </div>

          <div className="px-3 py-2 border-t border-parchment-200">
            <p className="text-[11px] text-ink-500 leading-relaxed flex items-start gap-1.5">
              <Icon name={synced && !lastSyncError ? 'check' : 'sparkle'} className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                {!synced ? 'Syncing with the app…'
                  : lastSyncError ? 'Signed in — some data could not sync'
                  : 'Synced with the mobile app'}
              </span>
            </p>
          </div>

          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={async () => {
              setOpen(false)
              await signOut()
              navigate('/')
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                       text-ink-800 hover:bg-parchment-100 transition-colors
                       disabled:opacity-60 border-t border-parchment-200"
          >
            <Icon name="close" className="w-4 h-4 text-ink-500" />
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}