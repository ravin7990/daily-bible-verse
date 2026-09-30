import { useState, useEffect, useCallback, useRef } from 'react'
import SEO from '@/components/layout/SEO'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  fetchGalleryImagesPaginated,
  APPROVED_CATEGORIES,
  type GalleryImage,
  type PaginatedGalleryResult,
} from '@/firebase/storage'

const BASE = import.meta.env.BASE_URL || '/'
const PAGE_SIZE = 10

const LOCAL_WALLPAPERS: GalleryImage[] = [
  {
    id: 'local-daily-hero',
    name: 'Today’s Sacred Word Background',
    url: `${BASE}images/daily_hero_bg.webp`,
    category: 'Past Daily Verses',
  },
  {
    id: 'local-daily-light',
    name: 'Morning Light Devotional',
    url: `${BASE}images/daily_bg_light.webp`,
    category: 'Grace',
  },
  {
    id: 'local-share-1',
    name: 'Scripture Artwork — Faith & Truth',
    url: `${BASE}images/bg_share_1.png`,
    category: 'Faith',
  },
  {
    id: 'local-share-2',
    name: 'Peace in Prayer Artwork',
    url: `${BASE}images/bg_share_2.png`,
    category: 'Prayer',
  },
  {
    id: 'local-share-3',
    name: 'Hope & Endurance Devotional Art',
    url: `${BASE}images/bg_share_3.png`,
    category: 'Hope',
  },
]

