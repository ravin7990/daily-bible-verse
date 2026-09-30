import { ref, listAll, getDownloadURL, type StorageReference } from 'firebase/storage'
import { storage } from './config'

export interface GalleryImage {
  id: string
  name: string
  url: string
  category: string
}

export const APPROVED_CATEGORIES = [
  'All',
  'Daily Backgrounds',
  'Faith',
  'Grace',
  'Hope',
  'Love',
  'Peace',
  'Praise',
  'Prayer',
  'Strength',
] as const

export type ApprovedCategory = typeof APPROVED_CATEGORIES[number]

/**
 * Recursively collect all files under a storage directory (e.g. imagebackground/2026/09)
 */
async function collectFilesRecursively(folderRef: StorageReference): Promise<StorageReference[]> {
  try {
    const res = await listAll(folderRef)
    const subPromises = res.prefixes.map(prefix => collectFilesRecursively(prefix))
    const subItems = await Promise.all(subPromises)
    return [...res.items, ...subItems.flat()]
  } catch {
    return []
  }
}

/**
 * Fetch images from a single folder reference
 */
async function fetchFromFolder(folderName: string, categoryLabel: string): Promise<GalleryImage[]> {
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
 * Fetch all files from imagebackground folder and all its subfolders
 */
async function fetchAllImageBackgrounds(): Promise<GalleryImage[]> {
  try {
    const rootRef = ref(storage, 'imagebackground')
    const allRefs = await collectFilesRecursively(rootRef)
    const images = await Promise.all(
      allRefs.map(async item => {
        try {
          const url = await getDownloadURL(item)
          return {
            id: item.fullPath,
            name: item.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
            url,
            category: 'Daily Backgrounds',
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
 * Fetch category images checking both gallery_images/{cat} and {cat}
 */
async function fetchCategoryImages(cat: string): Promise<GalleryImage[]> {
  const lower = cat.toLowerCase()
  const [fromGallery, fromRoot] = await Promise.all([
    fetchFromFolder(`gallery_images/${lower}`, cat),
    fetchFromFolder(lower, cat),
  ])

  const seen = new Set<string>()
  const merged: GalleryImage[] = []
  for (const img of [...fromGallery, ...fromRoot]) {
    if (!seen.has(img.id)) {
      seen.add(img.id)
      merged.push(img)
    }
  }
  return merged
}

/**
 * Fetch approved images:
 * - faith, grace, hope, love, peace, praise, prayer, strength
 * - all folders from /imagebackground
 *
 * EXCLUDED: /New_1_1, /New_3_4, /New_9_16, /community_creations, /share_backgrounds
 */
export async function fetchGalleryImages(filter: string = 'All'): Promise<GalleryImage[]> {
  try {
    if (filter === 'Daily Backgrounds') {
      return await fetchAllImageBackgrounds()
    }

    if (filter !== 'All') {
      return await fetchCategoryImages(filter)
    }

    // Filter === 'All': Query all approved categories and imagebackground
    const categoryNames = ['Faith', 'Grace', 'Hope', 'Love', 'Peace', 'Praise', 'Prayer', 'Strength']
    const queries = [
      fetchAllImageBackgrounds(),
      ...categoryNames.map(cat => fetchCategoryImages(cat)),
    ]

    const allBatches = await Promise.all(queries)
    const seen = new Set<string>()
    const merged: GalleryImage[] = []

    for (const img of allBatches.flat()) {
      if (!seen.has(img.id)) {
        seen.add(img.id)
        merged.push(img)
      }
    }

    return merged
  } catch (error) {
    console.warn('Firebase Storage fetch warning:', error)
    return []
  }
}
