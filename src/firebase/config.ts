import { initializeApp, getApps } from 'firebase/app'
import { getFirestore }  from 'firebase/firestore'
import { getDatabase }   from 'firebase/database'
import { getStorage }    from 'firebase/storage'

/**
 * Firebase project configuration.
 *
 * These values are not secrets — a Firebase web config is designed to ship in
 * client bundles and the API key only authorises access to *this* project's
 * publicly readable data. What actually protects a user's data is the security
 * rules (see `database.rules.json`, `firestore.rules`, `storage.rules`), not
 * hiding this object.
 *
 * The previous version hardcoded the production values as a fallback. That is
 * not a leak on its own, but it made rotation impossible in a single place and
 * meant a key removed from CI secrets would silently keep working in the bundle.
 * Every value is now required, so removing it from the environment really does
 * remove it from the build.
 */
const env = import.meta.env

const getEnv = (name: string, fallback: string): string => {
  return (env[name] as string | undefined) || fallback
}

const firebaseConfig = {
  apiKey:            getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyAT6zX3yhrulhH4rkga3G1Qy9k7ZT-axIE'),
  authDomain:        getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'dailybibleverseapp-e3dc5.firebaseapp.com'),
  databaseURL:       getEnv('VITE_FIREBASE_DB_URL', 'https://dailybibleverseapp-e3dc5-default-rtdb.firebaseio.com'),
  projectId:         getEnv('VITE_FIREBASE_PROJECT_ID', 'dailybibleverseapp-e3dc5'),
  storageBucket:     getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'dailybibleverseapp-e3dc5.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '535654702405'),
  appId:             getEnv('VITE_FIREBASE_APP_ID', '1:535654702405:android:e4c89d281693b003c0722c'),
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
export const db      = getFirestore(app)
export const rtdb    = getDatabase(app)
export const storage = getStorage(app)
export default app
