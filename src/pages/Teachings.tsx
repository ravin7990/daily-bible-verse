import { useState, useEffect } from 'react'
import SEO from '@/components/layout/SEO'
import { SkeletonLines } from '@/components/ui/Skeleton'
import { fetchTeachings } from '@/firebase/firestore'
import type { JesusTeaching } from '@/types'

export default function Teachings() {
  const [teachings, setTeachings] = useState<JesusTeaching[]>([])
  const [selected, setSelected]   = useState<JesusTeaching | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    fetchTeachings(100)
      .then((data: JesusTeaching[]) => { setTeachings(data); setLoading(false) })
      .catch(() => { setError('Unable to load teachings.'); setLoading(false) })
  }, [])

  const filtered = teachings.filter(t =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <SEO
        title="Jesus Teachings"
        description="Explore the teachings of Jesus Christ. In-depth devotionals on His words, parables, and wisdom from the Gospels."
        canonical="/teachings"
      />

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="section-title mb-1">Jesus Teachings</h1>
          <p className="text-gray-500 text-sm">Wisdom from the Gospels</p>
        </header>

        <div className="mb-4">
          <label htmlFor="teaching-search" className="sr-only">Search teachings</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">🔍</span>
            <input
              id="teaching-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teachings…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="card p-4 text-red-600 text-sm bg-red-50 border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* List */}
          <div className="lg:w-72 shrink-0 space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="card p-4"><SkeletonLines lines={2} /></div>
                ))
              : filtered.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    aria-pressed={selected?.id === t.id}
                    className={`w-full text-left card p-4 transition-all ${
                      selected?.id === t.id ? 'border-sacred-400 bg-sacred-50' : 'hover:shadow-sm hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-800 line-clamp-2">{t.title}</p>
                    {t.tag && <span className="tag-badge mt-1">{t.tag}</span>}
                  </button>
                ))}
          </div>

          {/* Reader */}
          <div className="flex-1 min-w-0">
            {!selected ? (
              <div className="card p-10 flex flex-col items-center justify-center text-center text-gray-400 min-h-[300px]">
                <span className="text-4xl mb-3" aria-hidden="true">✝</span>
                <p>Select a teaching to read</p>
              </div>
            ) : (
              <article className="card p-6 animate-slide-up">
                {selected.tag && <span className="tag-badge mb-3 block w-fit">{selected.tag}</span>}
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-3">{selected.title}</h2>
                <blockquote className="border-l-4 border-gold-400 pl-4 italic text-gray-500 text-sm mb-4 leading-relaxed">
                  {selected.scripture} <cite className="text-gold-600 not-italic font-semibold">— {selected.reference}</cite>
                </blockquote>
                <div className="text-gray-700 leading-relaxed text-sm sm:text-base space-y-3">
                  {selected.content.split('\n\n').map((para: string, i: number) => <p key={i}>{para}</p>)}
                </div>
              </article>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
