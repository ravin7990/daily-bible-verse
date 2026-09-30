import { ref, listAll, getDownloadURL } from 'firebase/storage'
import { storage } from './config'

export interface GalleryImage {
  id: string
  name: string
  url: string
  category: string
  aspectRatio?: '9:16' | '3:4' | '1:1' | 'standard'
}

export const WALLPAPER_CATEGORIES = [
  'All',
  'Phone (9:16)',
  'Portrait (3:4)',
  'Square (1:1)',
  'Share Backgrounds',
  'Hope',
  'Strength',
  'Faith',
  'Love',
  'Grace',
  'Peace',
  'Praise',
] as const

async function fetchFromFolder(folderName: string, categoryLabel: string, aspectRatio?: GalleryImage['aspectRatio']): Promise<GalleryImage[]> {
  try {
    const folderRef = ref(storage, folderName)
    const listRes = await listAll(folderRef)
    const images = await Promise.all(
      listRes.items.map(async item => {
        try {
          const url = await getDownloadURL(item)
          return {
            id: item.fullPath,
            name: item.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
            url,
            category: categoryLabel,
            aspectRatio,
          }
        } catch {
          return null
        }
      })
    )
    return images.filter(Boolean) as GalleryImage[]
  } catch {
    return []
  }
}

/**
 * Fetch images from Firebase Storage based on user's exact folders:
 * - New_9_16 / new_9_16
 * - New_3_4 / new_3_4
 * - New_1_1 / new_1_1
 * - share_backgrounds
 * - gallery_images/{category}
 */
export async function fetchGalleryImages(filter = 'All'): Promise<GalleryImage[]> {
  try {
    // 1. Phone 9:16
    if (filter === 'Phone (9:16)') {
      let items = await fetchFromFolder('New_9_16', 'Phone 9:16', '9:16')
      if (items.length === 0) items = await fetchFromFolder('new_9_16', 'Phone 9:16', '9:16')
      return items
    }

    // 2. Portrait 3:4
    if (filter === 'Portrait (3:4)') {
      let items = await fetchFromFolder('New_3_4', 'Portrait 3:4', '3:4')
      if (items.length === 0) items = await fetchFromFolder('new_3_4', 'Portrait 3:4', '3:4')
      return items
    }

    // 3. Square 1:1
    if (filter === 'Square (1:1)') {
      let items = await fetchFromFolder('New_1_1', 'Square 1:1', '1:1')
      if (items.length === 0) items = await fetchFromFolder('new_1_1', 'Square 1:1', '1:1')
      return items
    }

    // 4. Share backgrounds
    if (filter === 'Share Backgrounds') {
      return await fetchFromFolder('share_backgrounds', 'Share Backgrounds', 'standard')
    }

    // 5. Specific themed category under gallery_images
    if (filter !== 'All') {
      const lower = filter.toLowerCase()
      return await fetchFromFolder(`gallery_images/${lower}`, filter, 'standard')
    }

    // 6. 'All' - Fetch from Wallpapers (9:16, 3:4, 1:1), share_backgrounds, and gallery_images
    const folderQueries = [
      fetchFromFolder('New_9_16', 'Phone (9:16)', '9:16'),
      fetchFromFolder('new_9_16', 'Phone (9:16)', '9:16'),
      fetchFromFolder('New_3_4', 'Portrait (3:4)', '3:4'),
      fetchFromFolder('new_3_4', 'Portrait (3:4)', '3:4'),
      fetchFromFolder('New_1_1', 'Square (1:1)', '1:1'),
      fetchFromFolder('new_1_1', 'Square (1:1)', '1:1'),
      fetchFromFolder('share_backgrounds', 'Share Backgrounds', 'standard'),
      fetchFromFolder('gallery_images', 'Gallery', 'standard'),
      fetchFromFolder('gallery_images/hope', 'Hope', 'standard'),
      fetchFromFolder('gallery_images/strength', 'Strength', 'standard'),
      fetchFromFolder('gallery_images/faith', 'Faith', 'standard'),
      fetchFromFolder('gallery_images/love', 'Love', 'standard'),
    ]

    const allResults = await Promise.all(folderQueries)
    // Deduplicate by ID
    const seen = new Set<string>()
    const merged: GalleryImage[] = []
    for (const img of allResults.flat()) {
      if (!seen.has(img.id)) {
        seen.add(img.id)
        merged.push(img)
      }
    }
    return merged
  } catch (error) {
    console.warn('Firebase Storage fetch warning (ensure CORS is enabled):', error)
    return []
  }
}
