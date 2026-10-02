import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Cookie consent banner.
 *
 * Google requires certified CMPs for serving personalised ads to users in the
 * EEA, the UK and Switzerland. A hand-rolled banner does not satisfy that
 * requirement on its own — Google's own free CMP has to be wired up for full
 * compliance — but this banner is still the right thing to ship now because it:
 *
 *   - gives a real accept/reject choice before anything optional is set,
 *   - records the choice so the prompt is not shown on every page,
 *   - links to the privacy policy that explains what is stored, and
 *   - provides the surface the Google CMP can be mounted into.
 *
 * Non-essential storage (and the AdSense script, once enabled) is gated on this
 * choice. See `ADSENSE_ENABLED` in `@/utils/siteConfig`.
 */

const STORAGE_KEY = 'bvtv_cookie_consent_v1'

export type ConsentState = 'accepted' | 'rejected' | null

function readConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'accepted' || raw === 'rejected' ? raw : null
  } catch {
    return null
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Decide after paint so the banner never delays first render or LCP.
    const id = window.setTimeout(() => {
      if (readConsent() === null) setVisible(true)
    }, 900)
    return () => window.clearTimeout(id)
  }, [])

  function decide(state: Exclude<ConsentState, null>) {
    try {
      localStorage.setItem(STORAGE_KEY, state)
      document.cookie = `${STORAGE_KEY}=${state}; Max-Age=31536000; Path=/; SameSite=Lax`
    } catch {
      // Storage unavailable (private mode). The choice simply will not persist.
    }
    setVisible(false)

    if (state === 'accepted') {
      window.dispatchEvent(new CustomEvent('bvtv:consent', { detail: 'accepted' }))
    }
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 p-3 pb-nav md:pb-0"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-parchment-200 bg-white shadow-xl p-4 sm:p-5">
        <p className="text-[13px] leading-relaxed text-ink-700">
          <strong className="text-ink-900">Cookies.</strong> We use essential cookies to
          run this site, and — with your permission — advertising cookies from Google
          AdSense to measure traffic and show relevant ads. You can change your choice
          any time. Read our{' '}
          <Link to="/privacy" className="text-gold-700 underline">Privacy Policy</Link>.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => decide('accepted')}
            className="btn-primary text-sm"
          >
            Accept ads
          </button>
          <button
            type="button"
            onClick={() => decide('rejected')}
            className="btn-secondary text-sm"
          >
            Essential only
          </button>
          <Link to="/privacy" className="text-sm text-ink-600 hover:text-ink-900 underline ml-1">
            Learn more
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Current stored consent, for gating optional scripts. */
export function getConsent(): ConsentState {
  return typeof window === 'undefined' ? null : readConsent()
}
