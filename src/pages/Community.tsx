import { useState, useEffect } from 'react'
import SEO from '@/components/layout/SEO'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchGalleryImages, APPROVED_CATEGORIES, type GalleryImage } from '@/firebase/storage'

export default function Community() {
  const [selectedCategory, setCategory]   = useState<string>('All')
  const [images, setImages]               = useState<GalleryImage[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchGalleryImages(selectedCategory)
      .then(data => {
        setImages(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Unable to load images. Please verify Firebase Storage CORS and connection.')
        setLoading(false)
      })
  }, [selectedCategory])

  return (
    <>
      <SEO
        title="Sacred Wallpapers & Daily Backgrounds"
        description="Browse inspiring Bible verse wallpapers, sacred devotional backgrounds from imagebackground, faith, grace, hope, love, peace, praise, prayer, and strength."
        canonical="/community"
      />

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="section-title mb-1">Wallpapers & Devotional Backgrounds</h1>
          <p className="text-gray-500 text-sm">
            Inspiring scripture wallpapers from devotional backgrounds and themed collections
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
            <span className="text-5xl block mb-3" aria-hidden="true">🖼️</span>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">No Images in {selectedCategory}</h3>
            <p className="text-sm max-w-md mx-auto">
              Images found in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sacred-600">imagebackground/</code> and themed category folders will be displayed here.
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
                  <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                    {img.category}
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-xs text-gray-700 font-medium truncate" title={img.name}>
                    {img.name}
                  </span>
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-sacred-600 hover:text-sacred-800 font-semibold p-1"
                    title="Download wallpaper"
                  >
                    ⬇️
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-black shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt="Enlarged wallpaper view"
                className="max-h-[80vh] w-auto mx-auto object-contain"
              />
              <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3"
                  download
                >
                  Download High-Res
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="text-gray-300 hover:text-white text-sm font-semibold px-3 py-1"
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* App promo card */}
        <div className="card p-6 mt-12 bg-gradient-to-br from-sacred-50 to-sacred-100 border-sacred-200 text-center">
          <h2 className="font-serif text-xl font-bold text-sacred-800 mb-2">Daily Verse Backgrounds</h2>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Get daily scripture paired with beautiful Christian photography and art every morning on mobile.
          </p>
          <a
            href="https://play.google.com/store/apps/details?id=com.bible.verseoftheday2026"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mx-auto w-fit"
          >
            Download Free App
          </a>
        </div>
      </main>
    </>
  )
}
