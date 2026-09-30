import { useState, useEffect, useMemo } from 'react'
import SEO from '@/components/layout/SEO'
import { SkeletonLines } from '@/components/ui/Skeleton'
import { fetchTeachings } from '@/firebase/firestore'
import type { JesusTeaching } from '@/types'

const POPULAR_TOPICS = [
  'All',
  'Saved',
  'Forgiveness',
  'Love',
  'Prayer',
  'Trust',
  'Faith',
  'Generosity',
  'Peace',
  'Rest',
  'Worry',
  'Hope',
  'Kindness',
  'Joy',
]

export default function Teachings() {
  const [teachings, setTeachings] = useState<JesusTeaching[]>([])
  const [activeTeaching, setActiveTeaching] = useState<JesusTeaching | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string>('All')
  const [search, setSearch] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Audio, Copy & Bookmark states
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false)
  const [copiedId, setCopiedId] = useState<number | string | null>(null)
  const [savedIds, setSavedIds] = useState<(number | string)[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_teachings') || '[]')
    } catch {
      return []
    }
  })

  // Load teachings from public JSON (fallback to Firestore)
  useEffect(() => {
    setLoading(true)
    setError(null)
    const jsonUrl = `${import.meta.env.BASE_URL}jesus_teachings.json`

    fetch(jsonUrl)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load teachings file')
        return res.json()
      })
      .then((data: JesusTeaching[]) => {
        setTeachings(data)
        setLoading(false)
      })
      .catch(() => {
        // Fallback to Firestore if local json fails
        fetchTeachings(100)
          .then((fbData: JesusTeaching[]) => {
            setTeachings(fbData)
            setLoading(false)
          })
          .catch(() => {
            setError('Unable to load Jesus teachings. Please check your network connection.')
            setLoading(false)
          })
      })
  }, [])

  // All unique topics extracted from dataset
  const allTopics = useMemo(() => {
    const set = new Set<string>()
    teachings.forEach(t => {
      const top = t.topic || t.tag
      if (top) set.add(top.trim())
    })
    return Array.from(set).sort()
  }, [teachings])

  // Filtered teachings list
  const filteredTeachings = useMemo(() => {
    let list = teachings

    // Topic Filter
    if (selectedTopic === 'Saved') {
      list = list.filter(t => savedIds.includes(t.id))
    } else if (selectedTopic !== 'All') {
      list = list.filter(t => {
        const top = t.topic || t.tag || ''
        return top.toLowerCase() === selectedTopic.toLowerCase()
      })
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(t => {
        const titleMatch = t.title.toLowerCase().includes(q)
        const refMatch = t.reference.toLowerCase().includes(q)
        const quoteMatch = (t.teaching || t.scripture || t.content || '').toLowerCase().includes(q)
        const meaningMatch = (t.meaning || '').toLowerCase().includes(q)
        const appMatch = (t.application || '').toLowerCase().includes(q)
        const topicMatch = (t.topic || t.tag || '').toLowerCase().includes(q)
        return titleMatch || refMatch || quoteMatch || meaningMatch || appMatch || topicMatch
      })
    }

    return list
  }, [teachings, selectedTopic, search, savedIds])

  // Bookmark toggle
  function toggleSave(id: number | string) {
    let next: (number | string)[]
    if (savedIds.includes(id)) {
      next = savedIds.filter(item => item !== id)
    } else {
      next = [...savedIds, id]
    }
    setSavedIds(next)
    try {
      localStorage.setItem('saved_teachings', JSON.stringify(next))
    } catch {}
  }

  // Copy teaching
  function handleCopy(t: JesusTeaching) {
    const scripture = t.teaching || t.scripture || t.content || ''
    const text = `✝️ ${t.title} (${t.reference})\n\n"${scripture}"\n\n💡 Meaning:\n${t.meaning || ''}\n\n🌱 Life Application:\n${t.application || ''}\n\n— Daily Bible Verse & Teachings of Jesus`
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(t.id)
      setTimeout(() => setCopiedId(null), 2500)
    })
  }

  // Share teaching
  function handleShare(t: JesusTeaching) {
    const scripture = t.teaching || t.scripture || t.content || ''
    const shareText = `✝️ ${t.title} (${t.reference})\n\n"${scripture}"\n\nFrom Jesus Teachings: ${window.location.origin}${import.meta.env.BASE_URL}teachings`
    if (navigator.share) {
      navigator.share({
        title: `${t.title} — Jesus Teaching`,
        text: shareText,
        url: window.location.href,
      }).catch(() => {})
    } else {
      handleCopy(t)
    }
  }

  // TTS Audio Player
  function toggleSpeech(t: JesusTeaching) {
    if (!('speechSynthesis' in window)) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis.cancel()
    const scripture = t.teaching || t.scripture || t.content || ''
    const fullSpeech = `${t.title}. From ${t.reference}. ${scripture}. Meaning: ${t.meaning || ''}. Life Application: ${t.application || ''}`
    const utterance = new SpeechSynthesisUtterance(fullSpeech)
    utterance.rate = 0.92
    utterance.pitch = 1.0
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)
    setIsPlayingAudio(true)
    window.speechSynthesis.speak(utterance)
  }

  function closeModal() {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
    }
    setActiveTeaching(null)
  }

  // Navigate next/prev in modal
  function navigateActive(direction: 'next' | 'prev') {
    if (!activeTeaching) return
    const currentIndex = filteredTeachings.findIndex(t => t.id === activeTeaching.id)
    if (currentIndex === -1) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
    }

    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % filteredTeachings.length
      setActiveTeaching(filteredTeachings[nextIndex])
    } else {
      const prevIndex = (currentIndex - 1 + filteredTeachings.length) % filteredTeachings.length
      setActiveTeaching(filteredTeachings[prevIndex])
    }
  }

  return (
    <>
      <SEO
        title="Jesus Teachings — 200 Parables, Red-Letter Words & Wisdom"
        description="Explore 200 teachings of Jesus Christ from the Gospels with verse explanations, devotional meanings, and practical daily life applications."
        canonical="/teachings"
      />

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Hero Banner */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sacred-50 text-sacred-700 text-xs font-semibold tracking-wide uppercase mb-3 border border-sacred-200">
            <span>✝</span> Words of Jesus Christ &amp; Parables
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Jesus Teachings
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Discover 200 powerful teachings from the Gospels. Each teaching includes the Scripture verse,
            in-depth meaning, and a personal life application for today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-sacred-600 font-bold">200</span> Sacred Teachings
            </span>
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-gold-600 font-bold">{allTopics.length}</span> Topics
            </span>
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-emerald-600 font-bold">100%</span> With Life Applications
            </span>
          </div>
        </header>

        {/* Search & Topic Filters */}
        <section aria-label="Search and filter teachings" className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" aria-hidden="true">
              🔍
            </span>
            <input
              id="teaching-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teachings, Matthew, love, worry, faith..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-sacred-500 focus:border-transparent transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Popular Topic Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto pt-1">
            {POPULAR_TOPICS.map(topic => {
              const isSelected = selectedTopic === topic
              const isSaved = topic === 'Saved'
              return (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-sacred-600 text-white shadow-md shadow-sacred-200 scale-105'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isSaved ? `❤️ Saved (${savedIds.length})` : topic}
                </button>
              )
            })}

            {/* Dropdown for All 100+ Topics */}
            {allTopics.length > POPULAR_TOPICS.length && (
              <div className="relative inline-block">
                <select
                  value={POPULAR_TOPICS.includes(selectedTopic) ? '' : selectedTopic}
                  onChange={e => {
                    if (e.target.value) setSelectedTopic(e.target.value)
                  }}
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-500"
                >
                  <option value="" disabled>
                    More Topics ({allTopics.length})...
                  </option>
                  {allTopics.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Error State */}
        {error && (
          <div role="alert" className="card p-4 text-red-700 bg-red-50 border-red-200 mb-6 text-center max-w-lg mx-auto">
            {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <SkeletonLines lines={4} />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTeachings.length === 0 && (
          <div className="card p-12 text-center max-w-md mx-auto my-8">
            <span className="text-4xl mb-3 block" aria-hidden="true">
              📖
            </span>
            <h3 className="font-serif text-lg font-bold text-gray-800 mb-1">No teachings found</h3>
            <p className="text-gray-500 text-sm mb-4">
              {selectedTopic === 'Saved'
                ? 'You have not saved any teachings yet. Click the heart icon on any teaching to bookmark it!'
                : `No teachings matched "${search || selectedTopic}". Try searching for another topic or word.`}
            </p>
            {(search || selectedTopic !== 'All') && (
              <button
                onClick={() => {
                  setSearch('')
                  setSelectedTopic('All')
                }}
                className="px-4 py-2 bg-sacred-600 text-white text-sm font-medium rounded-xl hover:bg-sacred-700 transition"
              >
                Show All Teachings
              </button>
            )}
          </div>
        )}

        {/* Teachings Grid */}
        {!loading && filteredTeachings.length > 0 && (
          <>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4 px-1">
              <span>
                Showing <strong>{filteredTeachings.length}</strong> {filteredTeachings.length === 1 ? 'teaching' : 'teachings'}
                {selectedTopic !== 'All' && ` in "${selectedTopic}"`}
              </span>
              {copiedId && (
                <span className="text-emerald-600 font-semibold animate-fade-in">
                  ✓ Copied to clipboard!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTeachings.map(t => {
                const topic = t.topic || t.tag || 'Teaching'
                const scripture = t.teaching || t.scripture || t.content || ''
                const isSaved = savedIds.includes(t.id)

                return (
                  <article
                    key={t.id}
                    className="card p-5 sm:p-6 flex flex-col justify-between hover:shadow-md hover:border-sacred-200 transition-all group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-sacred-50 text-sacred-700 border border-sacred-100">
                          {topic}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gold-50 text-gold-800 border border-gold-200">
                          {t.reference}
                        </span>
                      </div>

                      {/* Title */}
                      <h2
                        onClick={() => setActiveTeaching(t)}
                        className="font-serif text-lg sm:text-xl font-bold text-gray-900 group-hover:text-sacred-700 cursor-pointer mb-2.5 leading-snug transition-colors"
                      >
                        {t.title}
                      </h2>

                      {/* Scripture Quote */}
                      <blockquote
                        onClick={() => setActiveTeaching(t)}
                        className="border-l-3 border-gold-400 pl-3.5 py-0.5 text-gray-700 text-sm leading-relaxed italic bg-gold-50/30 rounded-r-lg mb-4 cursor-pointer"
                      >
                        "{scripture}"
                      </blockquote>

                      {/* Preview of Meaning */}
                      {t.meaning && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                          <strong className="text-gray-800 font-medium">Meaning:</strong> {t.meaning}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setActiveTeaching(t)}
                        className="font-semibold text-sacred-600 hover:text-sacred-800 flex items-center gap-1 transition"
                      >
                        Read Full Meaning &amp; Application →
                      </button>

                      <div className="flex items-center gap-1 text-gray-400">
                        <button
                          onClick={() => toggleSpeech(t)}
                          title="Listen with Audio"
                          aria-label="Listen to teaching"
                          className="p-1.5 hover:text-sacred-600 rounded-lg hover:bg-gray-100 transition"
                        >
                          🔊
                        </button>
                        <button
                          onClick={() => handleCopy(t)}
                          title="Copy teaching"
                          aria-label="Copy teaching text"
                          className="p-1.5 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition"
                        >
                          {copiedId === t.id ? '✓' : '📋'}
                        </button>
                        <button
                          onClick={() => handleShare(t)}
                          title="Share teaching"
                          aria-label="Share teaching"
                          className="p-1.5 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition"
                        >
                          ↗️
                        </button>
                        <button
                          onClick={() => toggleSave(t.id)}
                          title={isSaved ? 'Remove from saved' : 'Save teaching'}
                          aria-label="Bookmark teaching"
                          className={`p-1.5 rounded-lg hover:bg-gray-100 transition ${
                            isSaved ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
                          }`}
                        >
                          {isSaved ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}

        {/* Detailed Modal / Reader View */}
        {activeTeaching && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={e => {
              if (e.target === e.currentTarget) closeModal()
            }}
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 animate-slide-up relative">
              {/* Close Button */}
              <button
                onClick={closeModal}
                aria-label="Close teaching modal"
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>

              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3 pr-8">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sacred-50 text-sacred-700 border border-sacred-100">
                  {activeTeaching.topic || activeTeaching.tag || 'Teaching'}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gold-100 text-gold-900 border border-gold-200">
                  {activeTeaching.reference}
                </span>
              </div>

              {/* Title */}
              <h2 id="modal-title" className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {activeTeaching.title}
              </h2>

              {/* Scripture Red-Letter Quote Box */}
              <div className="bg-gradient-to-r from-gold-50/70 to-amber-50/40 border-l-4 border-gold-500 p-4 sm:p-5 rounded-r-xl mb-6 shadow-xs">
                <p className="font-serif text-base sm:text-lg text-gray-800 italic leading-relaxed">
                  "{activeTeaching.teaching || activeTeaching.scripture || activeTeaching.content}"
                </p>
                <p className="text-right text-xs font-semibold text-gold-700 mt-2">
                  — {activeTeaching.reference}
                </p>
              </div>

              {/* In-depth Meaning Section */}
              {activeTeaching.meaning && (
                <div className="mb-6 bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2 text-sacred-700 font-semibold text-sm">
                    <span className="text-lg">💡</span> Spiritual Meaning &amp; Wisdom
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                    {activeTeaching.meaning}
                  </p>
                </div>
              )}

              {/* Life Application Section */}
              {activeTeaching.application && (
                <div className="mb-6 bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2 text-emerald-800 font-semibold text-sm">
                    <span className="text-lg">🌱</span> Daily Life Application
                  </div>
                  <p className="text-emerald-950 text-sm sm:text-base leading-relaxed">
                    {activeTeaching.application}
                  </p>
                </div>
              )}

              {/* Interactive Toolbar */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSpeech(activeTeaching)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                      isPlayingAudio
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-sacred-50 text-sacred-700 hover:bg-sacred-100'
                    }`}
                  >
                    <span>{isPlayingAudio ? '⏹ Stop Audio' : '🔊 Listen'}</span>
                  </button>

                  <button
                    onClick={() => handleCopy(activeTeaching)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    {copiedId === activeTeaching.id ? '✓ Copied' : '📋 Copy'}
                  </button>

                  <button
                    onClick={() => handleShare(activeTeaching)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    ↗️ Share
                  </button>

                  <button
                    onClick={() => toggleSave(activeTeaching.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    {savedIds.includes(activeTeaching.id) ? '❤️ Saved' : '🤍 Save'}
                  </button>
                </div>

                {/* Prev / Next Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigateActive('prev')}
                    aria-label="Previous teaching"
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => navigateActive('next')}
                    aria-label="Next teaching"
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
