import { ref, getDownloadURL } from 'firebase/storage'
import { storage } from '@/firebase/config'
import type { Prayer } from '@/types'

export interface PrayerCategoryGroup {
  id: string
  name: string
  icon: string
  count: number
  prayers: Prayer[]
}

const CATEGORY_ICONS: Record<string, string> = {
  morning: '🌅',
  night: '🌙',
  evening: '🌙',
  anxiety: '🕊️',
  healing: '💊',
  fear: '🛡️',
  breakthrough: '⚡',
  family: '👨‍👩‍👧‍👦',
  forgiveness: '🤍',
  gratitude: '🙌',
  thanksgiving: '🙌',
  hope: '🌟',
  love: '❤️',
  'love & relationships': '❤️',
  depression: '🌧️',
  'depression & sadness': '🌧️',
  guidance: '🧭',
  'guidance & wisdom': '🧭',
  strength: '💪',
  'strength & perseverance': '💪',
  work: '💼',
  'work & finances': '💼',
  marriage: '💍',
  grief: '🕯️',
  'grief & loss': '🕯️',
  praise: '🎶',
  'praise & worship': '🎶',
  salvation: '✝️',
  children: '👶',
  'children & parenting': '👶',
  protection: '🛡️',
}

let cachedCategories: PrayerCategoryGroup[] | null = null
let cachedAllPrayers: Prayer[] | null = null

/**
 * Loads all prayers from local prayer.json, with Firebase Storage fallback
 */
export async function loadAllPrayers(): Promise<{
  categories: PrayerCategoryGroup[]
  allPrayers: Prayer[]
}> {
  if (cachedCategories && cachedAllPrayers) {
    return { categories: cachedCategories, allPrayers: cachedAllPrayers }
  }

  const base = import.meta.env.BASE_URL || '/'
  const localUrl = `${base}prayer.json`

  let rawData: any = null

  // 1. Try local bundled prayer.json
  try {
    const res = await fetch(localUrl)
    if (res.ok) {
      rawData = await res.json()
    }
  } catch (err) {
    console.warn('Local prayer.json fetch failed, trying Firebase Storage:', err)
  }

  // 2. Fallback to Firebase Storage
  if (!rawData) {
    try {
      const fileRef = ref(storage, 'prayer.json')
      const downloadUrl = await getDownloadURL(fileRef)
      const res = await fetch(downloadUrl)
      if (res.ok) {
        rawData = await res.json()
      }
    } catch (err) {
      console.error('Firebase Storage prayer.json fetch failed:', err)
    }
  }

  if (!rawData || !rawData.categories) {
    throw new Error('Unable to load prayers. Please check connection.')
  }

  const allPrayers: Prayer[] = []
  const categories: PrayerCategoryGroup[] = []

  for (const cat of rawData.categories) {
    const rawPrayers = cat.prayers || []
    const catName: string = cat.name || 'Prayer'
    const catId = (cat.id || catName.toLowerCase().replace(/ prayers?$/i, '').trim()).toLowerCase()
    const icon = CATEGORY_ICONS[catId] || CATEGORY_ICONS[catName.toLowerCase()] || '🙏'

    const mappedPrayers: Prayer[] = rawPrayers.map((p: any, idx: number) => {
      const id = p.id || `${catId}_${idx + 1}`
      const content = p.text || p.content || ''
      const scripture = p.verse || p.scripture || undefined
      return {
        id,
        title: p.title || 'Sacred Prayer',
        category: catName.replace(/ prayers?$/i, '').trim(),
        content,
        scripture,
      }
    })

    categories.push({
      id: catId,
      name: catName,
      icon,
      count: mappedPrayers.length,
      prayers: mappedPrayers,
    })

    allPrayers.push(...mappedPrayers)
  }

  cachedCategories = categories
  cachedAllPrayers = allPrayers

  return { categories, allPrayers }
}
