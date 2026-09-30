import { ref, listAll, getDownloadURL, type StorageReference } from 'firebase/storage'
import { storage } from './config'

export interface GalleryImage {
  id: string
  name: string
  url: string
  category: string
  date?: string
}

export const APPROVED_CATEGORIES = [
  'All',
  'Past Daily Verses',
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
 * Extract a normalized date string (YYYY-MM-DD) from a storage path or filename.
 * Supports:
 * - 2026-09-30.webp -> 2026-09-30
 * - 30-09-2026.webp -> 2026-09-30
 * - 30-9-2026.webp  -> 2026-09-30
 * - imagebackground/2026/09/30-09-2026.webp
 */
export function extractDateFromPath(path: string): string | null {
  const filename = path.split('/').pop() || path

  // 1. Check YYYY-MM-DD
  const ymd = filename.match(/(\d{4})[_-](\d{1,2})[_-](\d{1,2})/)
  if (ymd) {
    const [, y, m, d] = ymd
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // 2. Check DD-MM-YYYY
  const dmy = filename.match(/(\d{1,2})[_-](\d{1,2})[_-](\d{4})/)
  if (dmy) {
    const [, d, m, y] = dmy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // 3. Fallback: check path with /YYYY/MM/ and leading day number
  const folderMatch = path.match(/imagebackground\/(\d{4})\/(\d{1,2})\//)
  if (folderMatch) {
    const [, y, m] = folderMatch
    const dayMatch = filename.match(/^(\d{1,2})[\._-]/)
    if (dayMatch) {
      return `${y}-${m.padStart(2, '0')}-${dayMatch[1].padStart(2, '0')}`
    }
  }

  return null
}

const dailyBgCache = new Map<string, string | null>()

/**
 * Fetch the exact daily verse background image for a given date (e.g. "2026-09-30").
 * Queries imagebackground/YYYY/MM, imagebackground/YYYY, and imagebackground.
 */
export async function fetchDailyBackgroundUri(dateStr: string): Promise<string | null> {
  if (dailyBgCache.has(dateStr)) {
    return dailyBgCache.get(dateStr)!
  }

  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return null

  const altFormat = `${day}-${month}-${year}` // e.g. "30-09-2026"
  const altFormatShort = `${parseInt(day, 10)}-${parseInt(month, 10)}-${year}` // e.g. "30-9-2026"

  const extensions = ['.webp', '.jpg', '.png', '.jpeg']
  const candidateNames = new Set<string>()

  for (const base of [dateStr, altFormat, altFormatShort]) {
    for (const ext of extensions) {
      candidateNames.add((base + ext).toLowerCase())
    }
  }

  const candidateFolders = [
    `imagebackground/${year}/${month}`,
    `imagebackground/${year}`,
    'imagebackground',
  ]

  for (const folder of candidateFolders) {
    try {
      const folderRef = ref(storage, folder)
      const listRes = await listAll(folderRef)
      const match = listRes.items.find(item => candidateNames.has(item.name.toLowerCase()))
      if (match) {
        const url = await getDownloadURL(match)
        dailyBgCache.set(dateStr, url)
        return url
      }
    } catch {
      // Continue to next candidate directory
    }
  }

  dailyBgCache.set(dateStr, null)
  return null
}

/**
 * Recursively collect storage refs under a folder
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
 * Fetch all past and today's images from imagebackground.
 * STRICT RULE: Never show future / next day images. Only show past days and today.
 */
export async function fetchPastDailyBackgrounds(): Promise<GalleryImage[]> {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const rootRef = ref(storage, 'imagebackground')
    const rootList = await listAll(rootRef)

    const approvedRefs: StorageReference[] = []

    // 1. Files directly in imagebackground root
    for (const item of rootList.items) {
      const date = extractDateFromPath(item.name)
      if (!date || date <= today) {
        approvedRefs.push(item)
      }
    }

    // 2. Year folders
    for (const yearFolder of rootList.prefixes) {
      const yNum = parseInt(yearFolder.name, 10)
      if (isNaN(yNum) || yNum > currentYear) {
        // Skip future years
        continue
      }

      if (yNum < currentYear) {
        // All past years are valid
        const pastYearRefs = await collectFilesRecursively(yearFolder)
        approvedRefs.push(...pastYearRefs)
        continue
      }

      // Current year: check month folders
      const yearList = await listAll(yearFolder)

      // Direct items in current year folder
      for (const item of yearList.items) {
        const date = extractDateFromPath(item.name)
        if (!date || date <= today) {
          approvedRefs.push(item)
        }
      }

      // Month subfolders in current year
      for (const monthFolder of yearList.prefixes) {
        const mNum = parseInt(monthFolder.name, 10)
        if (isNaN(mNum) || mNum > currentMonth) {
          // Skip future months (never reveal next days)
          continue
        }

        if (mNum < currentMonth) {
          // Past months in current year are all allowed
          const pastMonthRefs = await collectFilesRecursively(monthFolder)
          approvedRefs.push(...pastMonthRefs)
        } else {
          // Current month: strictly check each date <= today
          const currentMonthList = await listAll(monthFolder)
          for (const item of currentMonthList.items) {
            const date = extractDateFromPath(item.name) || `${currentYear}-${String(currentMonth).padStart(2, '0')}`
            if (!date || date <= today) {
              approvedRefs.push(item)
            }
          }
        }
      }
    }

    // 3. Resolve download URLs and metadata
    const images = await Promise.all(
      approvedRefs.map(async item => {
        try {
          const url = await getDownloadURL(item)
          const date = extractDateFromPath(item.name) || extractDateFromPath(item.fullPath)
          const displayName = date
            ? `Daily Verse — ${new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : item.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')

          return {
            id: item.fullPath,
            name: displayName,
            url,
            category: 'Past Daily Verses',
            date: date || undefined,
          }
        } catch {
          return null
        }
      })
    )

    const validImages = images.filter(Boolean) as GalleryImage[]

    // Sort newest date first (today, yesterday, older...)
    return validImages.sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date)
      if (a.date) return -1
      if (b.date) return 1
      return 0
    })
  } catch (error) {
    console.warn('Error fetching past daily backgrounds:', error)
    return []
  }
}

/**
 * Fetch images from a category folder
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
 * Fetch themed category images (faith, grace, hope, love, peace, praise, prayer, strength)
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
 * Fetch approved gallery images:
 * - Categories: faith, grace, hope, love, peace, praise, prayer, strength
 * - Daily backgrounds: only past and today's images from /imagebackground (never future/next day)
 *
 * EXCLUDED: /New_1_1, /New_3_4, /New_9_16, /community_creations, /share_backgrounds
 */
export async function fetchGalleryImages(filter: string = 'All'): Promise<GalleryImage[]> {
  try {
    if (
      filter === 'Past Daily Verses' ||
      filter === 'Daily Backgrounds' ||
      filter === 'Old Verses' ||
      filter === 'Older Verses'
    ) {
      return await fetchPastDailyBackgrounds()
    }

    if (filter !== 'All') {
      return await fetchCategoryImages(filter)
    }

    // Filter === 'All': Query past daily backgrounds + all 8 themed categories
    const categoryNames = ['Faith', 'Grace', 'Hope', 'Love', 'Peace', 'Praise', 'Prayer', 'Strength']
    const queries = [
      fetchPastDailyBackgrounds(),
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
