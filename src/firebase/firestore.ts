import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore'
import { db } from './config'
import type { Story, Prayer, JesusTeaching, CommunityCreation } from '@/types'

// ── Stories ───────────────────────────────────────────────────────────────
export async function fetchStories(): Promise<Story[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'stories'), orderBy('id', 'asc'))
    )
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Story))
  } catch (err) {
    console.warn('fetchStories warning:', err)
    return []
  }
}

export async function fetchStoryById(id: string): Promise<Story | null> {
  try {
    const snap = await getDoc(doc(db, 'stories', id))
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Story) : null
  } catch (err) {
    console.warn('fetchStoryById warning:', err)
    return null
  }
}

// ── Prayers ───────────────────────────────────────────────────────────────
export async function fetchPrayers(category?: string): Promise<Prayer[]> {
  try {
    const base = collection(db, 'prayers')
    const q = category
      ? query(base, where('category', '==', category), orderBy('title'))
      : query(base, orderBy('title'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Prayer))
  } catch (err) {
    console.warn('fetchPrayers warning:', err)
    return []
  }
}

// ── Jesus Teachings ───────────────────────────────────────────────────────
export async function fetchTeachings(count = 50): Promise<JesusTeaching[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'jesus_teachings'), orderBy('id'), limit(count))
    )
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as JesusTeaching))
  } catch (err) {
    console.warn('fetchTeachings warning:', err)
    return []
  }
}

// ── Community Creations ───────────────────────────────────────────────────
export async function fetchCommunityCreations(count = 30): Promise<CommunityCreation[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'community_creations'), orderBy('createdAt', 'desc'), limit(count))
    )
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityCreation))
  } catch (err) {
    console.warn('fetchCommunityCreations warning:', err)
    return []
  }
}

// ── Verse Images ──────────────────────────────────────────────────────────
export async function fetchVerseImages(count = 20): Promise<{ id: string; imageUrl: string; verse: string; reference: string }[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'verse_images'), orderBy('createdAt', 'desc'), limit(count))
    )
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
  } catch (err) {
    console.warn('fetchVerseImages warning:', err)
    return []
  }
}
