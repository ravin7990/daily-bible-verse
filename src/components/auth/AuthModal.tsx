import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/auth/AuthProvider'
import Icon from '@/components/ui/Icon'

type Mode = 'signin' | 'signup' | 'reset'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  /** Shown when the modal is opened from a specific flow. */
  reason?: string
}

/**
 * Sign in / sign up dialog.
 *
 * Mirrors the app's WelcomeLoginActivity + EmailAuthBottomSheet: Google is the
 * primary path, email/password the alternative, and an account is optional —
 * everything works signed out and is merged into the cloud afterwards.
 */
export default function AuthModal({ open, onClose, reason }: AuthModalProps) {
  const { signInGoogle, signInEmail, signUpEmail, resetPassword, busy, initialising } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDivElement>(null)
  const emailId = useId()
  const passwordId = useId()
  const nameId = useId()

  /* Reset transient state each time the dialog opens. */
  useEffect(() => {
    if (!open) return
    setMode('signin')
    setError(null)
    setNotice(null)
    setPassword('')
  }, [open])

  /* Escape to close, scroll lock, and focus the first field. */
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    // Defer so the element exists and browsers do not scroll on focus.
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('input, button')?.focus()
    }, 30)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(t)
    }
  }, [open, onClose])

  async function handleGoogle() {
    setError(null)
    try {
      await signInGoogle()
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    try {
      if (mode === 'reset') {
        await resetPassword(email)
        setNotice(`Password reset link sent to ${email}.`)
        return
      }
      if (mode === 'signup') {
        await signUpEmail(email, password, name)
        setNotice('Account created! Verification email sent.')
        setTimeout(() => onClose(), 1500)
        return
      }
      await signInEmail(email, password)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6
                 overflow-y-auto bg-ink-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative w-full max-w-md my-auto bg-white rounded-2xl shadow-lift
                   overflow-hidden animate-slide-up flex flex-col max-h-[calc(100vh-2rem)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-4 shrink-0 border-b border-parchment-200">
          <div>
            <p className="eyebrow">Bible Verse of the Day</p>
            <h2 id="auth-title" className="font-serif text-xl font-bold text-ink-900">
              {mode === 'signup' ? 'Create your account'
                : mode === 'reset' ? 'Reset your password'
                : 'Welcome back'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid place-items-center w-10 h-10 -mr-2 -mt-1 rounded-lg text-ink-500
                       hover:bg-parchment-100 hover:text-ink-900 transition-colors"
            aria-label="Close sign in"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {reason && (
            <p className="text-sm text-ink-600 bg-parchment-100 border border-parchment-200
                          rounded-xl px-3 py-2.5 mb-4">
              {reason}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy || initialising}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl
                       bg-white border border-parchment-300 font-semibold text-sm text-ink-800
                       hover:bg-parchment-100 transition-colors disabled:opacity-60"
          >
            <GoogleMark />
            <span>{busy ? 'Please wait…' : 'Continue with Google'}</span>
          </button>

          <div className="flex items-center gap-3 my-5" aria-hidden="true">
            <span className="h-px flex-1 bg-parchment-300" />
            <span className="text-xs text-ink-500">or</span>
            <span className="h-px flex-1 bg-parchment-300" />
          </div>
          <form onSubmit={handleEmailSubmit} noValidate>
            {mode === 'signup' && (
              <div className="mb-4">
                <label htmlFor={nameId} className="block text-xs font-semibold text-ink-700 mb-1.5">
                  Name
                </label>
                <input
                  id={nameId}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full px-3 py-2.5 rounded-xl border border-parchment-300 text-sm bg-white"
                  placeholder="Your name"
                />
              </div>
            )}

            <div className="mb-4">
              <label htmlFor={emailId} className="block text-xs font-semibold text-ink-700 mb-1.5">
                Email
              </label>
              <input
                id={emailId}
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-xl border border-parchment-300 text-sm bg-white"
                placeholder="you@example.com"
              />
            </div>

            {mode !== 'reset' && (
              <div className="mb-4">
                <label htmlFor={passwordId} className="block text-xs font-semibold text-ink-700 mb-1.5">
                  Password
                </label>
                <input
                  id={passwordId}
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full px-3 py-2.5 rounded-xl border border-parchment-300 text-sm bg-white"
                  placeholder="At least 6 characters"
                />
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200
                                       rounded-xl px-3 py-2 mb-4">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-gold-900 bg-gold-50 border border-gold-200
                                        rounded-xl px-3 py-2 mb-4">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || initialising}
              className="btn-primary w-full !py-3 disabled:opacity-60"
            >
              {busy
                ? 'Please wait…'
                : mode === 'signup' ? 'Create account'
                : mode === 'reset' ? 'Send reset link'
                : 'Sign in'}
            </button>
          </form>

          {/* Mode switch */}
          <div className="mt-5 text-center text-sm text-ink-600 space-y-2">
            {mode !== 'reset' && (
              <button
                type="button"
                onClick={() => { setMode('reset'); setError(null); setNotice(null) }}
                className="block w-full hover:text-ink-900 transition-colors"
              >
                Forgot your password?
              </button>
            )}
            {mode === 'signin' && (
              <p>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); setNotice(null) }}
                  className="font-semibold text-gold-800 hover:underline"
                >
                  Create an account
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); setNotice(null) }}
                  className="font-semibold text-gold-800 hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); setNotice(null) }}
                className="font-semibold text-gold-800 hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>

          <p className="mt-5 pt-4 border-t border-parchment-200 text-xs text-ink-500
                        leading-relaxed flex items-start gap-2">
            <Icon name="shield" className="w-4 h-4 shrink-0 mt-0.5 text-gold-700" />
            <span>
              Signing in syncs your reading progress, saved verses and plan progress
              with the mobile app. You can read everything without an account.
            </span>
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Google's official 4-colour mark, inlined to avoid an extra request. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.58 10.58 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}