import { useState, useMemo, useEffect } from 'react'
import SEO from '@/components/layout/SEO'
import StoryCard from '@/components/ui/StoryCard'
import { StoryCardSkeleton } from '@/components/ui/Skeleton'
import { storiesCollectionSchema } from '@/utils/structuredData'
import type { Story } from '@/types'

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://ravin7990.github.io/daily-bible-verse'

// Derive unique tags (computed once from fetched data)
function getUniqueTags(stories: Story[]) {
  return ['All', ...Array.from(new Set(stories.map(s => s.tag))).sort()]
}

export default function Stories() {
  const [search, setSearch]  = useState('')
  const [stories, setStories]   = useState<Story[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [activeTag, setTag]     = useState('All')
  const [page, setPage]         = useState(1)
  const PER_PAGE = 12

  useEffect(() => {
    fetch('/stories.json')
      .then(r => r.json())
      .then((data: Story[]) => { setStories(data); setStoriesLoading(false) })
      .catch(() => setStoriesLoading(false))
  }, [])

  const ALL_TAGS = useMemo(() => getUniqueTags(stories), [stories])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return stories.filter(s => {
      const matchTag   = activeTag === 'All' || s.tag === activeTag
      const matchSearch = !q || s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q)
      return matchTag && matchSearch
    })
  }, [stories, search, activeTag])

  const paginated = filtered.slice(0, page * PER_PAGE)
  const hasMore   = paginated.length < filtered.length

  function handleTagChange(tag: string) {
    setTag(tag)
    setPage(1)
  }

  function handleSearch(q: string) {
    setSearch(q)
    setPage(1)
  }

  return (
    <>
      <SEO
        title="Bible Stories"
        description={`Explore ${stories.length}+ in-depth Bible stories with Scripture, reflection, prayer, and life application. From prophecy to miracles.`}
        canonical="/stories"
        jsonLd={storiesCollectionSchema(`${SITE_URL}/stories`)}
      />

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="section-title mb-1">Bible Stories</h1>
          <p className="text-gray-500 text-sm">{stories.length} stories across {ALL_TAGS.length - 1} categories</p>
        </header>

        {/* Search */}
        <div className="mb-4">
          <label htmlFor="story-search" className="sr-only">Search stories</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">🔍</span>
            <input
              id="story-search"
              type="search"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search stories…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
              aria-label="Search Bible stories"
            />
          </div>
        </div>

        {/* Tag filter */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6"
          role="group"
          aria-label="Filter stories by category"
        >
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagChange(tag)}
              aria-pressed={activeTag === tag}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                activeTag === tag
                  ? 'bg-sacred-600 text-white border-sacred-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sacred-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Result count */}
        <p className="text-sm text-gray-400 mb-4" aria-live="polite">
          {filtered.length === stories.length
            ? `Showing all ${stories.length} stories`
            : `${filtered.length} stories found`}
        </p>

        {/* Grid */}
        {storiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <StoryCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-4xl block mb-3" aria-hidden="true">📭</span>
            <p>No stories match your search.</p>
            <button
              onClick={() => { setSearch(''); setTag('All') }}
              className="btn-secondary mt-4"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="btn-secondary"
                >
                  Load more ({filtered.length - paginated.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
