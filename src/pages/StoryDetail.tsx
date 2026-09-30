import { useParams, Link } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import SEO from '@/components/layout/SEO'
import StoryBanner from '@/components/ui/StoryBanner'
import { storySchema } from '@/utils/structuredData'
import type { Story } from '@/types'

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://ravin7990.github.io/daily-bible-verse'

interface ExpandableSectionProps {
  title: string
  content: string
  icon: string
  defaultOpen?: boolean
}

function ExpandableSection({ title, content, icon, defaultOpen = false }: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-800">
          <span aria-hidden="true">{icon}</span> {title}
        </span>
        <span aria-hidden="true" className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-600 leading-relaxed text-sm sm:text-base animate-fade-in">
          {content}
        </div>
      )}
    </div>
  )
}

export default function StoryDetail() {
  const { id } = useParams<{ id: string; slug?: string }>()
  const [stories, setStories] = useState<Story[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}stories.json`)
      .then(r => r.json())
      .then((data: Story[]) => setStories(data))
      .catch(() => {})
  }, [])

  const story = useMemo(() => stories.find(s => s.id === id), [id, stories])

  // Related stories (same tag, excluding current)
  const related = useMemo(() =>
    story ? stories.filter(s => s.tag === story.tag && s.id !== story.id).slice(0, 3) : [],
    [story, stories]
  )

  if (!story) {
    return (
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4" aria-hidden="true">📭</p>
        <h1 className="text-2xl font-bold mb-2">Story not found</h1>
        <Link to="/stories" className="btn-primary mt-4">← Back to Stories</Link>
      </main>
    )
  }

  const canonicalPath = `/stories/${story.id}`
  const fullUrl = `${SITE_URL}${canonicalPath}`

  return (
    <>
      <SEO
        title={story.title}
        description={story.summary}
        canonical={canonicalPath}
        ogType="article"
        jsonLd={storySchema(story, fullUrl)}
      />

      <main id="main-content" className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <nav aria-label="Breadcrumb" className="mb-5">
          <Link to="/stories" className="text-sm text-sacred-600 hover:text-sacred-700 flex items-center gap-1">
            ← Bible Stories
          </Link>
        </nav>

        {/* Hero banner */}
        <div className="rounded-2xl overflow-hidden mb-6 shadow-sm">
          <StoryBanner
            tag={story.tag}
            title={story.title}
            readTime={story.read_time}
            heightClass="h-52 sm:h-64"
          />
        </div>

        {/* Title & scripture */}
        <header className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-balance">{story.title}</h1>
          <blockquote className="border-l-4 border-gold-400 pl-4 italic text-gray-600 text-sm sm:text-base leading-relaxed">
            {story.scripture}
          </blockquote>
        </header>

        {/* Story body */}
        <article className="prose prose-sm sm:prose max-w-none mb-6">
          {story.story.split('\n\n').map((para: string, i: number) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-4">{para}</p>
          ))}
        </article>

        {/* Expandable devotional sections */}
        <ExpandableSection title="Reflection"        content={story.reflection}       icon="💭" defaultOpen />
        <ExpandableSection title="Prayer"            content={story.prayer}           icon="🙏" />
        <ExpandableSection title="Life Application"  content={story.life_application} icon="🌱" />

        {/* Share */}
        <div className="card p-4 flex items-center justify-between gap-3 mb-8">
          <p className="text-sm text-gray-600 font-medium">Share this story</p>
          <div className="flex gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(story.title)}&url=${encodeURIComponent(fullUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3"
              aria-label="Share on Twitter/X"
            >
              𝕏 Share
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(fullUrl)}
              className="btn-secondary text-xs py-1.5 px-3"
              aria-label="Copy link to clipboard"
            >
              🔗 Copy link
            </button>
          </div>
        </div>

        {/* Related stories */}
        {related.length > 0 && (
          <section aria-label="Related stories">
            <h2 className="section-title mb-4">More {story.tag} Stories</h2>
            <div className="space-y-3">
              {related.map(s => (
                <Link
                  key={s.id}
                  to={`/stories/${s.id}`}
                  className="card p-4 flex items-start gap-3 hover:border-sacred-200 hover:bg-sacred-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 group-hover:text-sacred-700 truncate">{s.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.summary}</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-sacred-400 shrink-0">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