export default function Community() {
  const [selectedCategory, setCategory]   = useState<string>('All')
  const [images, setImages]               = useState<GalleryImage[]>([])
  const [currentPage, setCurrentPage]     = useState<number>(1)
  const [totalCount, setTotalCount]       = useState<number>(0)
  const [totalPages, setTotalPages]       = useState<number>(1)
  const [hasMore, setHasMore]             = useState<boolean>(false)
  const [loading, setLoading]             = useState<boolean>(true)
  const [loadingMore, setLoadingMore]     = useState<boolean>(false)
  const [error, setError]                 = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [isAppendMode, setIsAppendMode]   = useState<boolean>(false)

  const galleryTopRef = useRef<HTMLDivElement>(null)

  // Fetch images for a specific page
  const loadPage = useCallback(
    async (pageToLoad: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const result: PaginatedGalleryResult = await fetchGalleryImagesPaginated(
          selectedCategory,
          pageToLoad,
          PAGE_SIZE,
          LOCAL_WALLPAPERS
        )

        setCurrentPage(result.currentPage)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
        setHasMore(result.hasMore)

        if (append) {
          // Append new 10 images without duplicates
          setImages(prev => {
            const seen = new Set(prev.map(img => img.id))
            const added = result.images.filter(img => !seen.has(img.id))
            return [...prev, ...added]
          })
          setIsAppendMode(true)
        } else {
          setImages(result.images)
          setIsAppendMode(false)
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load wallpapers. Please check your connection.')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [selectedCategory]
  )

  // Load page 1 whenever category changes
  useEffect(() => {
    setCurrentPage(1)
    loadPage(1, false)
  }, [selectedCategory, loadPage])

  // Navigate directly to a specific page
  function handleGoToPage(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) return
    loadPage(page, false)
    if (galleryTopRef.current) {
      galleryTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Load next 10 images (Append / Load More)
  function handleLoadMore() {
    if (!hasMore || loadingMore) return
    loadPage(currentPage + 1, true)
  }

  // Generate pagination pills around current page
  function getPaginationPages(): (number | string)[] {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('...')
      if (!pages.includes(totalPages)) pages.push(totalPages)
    }
    return pages
  }

  return (
    <>
      <SEO
        title="Sacred Wallpapers & Devotional Backgrounds — Daily Gallery"
        description="Browse inspiring Bible verse wallpapers, sacred devotional backgrounds from imagebackground, faith, grace, hope, love, peace, praise, prayer, and strength."
        canonical="/community"
      />

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sacred-600 uppercase tracking-widest mb-1">
            <span>🖼️</span> Sacred Scripture Gallery
          </div>
          <h1 className="section-title mb-1">Wallpapers &amp; Devotional Backgrounds</h1>
          <p className="text-gray-500 text-sm">
            Inspiring scripture wallpapers and devotional backgrounds from daily verses and sacred collections
          </p>
        </header>

        {/* Category Chips */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-6"
          role="group"
          aria-label="Filter wallpapers by category"
        >
          {APPROVED_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              aria-pressed={selectedCategory === cat}
              className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
                selectedCategory === cat
                  ? 'bg-sacred-600 text-white border-sacred-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sacred-300'
              }`}
            >
              {cat === 'Past Daily Verses' ? '📅 Past Daily Verses' : cat}
            </button>
          ))}
        </div>

        {/* Gallery Top Anchor */}
        <div ref={galleryTopRef} className="scroll-mt-20" />

        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 mb-4 pb-2 border-b border-gray-100 gap-2">
          <span>
            {totalCount > 0 ? (
              <>
                Showing <strong>{isAppendMode ? images.length : Math.min(PAGE_SIZE, images.length)}</strong> of{' '}
                <strong>{totalCount}</strong> images
                {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
                {' • '}
                <span className="text-sacred-600 font-medium">Max 10 per page</span>
              </>
            ) : (
              'Loading images…'
            )}
          </span>

          {totalPages > 1 && (
            <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md font-medium">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {error && (
          <div role="alert" className="card p-4 text-amber-800 text-sm bg-amber-50 border-amber-200 mb-6">
            <p className="font-semibold mb-1">Notice</p>
            <p>{error}</p>
          </div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-64 break-inside-avoid mb-3 rounded-2xl" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="card p-10 text-center text-gray-500 my-8">
            <span className="text-5xl block mb-3" aria-hidden="true">
              🖼️
            </span>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">No Images in {selectedCategory}</h3>
            <p className="text-sm max-w-md mx-auto">
              Images found in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sacred-600">imagebackground/</code>{' '}
              and themed category folders will be displayed here.
            </p>
          </div>
        ) : (
          <>
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {images.map(img => (
                <div
                  key={img.id}
                  className="card break-inside-avoid mb-3 overflow-hidden group cursor-pointer transition-all hover:shadow-md hover:border-sacred-200"
                  onClick={() => setLightboxImage(img.url)}
                >
                  <div className="relative overflow-hidden bg-gray-100 min-h-[160px]">
                    <img
                      src={img.url}
                      alt={img.name}
                      loading="lazy"
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <span className="text-white text-xs font-medium leading-snug line-clamp-2">
                        {img.name}
                      </span>
                      {img.date && (
                        <span className="text-white/80 text-[10px] mt-1 font-mono">
                          {img.date}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-gray-600 truncate max-w-[140px]">
                      {img.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={img.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs bg-gray-100 hover:bg-sacred-50 hover:text-sacred-600 text-gray-700 px-2 py-1 rounded-md transition-colors"
                        title="Download Wallpaper"
                        aria-label={`Download ${img.name}`}
                      >
                        ⬇
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls Section */}
            {totalPages > 1 && (
              <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
                {/* 1. "Load More" Button (Appends next 10 images) */}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full sm:w-auto px-8 py-3 bg-sacred-600 text-white rounded-2xl font-semibold text-sm hover:bg-sacred-700 shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <span className="inline-block animate-spin" aria-hidden="true">⏳</span>
                        Loading Next 10 Images…
                      </>
                    ) : (
                      <>
                        <span>⬇️</span> Load More (+10 Images) — {totalCount - images.length} remaining
                      </>
                    )}
                  </button>
                )}

                {/* 2. Numbered Page Pagination Bar */}
                <div
                  className="flex flex-wrap items-center justify-center gap-1.5 pt-2"
                  role="navigation"
                  aria-label="Wallpaper page navigation"
                >
                  {/* Previous Button */}
                  <button
                    onClick={() => handleGoToPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Go to previous page"
                  >
                    ← Previous
                  </button>

                  {/* Page Numbers */}
                  {getPaginationPages().map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-2 text-gray-400 text-xs select-none">
                          …
                        </span>
                      )
                    }

                    const pageNum = p as number
                    const isActive = pageNum === currentPage

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleGoToPage(pageNum)}
                        disabled={loading}
                        aria-current={isActive ? 'page' : undefined}
                        className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition ${
                          isActive
                            ? 'bg-sacred-600 text-white shadow-xs'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => handleGoToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Go to next page"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Wallpaper Preview"
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="w-full flex justify-between items-center max-w-4xl text-white">
            <span className="text-sm font-semibold">Wallpaper Preview</span>
            <button
              onClick={() => setLightboxImage(null)}
              className="text-white hover:text-gray-300 text-2xl font-bold p-1 leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center max-w-4xl max-h-[75vh] my-4"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Wallpaper preview"
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
            <a
              href={lightboxImage}
              download
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <span>⬇️</span> Download Wallpaper
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(lightboxImage)
              }}
              className="btn-ghost text-white text-xs px-4 py-2 border border-white/20"
            >
              📋 Copy Link
            </button>
            <button
              onClick={() => setLightboxImage(null)}
              className="btn-ghost text-white text-xs px-4 py-2 border border-white/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
