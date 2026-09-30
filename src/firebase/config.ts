import { initializeApp, getApps } from 'firebase/app'
import { getFirestore }  from 'firebase/firestore'
import { getDatabase }   from 'firebase/database'
import { getStorage }    from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAT6zX3yhrulhH4rkga3G1Qy9k7ZT-axIE',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dailybibleverseapp-e3dc5.firebaseapp.com',
  databaseURL:       import.meta.env.VITE_FIREBASE_DB_URL || 'https://dailybibleverseapp-e3dc5-default-rtdb.firebaseio.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dailybibleverseapp-e3dc5',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dailybibleverseapp-e3dc5.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '535654702405',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:535654702405:android:e4c89d281693b003c0722c',
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
export const db      = getFirestore(app)
export const rtdb    = getDatabase(app)
export const storage = getStorage(app)
export default app
