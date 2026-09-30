import { useParams, Link } from 'react-router-dom'
import { useMemo, useState, useEffect, useId } from 'react'
import SEO from '@/components/layout/SEO'
import StoryBanner from '@/components/ui/StoryBanner'
import { storySchema } from '@/utils/structuredData'
import type { Story } from '@/types'
import Icon, { type IconName } from '@/components/ui/Icon'

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://ravin7990.github.io/daily-bible-verse'

interface ExpandableSectionProps {
  title: string
  content: string
  icon: IconName
  defaultOpen?: boolean
}

function ExpandableSection({ title, content, icon, defaultOpen = false }: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()

  return (
    <div className="card mb-4 overflow-hidden">
      <h3>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left
                     hover:bg-parchment-100/70 transition-colors"
        >
          <span className="flex items-center gap-2.5 font-semibold text-ink-900">
            <span
              aria-hidden="true"
              className="grid place-items-center w-7 h-7 rounded-full bg-gold-50 text-gold-700 shrink-0"
            >
              <Icon name={icon} className="w-4 h-4" />
            </span>
            {title}
          </span>
          <Icon
            name="chevronDown"
            className={`w-4 h-4 text-ink-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      <div
        id={id}
        hidden={!open}
        className="px-5 pb-5 text-ink-700 leading-[1.8] text-sm sm:text-base animate-fade-in"
      >
        {content}
      </div>
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
      <main id="main-content" className="shell-narrow py-20 text-center">
        <span
          aria-hidden="true"
          className="grid place-items-center w-16 h-16 rounded-2xl bg-ink-800 text-gold-300
                     mx-auto mb-5 shadow-soft"
        >
          <Icon name="book" className="w-8 h-8" />
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mb-2">
          Story not found
        </h1>
        <p className="text-ink-600 mb-6">This story may have been moved or removed.</p>
        <Link to="/stories" className="btn-primary">
          <Icon name="arrowRight" className="w-4 h-4 rotate-180" />
          Back to Stories
        </Link>
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

      <main id="main-content" className="shell-narrow pb-16 sm:pb-20">
        {/* Back */}
        <nav aria-label="Breadcrumb" className="mb-5">
          <Link
            to="/stories"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600
                       hover:text-ink-900 transition-colors"
          >
            <Icon name="arrowRight" className="w-4 h-4 rotate-180" />
            Bible Stories
          </Link>
        </nav>

        {/* Hero banner */}
        <div className="rounded-2xl overflow-hidden mb-6 shadow-soft">
          <StoryBanner
            tag={story.tag}
            title={story.title}
            readTime={story.read_time}
            heightClass="h-52 sm:h-64"
          />
        </div>

        {/* Title & scripture */}
        <header className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mb-3 text-balance">{story.title}</h1>
          <blockquote className="border-l-4 border-gold-400 pl-4 italic text-ink-700 text-sm sm:text-base leading-relaxed">
            {story.scripture}
          </blockquote>
        </header>

        {/* Story body */}
        <article className="prose prose-sm sm:prose max-w-none mb-6">
          {story.story.split('\n\n').map((para: string, i: number) => (
            <p key={i} className="text-ink-800 leading-relaxed mb-4">{para}</p>
          ))}
        </article>

        {/* Expandable devotional sections */}
        <ExpandableSection title="Reflection"        content={story.reflection}       icon="scroll" defaultOpen />
        <ExpandableSection title="Prayer"            content={story.prayer}           icon="prayer" />
        <ExpandableSection title="Life Application"  content={story.life_application} icon="leaf" />

        {/* Share */}
        <div className="card p-4 flex items-center justify-between gap-3 mb-8">
          <p className="text-sm text-ink-700 font-medium">Share this story</p>
          <div className="flex gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(story.title)}&url=${encodeURIComponent(fullUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3"
              aria-label="Share on Twitter/X"
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon name="share" className="w-3.5 h-3.5" />
                Share
              </span>
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(fullUrl)}
              className="btn-secondary text-xs !py-1.5 !px-3"
              aria-label="Copy link to clipboard"
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon name="copy" className="w-3.5 h-3.5" />
                Copy link
              </span>
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
                  className="card p-4 flex items-start gap-3 hover:border-parchment-300 hover:bg-parchment-100 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink-900 group-hover:text-ink-800 truncate">{s.title}</p>
                    <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{s.summary}</p>
                  </div>
                  <Icon
                    name="chevronRight"
                    className="w-4 h-4 text-ink-400 group-hover:text-gold-700 shrink-0"
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
