import { useState, useEffect } from 'react'
import SEO from '@/components/layout/SEO'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchGalleryImages, APPROVED_CATEGORIES, type GalleryImage } from '@/firebase/storage'

const BASE = import.meta.env.BASE_URL || '/'

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
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    // Filter local base wallpapers for instant feedback
    const baseLocal =
      selectedCategory === 'All'
        ? LOCAL_WALLPAPERS
        : LOCAL_WALLPAPERS.filter(img => img.category === selectedCategory)

    fetchGalleryImages(selectedCategory)
      .then(data => {
        // Merge Firebase items with local wallpapers, deduplicating IDs
        const seen = new Set<string>()
        const merged: GalleryImage[] = []
        for (const img of [...data, ...baseLocal]) {
          if (!seen.has(img.id) && !seen.has(img.url)) {
            seen.add(img.id)
            seen.add(img.url)
            merged.push(img)
          }
        }
        setImages(merged)
        setLoading(false)
      })
      .catch(() => {
        setImages(baseLocal)
        setLoading(false)
      })
  }, [selectedCategory])

  return (
    <>
      <SEO
        title="Sacred Wallpapers & Daily Devotional Backgrounds"
        description="Browse inspiring Bible verse wallpapers, sacred devotional backgrounds from imagebackground, faith, grace, hope, love, peace, praise, prayer, and strength."
        canonical="/community"
      />

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sacred-600 uppercase tracking-widest mb-1">
            <span>🖼️</span> Sacred Scripture Gallery
          </div>
          <h1 className="section-title mb-1">Wallpapers & Devotional Backgrounds</h1>
          <p className="text-gray-500 text-sm">
            Inspiring scripture wallpapers and devotional backgrounds from daily verses and sacred themed collections
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
                  ? 'bg-sacred-600 text-white border-sacred-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sacred-300'
              }`}
            >
              {cat === 'Past Daily Verses' ? '📅 Past Daily Verses' : cat}
            </button>
          ))}
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
            {Array.from({ length: 8 }).map((_, i) => (
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
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {images.map(img => (
              <div
                key={img.id}
                className="card break-inside-avoid mb-3 overflow-hidden group cursor-pointer"
                onClick={() => setLightboxImage(img.url)}
              >
                <div className="relative overflow-hidden bg-gray-100">
                  <img
                    src={img.url}
                    alt={img.name}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white text-xs font-medium truncate">{img.name}</span>
                  </div>
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 truncate max-w-[130px]">{img.name}</span>
                  <a
                    href={img.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-xs bg-gray-100 hover:bg-sacred-50 hover:text-sacred-600 text-gray-700 px-2 py-1 rounded-md transition-colors shrink-0"
                    title="Download Wallpaper"
                  >
                    ⬇
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Wallpaper Preview"
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 sm:p-6"
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
