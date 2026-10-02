/**
 * Single source of truth for site-wide constants.
 *
 * The domain used to be repeated in `index.html`, `SEO.tsx`, `Home.tsx`,
 * `Stories.tsx`, `StoryDetail.tsx`, `scripts/generate-assets.js` and the
 * committed `sitemap.xml` / `llms.txt` / `robots.txt`. Moving to a custom domain
 * therefore meant hunting down nine files and hoping none were missed - and one
 * missed reference silently splits the site's canonical signals across two hosts.
 *
 * There is now exactly one place to change: set `VITE_SITE_URL`.
 *
 * ── Custom domain note ────────────────────────────────────────────────────
 * Google AdSense does not approve sites on commonly-used free hosting domains
 * such as `*.github.io`. Point `VITE_SITE_URL` at the new domain and set the
 * same value as the `VITE_SITE_URL` secret in the deploy workflow; the build
 * regenerates the sitemap, llms.txt and canonical URLs from it.
 */

/**
 * Canonical origin + path, with no trailing slash.
 *
 * Defaults to the current GitHub Pages host. Override with `VITE_SITE_URL`.
 */
export const SITE_URL: string = (
  import.meta.env.VITE_SITE_URL || 'https://ravin7990.github.io/daily-bible-verse'
).replace(/\/$/, '')

export const SITE_NAME = 'Bible Verse of the Day'

/** Contact address, surfaced on the Contact and Privacy pages. */
export const CONTACT_EMAIL =
  import.meta.env.VITE_CONTACT_EMAIL || 'contact@bibleverseoftheday.app'

/**
 * Google AdSense publisher ID.
 *
 * Set `VITE_ADSENSE_CLIENT` once the account is approved. While this is empty
 * the ad script and the verification meta tag are kept out of the document
 * entirely - shipping a placeholder `ca-pub-000...` would make the site look
 * like it is serving broken ads to a reviewer.
 */
export const ADSENSE_CLIENT: string = import.meta.env.VITE_ADSENSE_CLIENT || ''

/** True only once a real publisher ID is present and the script can load. */
export const ADSENSE_ENABLED = /^ca-pub-\d{10,}$/.test(ADSENSE_CLIENT)

/** Join the site origin with a path, without doubling or dropping slashes. */
export function absoluteUrl(path = ''): string {
  if (!path) return `${SITE_URL}/`
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}/${path.replace(/^\//, '')}`
}

/**
 * Last-modified stamp for the legal pages, shown in the footers of those pages.
 *
 * Bump this when the policy text changes so the date on screen is never a lie.
 */
export const LEGAL_UPDATED = '1 October 2026'