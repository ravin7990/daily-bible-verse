import { ref, listAll, getDownloadURL, type StorageReference } from 'firebase/storage'
import { storage } from './config'

export interface GalleryImage {
  id: string
  name: string
  url: string
  category: string
  date?: string
}

export interface GalleryItemRef {
  id: string
  name: string
  storageRef?: StorageReference
  url?: string
  category: string
  date?: string
}

export interface PaginatedGalleryResult {
  images: GalleryImage[]
  totalCount: number
  totalPages: number
  currentPage: number
  hasMore: boolean
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
 * In-memory caches to guarantee lightning-fast page transitions:
 * - refsCache: stores the list of collected StorageReferences & metadata per category
 * - downloadUrlCache: stores resolved download URLs so no URL is ever fetched twice
 */
const refsCache = new Map<string, GalleryItemRef[]>()
const downloadUrlCache = new Map<string, string>()

/**
 * Recursively collect storage refs under a folder without resolving download URLs
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
 * Fetch all past and today's item references from imagebackground.
 * STRICT RULE: Never show future / next day images. Only past days and today.
 * Does NOT call getDownloadURL — only collects references and metadata.
 */
export async function fetchPastDailyBackgroundRefs(): Promise<GalleryItemRef[]> {
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

    // Convert StorageReferences to GalleryItemRef metadata
    const itemRefs: GalleryItemRef[] = approvedRefs.map(item => {
      const date = extractDateFromPath(item.name) || extractDateFromPath(item.fullPath)
      const displayName = date
        ? `Daily Verse — ${new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : item.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')

      return {
        id: item.fullPath,
        name: displayName,
        storageRef: item,
        category: 'Past Daily Verses',
        date: date || undefined,
      }
    })

    // Sort newest date first (today, yesterday, older...)
    return itemRefs.sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date)
      if (a.date) return -1
      if (b.date) return 1
      return 0
    })
  } catch (error) {
    console.warn('Error fetching past daily background refs:', error)
    return []
  }
}

/**
 * Fetch item references from a category folder without resolving URLs
 */
async function fetchFolderRefs(folderName: string, categoryLabel: string): Promise<GalleryItemRef[]> {
  try {
    const folderRef = ref(storage, folderName)
    const listRes = await listAll(folderRef)
    return listRes.items.map(item => ({
      id: item.fullPath,
      name: item.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      storageRef: item,
      category: categoryLabel,
    }))
  } catch {
    return []
  }
}

/**
 * Fetch themed category item refs (faith, grace, hope, love, peace, praise, prayer, strength)
 */
async function fetchCategoryItemRefs(cat: string): Promise<GalleryItemRef[]> {
  const lower = cat.toLowerCase()
  const [fromGallery, fromRoot] = await Promise.all([
    fetchFolderRefs(`gallery_images/${lower}`, cat),
    fetchFolderRefs(lower, cat),
  ])

  const seen = new Set<string>()
  const merged: GalleryItemRef[] = []
  for (const item of [...fromGallery, ...fromRoot]) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      merged.push(item)
    }
  }
  return merged
}

/**
 * Get all approved item references for a given category.
 * Cached in memory so directory listings only run once per session.
 */
export async function getApprovedItemRefs(category: string = 'All'): Promise<GalleryItemRef[]> {
  if (refsCache.has(category)) {
    return refsCache.get(category)!
  }

  let results: GalleryItemRef[] = []

  if (
    category === 'Past Daily Verses' ||
    category === 'Daily Backgrounds' ||
    category === 'Old Verses' ||
    category === 'Older Verses'
  ) {
    results = await fetchPastDailyBackgroundRefs()
  } else if (category !== 'All') {
    results = await fetchCategoryItemRefs(category)
  } else {
    // Category === 'All': Query past daily backgrounds + all 8 themed categories
    const categoryNames = ['Faith', 'Grace', 'Hope', 'Love', 'Peace', 'Praise', 'Prayer', 'Strength']
    const queries = [
      fetchPastDailyBackgroundRefs(),
      ...categoryNames.map(cat => fetchCategoryItemRefs(cat)),
    ]

    const allBatches = await Promise.all(queries)
    const seen = new Set<string>()

    for (const item of allBatches.flat()) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        results.push(item)
      }
    }
  }

  refsCache.set(category, results)
  return results
}

/**
 * Resolve download URLs for a specific page of max 10 images.
 * STRICT LIMIT: Only resolves getDownloadURL for at most pageSize (10) items per call.
 */
export async function resolveImagePage(
  items: GalleryItemRef[],
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedGalleryResult> {
  const totalCount = items.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageItems = items.slice(startIndex, endIndex)

  // Resolve download URLs strictly for this page's 10 items
  const resolvedImages = await Promise.all(
    pageItems.map(async item => {
      try {
        if (item.url) {
          return {
            id: item.id,
            name: item.name,
            url: item.url,
            category: item.category,
            date: item.date,
          }
        }

        if (downloadUrlCache.has(item.id)) {
          return {
            id: item.id,
            name: item.name,
            url: downloadUrlCache.get(item.id)!,
            category: item.category,
            date: item.date,
          }
        }

        if (item.storageRef) {
          const url = await getDownloadURL(item.storageRef)
          downloadUrlCache.set(item.id, url)
          return {
            id: item.id,
            name: item.name,
            url,
            category: item.category,
            date: item.date,
          }
        }

        return null
      } catch {
        return null
      }
    })
  )

  const validImages = resolvedImages.filter(Boolean) as GalleryImage[]

  return {
    images: validImages,
    totalCount,
    totalPages,
    currentPage,
    hasMore: currentPage < totalPages,
  }
}

/**
 * Fetch approved gallery images with pagination (Max 10 images per page).
 *
 * @param category - Category filter (e.g. 'All', 'Past Daily Verses', 'Faith', etc.)
 * @param page - Page number (1-indexed)
 * @param pageSize - Maximum images per page (default: 10)
 * @param localFallbacks - Optional local fallback images to merge
 */
export async function fetchGalleryImagesPaginated(
  category: string = 'All',
  page: number = 1,
  pageSize: number = 10,
  localFallbacks: GalleryImage[] = []
): Promise<PaginatedGalleryResult> {
  try {
    const remoteRefs = await getApprovedItemRefs(category)

    // Convert local fallbacks to GalleryItemRef if needed
    const localRefs: GalleryItemRef[] = localFallbacks
      .filter(loc => category === 'All' || loc.category === category)
      .map(loc => ({
        id: loc.id,
        name: loc.name,
        url: loc.url,
        category: loc.category,
        date: loc.date,
      }))

    // Deduplicate between remote and local
    const seen = new Set<string>()
    const allItems: GalleryItemRef[] = []

    for (const item of [...remoteRefs, ...localRefs]) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        allItems.push(item)
      }
    }

    return await resolveImagePage(allItems, page, pageSize)
  } catch (error) {
    console.warn('Firebase Storage fetch error:', error)
    // Fallback to local items with pagination
    const filteredLocal = localFallbacks.filter(
      loc => category === 'All' || loc.category === category
    )
    const localRefs: GalleryItemRef[] = filteredLocal.map(loc => ({
      id: loc.id,
      name: loc.name,
      url: loc.url,
      category: loc.category,
    }))

    return await resolveImagePage(localRefs, page, pageSize)
  }
}

/**
 * Backward-compatible helper to fetch a single page of images (default 10)
 */
export async function fetchGalleryImages(
  filter: string = 'All',
  page: number = 1,
  pageSize: number = 10
): Promise<GalleryImage[]> {
  const result = await fetchGalleryImagesPaginated(filter, page, pageSize)
  return result.images
}
