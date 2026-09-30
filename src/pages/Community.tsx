import { useState, useEffect } from 'react'
import SEO from '@/components/layout/SEO'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchCommunityCreations } from '@/firebase/firestore'
import type { CommunityCreation } from '@/types'

export default function Community() {
  const [creations, setCreations] = useState<CommunityCreation[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    fetchCommunityCreations(30)
      .then((data: CommunityCreation[]) => { setCreations(data); setLoading(false) })
      .catch(() => { setError('Unable to load community creations.'); setLoading(false) })
  }, [])

  return (
    <>
      <SEO
        title="Community Creations"
        description="Explore Bible verse images and spiritual art created by the community. Share the Word through beautiful creations."
        canonical="/community"
      />

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="section-title mb-1">Community Creations</h1>
          <p className="text-gray-500 text-sm">Beautiful verse art shared by the community</p>
        </header>

        {error && (
          <div role="alert" className="card p-4 text-red-600 text-sm bg-red-50 border-red-200 mb-4">{error}</div>
        )}

        {/* Masonry-style grid */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className={`w-full ${i % 3 === 0 ? 'h-48' : i % 3 === 1 ? 'h-64' : 'h-56'} break-inside-avoid mb-3`} />
              ))
            : creations.map(c => (
                <figure
                  key={c.id}
                  className="card break-inside-avoid mb-3 overflow-hidden group"
                >
                  <img
                    src={c.imageUrl}
                    alt={`${c.verse} — ${c.reference}`}
                    loading="lazy"
                    width={300}
                    height={200}
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <figcaption className="p-3">
                    <p className="text-xs italic text-gray-600 line-clamp-2">"{c.verse}"</p>
                    <p className="text-xs font-semibold text-sacred-600 mt-1">{c.reference}</p>
                  </figcaption>
                </figure>
              ))}
        </div>

        {!loading && creations.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400">
            <span className="text-4xl block mb-3" aria-hidden="true">🎨</span>
            <p>No community creations yet.</p>
          </div>
        )}

        {/* App promo */}
        <div className="card p-6 mt-8 bg-gradient-to-br from-sacred-50 to-sacred-100 border-sacred-200 text-center">
          <h2 className="font-serif text-xl font-bold text-sacred-800 mb-2">Create Your Own</h2>
          <p className="text-sm text-gray-600 mb-4">
            Use the Verse Studio in the app to design beautiful Bible verse images and share with the community.
          </p>
          <a
            href="https://play.google.com/store/apps/details?id=com.bible.verseoftheday2026"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mx-auto w-fit"
          >
            Open in App
          </a>
        </div>
      </main>
    </>
  )
}
