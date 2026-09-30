import { useState, useEffect, useMemo } from 'react'
import SEO from '@/components/layout/SEO'
import { Skeleton } from '@/components/ui/Skeleton'
import PageHeader from '@/components/ui/PageHeader'
import Icon from '@/components/ui/Icon'
import { loadAllPrayers, type PrayerCategoryGroup } from '@/utils/prayerService'
import type { Prayer } from '@/types'
import clsx from 'clsx'

export default function Prayers() {
  const [categories, setCategories]         = useState<PrayerCategoryGroup[]>([])
  const [allPrayers, setAllPrayers]         = useState<Prayer[]>([])
  const [selectedCatId, setSelectedCatId]   = useState<string>('all')
  const [searchQuery, setSearchQuery]       = useState<string>('')
  const [activePrayer, setActivePrayer]     = useState<Prayer | null>(null)
  const [loading, setLoading]               = useState<boolean>(true)
  const [error, setError]                   = useState<string | null>(null)

  // Audio & Action states
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false)
  const [copiedId, setCopiedId]             = useState<string | null>(null)
  const [savedIds, setSavedIds]             = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_prayers') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    setLoading(true)
    setError(null)
    loadAllPrayers()
      .then(res => {
        setCategories(res.categories)
        setAllPrayers(res.allPrayers)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Unable to load prayers.')
        setLoading(false)
      })
  }, [])

  // Filter prayers based on selected category and search query
  const filteredPrayers = useMemo(() => {
    let list = allPrayers

    if (selectedCatId !== 'all') {
      const cat = categories.find(c => c.id === selectedCatId)
      list = cat ? cat.prayers : list
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.scripture && p.scripture.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      )
    }

    return list
  }, [allPrayers, categories, selectedCatId, searchQuery])

  function handleCopy(prayer: Prayer) {
    const text = `${prayer.title}\n\n"${prayer.content}"\n\n${prayer.scripture ? `— ${prayer.scripture}\n` : ''}From Bible Verse of the Day`
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(prayer.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  function handleShare(prayer: Prayer) {
    const text = `${prayer.title}\n\n"${prayer.content}"\n\n${prayer.scripture ? `— ${prayer.scripture}\n` : ''}`
    if (navigator.share) {
      navigator.share({
        title: `${prayer.title} | Daily Prayer`,
        text: `${text}\nFind daily prayers at ${window.location.origin}`,
      }).catch(() => {})
    } else {
      handleCopy(prayer)
    }
  }

  function toggleSave(prayerId: string) {
    let next: string[]
    if (savedIds.includes(prayerId)) {
      next = savedIds.filter(id => id !== prayerId)
    } else {
      next = [...savedIds, prayerId]
    }
    setSavedIds(next)
    try {
      localStorage.setItem('saved_prayers', JSON.stringify(next))
    } catch {}
  }

  function toggleSpeech(prayer: Prayer) {
    if (!('speechSynthesis' in window)) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis.cancel()
    const text = `${prayer.title}. ${prayer.content}. ${prayer.scripture ? `Scripture: ${prayer.scripture}.` : ''}`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)
    setIsPlayingAudio(true)
    window.speechSynthesis.speak(utterance)
  }

  function closePrayerModal() {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
    }
    setActivePrayer(null)
  }

  return (
    <>
      <SEO
        title="500+ Sacred Prayers — Daily Prayer Library"
        description="Explore 500+ Christian prayers across 20 categories including morning, night, anxiety, healing, strength, breakthrough, family, and peace."
        canonical="/prayers"
      />

      <main id="main-content" className="shell pb-16 sm:pb-20 py-8">
        <PageHeader
          icon="prayer"
          eyebrow="Christian Prayer Library"
          title="Prayers for Every Moment"
          subtitle="Over 500 comforting, biblically grounded prayers organised across 20 life categories."
        />

        {/* ── Search & Filter Controls ── */}
        <div className="mb-6 space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-500">
              
            </span>
            <input
              type="text"
              placeholder="Search prayers by keyword, title, or scripture..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-parchment-300 rounded-2xl pl-10 pr-4 py-2.5 text-sm bg-white focus-visible:outline-none shadow-soft"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-500 hover:text-ink-700 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Chips Bar */}
          <div
            className="flex gap-2 overflow-x-auto no-scrollbar pb-2"
            role="group"
            aria-label="Filter by prayer category"
          >
            <button
              onClick={() => setSelectedCatId('all')}
              aria-pressed={selectedCatId === 'all'}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                selectedCatId === 'all'
                  ? 'bg-ink-800 text-white border-ink-800 shadow-soft'
                  : 'bg-white text-ink-800 border-parchment-300 hover:border-gold-400 hover:bg-parchment-100'
              }`}
            >
              <Icon name="sparkle" className="w-3.5 h-3.5" />
              <span>All Prayers ({allPrayers.length})</span>
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                aria-pressed={selectedCatId === cat.id}
                className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                  selectedCatId === cat.id
                    ? 'bg-ink-800 text-white border-ink-800 shadow-soft'
                    : 'bg-white text-ink-800 border-parchment-300 hover:border-gold-400 hover:bg-parchment-100'
                }`}
              >
                <span aria-hidden="true">{cat.icon}</span>
                <span>{cat.name.replace(/ prayers?$/i, '')}</span>
                <span className="text-[10px] opacity-75">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div role="alert" className="card p-4 text-red-800 bg-red-50 border-red-200 mb-6">
            <p className="font-semibold text-sm mb-1">Notice</p>
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* ── Prayers Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card p-6 space-y-3">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : filteredPrayers.length === 0 ? (
          <div className="card p-12 text-center text-ink-600 my-8">
            <span className="text-4xl block mb-3" aria-hidden="true">
              
            </span>
            <h3 className="font-semibold text-lg text-ink-900 mb-1">No Prayers Found</h3>
            <p className="text-sm max-w-md mx-auto">
              No prayers match your current filter or search criteria. Try selecting another category or clearing your search.
            </p>
            <button
              onClick={() => {
                setSelectedCatId('all')
                setSearchQuery('')
              }}
              className="btn-primary text-xs mt-4"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPrayers.map(prayer => {
              const isSaved = savedIds.includes(prayer.id)
              return (
                <article
                  key={prayer.id}
                  onClick={() => setActivePrayer(prayer)}
                  className="card p-5 sm:p-6 flex flex-col justify-between hover:shadow-md hover:border-gold-400 transition-all duration-200 cursor-pointer group"
                >
                  <div>
                    {/* Category pill */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-parchment-100 text-ink-800 px-2.5 py-1 rounded-full border border-parchment-200">
                        {prayer.category}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          toggleSave(prayer.id)
                        }}
                        aria-label={isSaved ? 'Remove from saved' : 'Save prayer'}
                        className="text-ink-500 hover:text-gold-700 transition-colors text-sm p-1"
                      >
                        <Icon name="bookmark" className="w-4 h-4" />
                      </button>
                    </div>

                    <h2 className="font-serif font-semibold text-lg text-ink-900 group-hover:text-ink-800 transition-colors mb-2 leading-snug">
                      {prayer.title}
                    </h2>

                    <p className="text-sm text-ink-700 leading-relaxed line-clamp-3 mb-4 font-serif">
 "{prayer.content}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-parchment-200 flex items-center justify-between text-xs">
                    {prayer.scripture ? (
                      <span className="text-ink-700 font-medium italic truncate max-w-[170px]">
                        {prayer.scripture}
                      </span>
                    ) : (
                      <span className="text-ink-500">Sacred Prayer</span>
                    )}

                    <span className="text-ink-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Pray <Icon name="arrowRight" className="w-4 h-4" />
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          INTERACTIVE PRAYER READER MODAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activePrayer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePrayer.title}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={closePrayerModal}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-parchment-200 p-6 sm:p-8 flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            <div>
              {/* Top header */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-parchment-100 text-ink-800 px-3 py-1 rounded-full border border-parchment-200">
                  {activePrayer.category}
                </span>

                <button
                  onClick={closePrayerModal}
                  className="text-ink-500 hover:text-ink-800 text-2xl font-light leading-none p-1"
                  aria-label="Close prayer dialog"
                >
                  <Icon name="close" className="w-4 h-4" />
                </button>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mb-4 leading-tight">
                {activePrayer.title}
              </h2>

              {/* Prayer text in elegant serif font */}
              <div className="bg-parchment-100/50 rounded-2xl p-5 sm:p-6 border border-parchment-200 mb-5">
                <p className="font-serif text-base sm:text-lg text-ink-900 leading-loose italic">
 "{activePrayer.content}"
                </p>
              </div>

              {/* Scripture reference */}
              {activePrayer.scripture && (
                <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-ink-800 bg-white px-3 py-1.5 rounded-lg border border-parchment-200 w-fit">
                  <span>Scripture:</span>
                  <span>{activePrayer.scripture}</span>
                </div>
              )}
            </div>

            {/* Modal actions toolbar */}
            <div className="pt-4 border-t border-parchment-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                {'speechSynthesis' in window && (
                  <button
                    onClick={() => toggleSpeech(activePrayer)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors font-semibold',
                      isPlayingAudio
                        ? 'bg-ink-800 text-white border-ink-800'
                        : 'bg-white text-ink-800 border-parchment-300 hover:bg-parchment-100'
                    )}
                    aria-label={isPlayingAudio ? 'Stop reading' : 'Pray aloud with audio'}
                  >
                    <Icon name={isPlayingAudio ? 'stop' : 'volume'} className="w-4 h-4" />
                    <span>{isPlayingAudio ? 'Stop' : 'Pray Aloud'}</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopy(activePrayer)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-parchment-300 bg-white text-ink-800 hover:bg-parchment-100 transition-colors font-semibold"
                >
                  <Icon name={copiedId === activePrayer.id ? 'check' : 'copy'} className="w-4 h-4" />
                  <span>{copiedId === activePrayer.id ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => handleShare(activePrayer)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-parchment-300 bg-white text-ink-800 hover:bg-parchment-100 transition-colors font-semibold"
                >
                  <Icon name="share" className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSave(activePrayer.id)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors font-semibold',
                    savedIds.includes(activePrayer.id)
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-white text-ink-700 border-parchment-300 hover:bg-parchment-100'
                  )}
                >
                  <span><Icon name="bookmark" className="w-4 h-4" /></span>
                  <span>{savedIds.includes(activePrayer.id) ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
