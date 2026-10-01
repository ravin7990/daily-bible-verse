import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser } from '@/firebase/auth'
import {
  readLocalPrefs,
  writeLocalPrefs,
  PREFS,
  type PrefsMap,
} from '@/utils/localPrefs'

interface AuthContextValue {
  user: AuthUser | null
  /** True until the initial auth check completes. */
  initialising: boolean
  /** True once the Auth SDK has loaded, so cloud reads are safe to attempt. */
  authReady: boolean
  /** The dynamically loaded RTDB layer, or null until it finishes loading. */
  syncModule: typeof import('@/firebase/cloudSync') | null
  /** True while a sign-in / sign-up / sign-out request is in flight. */
  busy: boolean
  signInGoogle: () => Promise<AuthUser>
  signInEmail: (email: string, password: string) => Promise<AuthUser>
  signUpEmail: (email: string, password: string, name?: string) => Promise<AuthUser>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
  /** True once the post-sign-in sync has finished. */
  synced: boolean
  lastSyncError: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Authentication + cross-platform sync.
 *
 * The Firebase Auth SDK is imported dynamically so signed-out visitors - the
 * large majority of sessions - never pay for it on the critical rendering path.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [initialising, setInitialising] = useState(true)
  const [busy, setBusy] = useState(false)
  const [synced, setSynced] = useState(false)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)
  const [authMod, setAuthMod] = useState<typeof import('@/firebase/auth') | null>(null)
  const [syncMod, setSyncMod] = useState<typeof import('@/firebase/cloudSync') | null>(null)

  /* Load the Auth + RTDB SDKs off the critical path, then watch the session.
     Signed-out visitors therefore never download Firebase at all. */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    import('@/firebase/auth')
      .then(mod => {
        if (cancelled) return
        setAuthMod(mod)
        unsubscribe = mod.subscribeToAuth(u => {
          if (cancelled) return
          setUser(u)
          setInitialising(false)
          setSynced(false)
        })
      })
      .catch(() => {
        // Auth unavailable (offline first visit). Stay signed out rather than
        // blocking the whole app.
        if (!cancelled) setInitialising(false)
      })

    // The sync layer is only needed once someone is actually signed in.
    import('@/firebase/cloudSync')
      .then(mod => { if (!cancelled) setSyncMod(mod) })
      .catch(() => {})

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  /* After sign-in, pull everything the app has already backed up. */
  useEffect(() => {
    if (!user || !syncMod) return

    let cancelled = false
    setSynced(false)
    setLastSyncError(null)

    syncMod.syncAll(user.uid, user)
      .then(summary => {
        if (cancelled) return
        setSynced(true)
        if (summary.errors.length) setLastSyncError(summary.errors.join('; '))
      })
      .catch((e: Error) => {
        if (cancelled) return
        setSynced(true)
        setLastSyncError(e.message)
      })

    return () => { cancelled = true }
  }, [user, syncMod])

  const requireAuth = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    if (!authMod) throw new Error('Authentication is still loading. Try again in a moment.')
    setBusy(true)
    try {
      return await fn()
    } finally {
      setBusy(false)
    }
  }, [authMod])

  const signInGoogle = useCallback(() => requireAuth(() => authMod!.signInWithGoogle()), [requireAuth, authMod])
  const signInEmail  = useCallback((email: string, password: string) =>
    requireAuth(() => authMod!.signInWithEmail(email, password)), [requireAuth, authMod])
  const signUpEmail  = useCallback((email: string, password: string, name?: string) =>
    requireAuth(() => authMod!.signUpWithEmail(email, password, name).then(r => r.user)), [requireAuth, authMod])
  const resetPassword = useCallback((email: string) =>
    requireAuth(() => authMod!.resetPassword(email)), [requireAuth, authMod])

  const signOut = useCallback(async () => {
    if (!authMod) return
    setBusy(true)
    try {
      await authMod.signOutUser()
      setSynced(false)
    } finally {
      setBusy(false)
    }
  }, [authMod])
const value = useMemo<AuthContextValue>(() => ({
    user,
    initialising,
    authReady: !!authMod,
    syncModule: syncMod,
    busy,
    synced,
    lastSyncError,
    signInGoogle,
    signInEmail,
    signUpEmail,
    resetPassword,
    signOut,
  }), [
    user, initialising, authMod, syncMod, busy, synced, lastSyncError,
    signInGoogle, signInEmail, signUpEmail, resetPassword, signOut,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** Access the lazily loaded RTDB module (null until it has loaded). */
export function useSyncModule() {
  return useAuth().syncModule
}

/**
 * Read + update one web-owned prefs bucket.
 *
 * Works signed out (localStorage) and signed in (local + cloud merge), so
 * reading progress accumulates even before the user creates an account and is
 * uploaded automatically afterwards.
 *
 * This is a real hook rather than a function returned from context, so hook
 * ordering stays stable across renders.
 */
export function usePrefs(
  file: string,
): readonly [
  PrefsMap,
  (patch: PrefsMap | ((prev: PrefsMap) => PrefsMap)) => void,
] {
  const { user, authReady } = useAuth()
  const [values, setValues] = useState<PrefsMap>(() => readLocalPrefs(file))

  // The RTDB module is only present once it has finished loading, and the
  // active user supplies the uid. Both gate the cloud half of the operation.
  const syncMod = useSyncModule()
  const uid = user && syncMod ? user.uid : null

  // Refresh from the cloud whenever the signed-in user changes.
  useEffect(() => {
    let cancelled = false

    if (!uid || !syncMod) {
      setValues(readLocalPrefs(file))
      return
    }

    syncMod.pullPrefs(uid, file)
      .then(cloud => {
        if (cancelled) return
        const local = readLocalPrefs(file)
        const merged = { ...cloud, ...local }
        writeLocalPrefs(file, merged)
        setValues(merged)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [file, uid, syncMod])

  /**
   * Apply a patch, or an updater that receives the current values.
   *
   * Accepting an updater matters because the cloud refresh and a local edit can
   * race; computing the next value from `prev` avoids clobbering one with the
   * other.
   */
  const update = useCallback((
    patch: PrefsMap | ((prev: PrefsMap) => PrefsMap),
  ) => {
    setValues(prev => {
      const delta = typeof patch === 'function' ? patch(prev) : patch
      const next = { ...prev, ...delta }
      writeLocalPrefs(file, next)
      if (uid && syncMod) {
        // Merge-safe: writes only these keys, never the whole node.
        syncMod.pushPrefs(uid, file, delta).catch(() => {})
      }
      return next
    })
  }, [file, uid, syncMod])

  return [values, update] as const
}

export { PREFS }
