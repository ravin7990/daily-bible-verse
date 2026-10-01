/**
 * Firebase Authentication (Google + Email/Password).
 *
 * Mirrors the app's auth surface (WelcomeLoginActivity + EmailAuthBottomSheet):
 *   - Google  → GoogleAuthProvider credential from an ID token
 *   - Email   → sign up / sign in with email + password
 *
 * This module is loaded via dynamic import from AuthProvider so the Firebase
 * Auth SDK stays off the critical rendering path for signed-out visitors, who
 * make up the majority of sessions.
 */

import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import app from './config'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  provider: 'google' | 'password' | 'unknown'
}

/** Normalise a Firebase user into a serialisable shape. */
export function toAuthUser(user: User): AuthUser {
  // providerData is more reliable than providerId when an account is linked.
  const providerId = user.providerData[0]?.providerId
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    provider: providerId === 'google.com'
      ? 'google'
      : providerId === 'password'
        ? 'password'
        : 'unknown',
  }
}

/** Human-readable message for the error codes users actually hit. */
export function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address does not look valid.'
    case 'auth/missing-password':
      return 'Please enter your password.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Try signing in.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again in a few minutes.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups and retry.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and retry.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled for this project.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

/** Wrap a Firebase error into a friendly message. */
function handle(error: unknown): never {
  const code = (error as { code?: string })?.code ?? ''
  throw new Error(authErrorMessage(code))
}

export function getFirebaseAuth() {
  return getAuth(app)
}

/* ── Google ─────────────────────────────────────────────────────────── */

export async function signInWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const cred = await signInWithPopup(getFirebaseAuth(), provider).catch(handle)
  const user = cred.user
  if (!user) throw new Error('Google sign-in did not return a user.')
  return toAuthUser(user)
}

/**
 * Sign in with a Google ID token obtained outside the popup flow.
 * Mirrors the app's `firebaseAuthWithGoogle(idToken)`. Used by the
 * Google Identity Services button on mobile, where popups are blocked.
 */
export async function signInWithGoogleIdToken(idToken: string): Promise<AuthUser> {
  const credential = GoogleAuthProvider.credential(idToken)
  const cred = await signInWithCredential(getFirebaseAuth(), credential).catch(handle)
  if (!cred.user) throw new Error('Google sign-in did not return a user.')
  return toAuthUser(cred.user)
}

/* ── Email / password ───────────────────────────────────────────────── */

export interface EmailAuthResult {
  user: AuthUser
  /** True when the account was just created, so the UI can prompt for verification. */
  isNewUser: boolean
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<EmailAuthResult> {
  const cred = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  ).catch(handle)

  const name = displayName?.trim()
  if (name) {
    await updateProfile(cred.user, { displayName: name }).catch(() => {
      // A failed profile update must not block sign-up; the account exists.
    })
    await sendEmailVerification(cred.user).catch(() => {})
  }

  return { user: toAuthUser(cred.user), isNewUser: true }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const cred = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  ).catch(handle)
  return toAuthUser(cred.user)
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim()).catch(handle)
}

/* ── Session ────────────────────────────────────────────────────────── */

export function subscribeToAuth(onChange: (user: AuthUser | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), (user) => {
    onChange(user ? toAuthUser(user) : null)
  })
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(getFirebaseAuth()).catch(handle)
}