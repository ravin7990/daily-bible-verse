/**
 * Lazy wrapper around the daily-background lookup.
 *
 * `@/firebase/storage` statically imports the Firebase SDK (~175 kB gzipped).
 * Home and VerseCard only need it for a purely decorative background image, but
 * a static import puts the whole SDK on the critical rendering path and delays
 * first paint. This module defers it behind a dynamic import so Firebase is
 * fetched after the page is already interactive.
 */

type FetchFn = (dateStr: string) => Promise<string | null>

let loader: Promise<FetchFn> | null = null

function loadFetch(): Promise<FetchFn> {
  if (!loader) {
    loader = import('@/firebase/storage').then(m => m.fetchDailyBackgroundUri)
  }
  return loader
}

export async function fetchDailyBackgroundUri(dateStr: string): Promise<string | null> {
  try {
    const fn = await loadFetch()
    return await fn(dateStr)
  } catch {
    // Firebase unreachable (offline, config missing). Callers treat null as
    // "no background image", so the page still renders fine.
    return null
  }
}