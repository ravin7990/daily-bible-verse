import { useState, useEffect } from 'react'
import SEO from '@/components/layout/SEO'
import { SkeletonLines } from '@/components/ui/Skeleton'
import { fetchPrayers } from '@/firebase/firestore'
import type { Prayer } from '@/types'

const CATEGORIES = [
  { id: 'morning',       label: 'Morning',          icon: '🌅' },
  { id: 'evening',       label: 'Evening',           icon: '🌙' },
  { id: 'healing',       label: 'Healing',           icon: '💊' },
  { id: 'strength',      label: 'Strength',          icon: '💪' },
  { id: 'thanksgiving',  label: 'Thanksgiving',      icon: '🙌' },
  { id: 'protection',    label: 'Protection',        icon: '🛡️' },
  { id: 'forgiveness',   label: 'Forgiveness',       icon: '🕊️' },
  { id: 'family',        label: 'Family',            icon: '👨‍👩‍👧‍👦' },
]

export default function Prayers() {
  const [activeCategory, setCategory] = useState<string>('')
  const [prayers, setPrayers]         = useState<Prayer[]>([])
  const [selected, setSelected]       = useState<Prayer | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchPrayers(activeCategory || undefined)
      .then((data: Prayer[]) => { setPrayers(data); setLoading(false) })
      .catch(() => { setError('Unable to load prayers. Please try again.'); setLoading(false) })
  }, [activeCategory])

  return (
    <>
      <SEO
        title="Prayer Library"
        description="Browse hundreds of prayers by category — morning, healing, strength, thanksgiving, forgiveness, and more."
        canonical="/prayers"
      />

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="section-title mb-1">Prayer Library</h1>
          <p className="text-gray-500 text-sm">Find the right prayer for every moment</p>
        </header>

        {/* Category chips */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6"
          role="group"
          aria-label="Filter by prayer category"
        >
          <button
            onClick={() => setCategory('')}
            aria-pressed={activeCategory === ''}
            className={`shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-colors ${
              activeCategory === '' ? 'bg-sacred-600 text-white border-sacred-600' : 'bg-white text-gray-600 border-gray-200 hover:border-sacred-300'
            }`}
          >
            All Prayers
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              className={`shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-colors ${
                activeCategory === cat.id ? 'bg-sacred-600 text-white border-sacred-600' : 'bg-white text-gray-600 border-gray-200 hover:border-sacred-300'
              }`}
            >
              <span aria-hidden="true">{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="card p-4 text-red-600 text-sm mb-4 bg-red-50 border-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Prayer list */}
          <div className="lg:w-72 shrink-0 space-y-2" role="listbox" aria-label="Prayer list">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card p-4">
                  <SkeletonLines lines={2} />
                </div>
              ))
            ) : prayers.length === 0 ? (
              <p className="text-sm text-gray-400 p-2">No prayers found.</p>
            ) : (
              prayers.map(prayer => (
                <button
                  key={prayer.id}
                  role="option"
                  aria-selected={selected?.id === prayer.id}
                  onClick={() => setSelected(prayer)}
                  className={`w-full text-left card p-4 transition-all ${
                    selected?.id === prayer.id
                      ? 'border-sacred-400 bg-sacred-50'
                      : 'hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-800 line-clamp-1">{prayer.title}</p>
                  {prayer.scripture && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">{prayer.scripture}</p>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Prayer reader */}
          <div className="flex-1 min-w-0">
            {!selected ? (
              <div className="card p-10 flex flex-col items-center justify-center text-center text-gray-400 min-h-[300px]">
                <span className="text-4xl mb-3" aria-hidden="true">🙏</span>
                <p>Select a prayer to read</p>
              </div>
            ) : (
              <article className="card p-6 animate-slide-up">
                <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">{selected.title}</h2>
                {selected.scripture && (
                  <blockquote className="border-l-4 border-gold-400 pl-4 italic text-gray-500 text-sm mb-4">
                    {selected.scripture}
                  </blockquote>
                )}
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selected.content}</p>
                {selected.tags && selected.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {selected.tags.map((tag: string) => (
                      <span key={tag} className="tag-badge">{tag}</span>
                    ))}
                  </div>
                )}
              </article>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
