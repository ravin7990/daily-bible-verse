import { ref, listAll, getDownloadURL } from 'firebase/storage'
import { storage } from './config'

export interface GalleryImage {
  id: string
  name: string
  url: string
  category: string
}

export const GALLERY_CATEGORIES = [
  'All',
  'Hope',
  'Strength',
  'Faith',
  'Love',
  'Grace',
  'Peace',
  'Praise',
] as const

/**
 * Fetch images from Firebase Storage folder (gallery_images / subcategories)
 */
export async function fetchGalleryImages(category = 'All'): Promise<GalleryImage[]> {
  try {
    const results: GalleryImage[] = []

    if (category.toLowerCase() === 'all') {
      // Fetch across all known categories
      const targetCategories = ['hope', 'strength', 'faith', 'love', 'grace', 'peace', 'praise']
      const promises = targetCategories.map(async cat => {
        try {
          const folderRef = ref(storage, `gallery_images/${cat}`)
          const listRes = await listAll(folderRef)
          const urls = await Promise.all(
            listRes.items.map(async item => {
              const url = await getDownloadURL(item)
              return {
                id: item.fullPath,
                name: item.name.replace(/\.[^/.]+$/, ''),
                url,
                category: cat.charAt(0).toUpperCase() + cat.slice(1),
              }
            })
          )
          return urls
        } catch {
          return []
        }
      })

      const nested = await Promise.all(promises)
      results.push(...nested.flat())
    } else {
      const folderRef = ref(storage, `gallery_images/${category.toLowerCase()}`)
      const listRes = await listAll(folderRef)
      const urls = await Promise.all(
        listRes.items.map(async item => {
          const url = await getDownloadURL(item)
          return {
            id: item.fullPath,
            name: item.name.replace(/\.[^/.]+$/, ''),
            url,
            category,
          }
        })
      )
      results.push(...urls)
    }

    return results
  } catch (error) {
    console.warn('Firebase Storage fetch warning (check CORS and storage rules):', error)
    return []
  }
}

/**
 * Fetch monthly daily verse background images from imagebackground/year/month
 */
export async function fetchMonthlyBackgrounds(year = new Date().getFullYear(), month = new Date().getMonth() + 1): Promise<string[]> {
  try {
    const monthStr = String(month).padStart(2, '0')
    const folderRef = ref(storage, `imagebackground/${year}/${monthStr}`)
    const listRes = await listAll(folderRef)
    return await Promise.all(listRes.items.map(item => getDownloadURL(item)))
  } catch {
    return []
  }
}
