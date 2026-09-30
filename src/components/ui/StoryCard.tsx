import { Link } from 'react-router-dom'
import type { Story } from '@/types'
import { slugify } from '@/utils/dateUtils'
import Icon, { type IconName } from '@/components/ui/Icon'

/** Map a story tag to a consistent icon instead of an emoji. */
const TAG_ICONS: { match: string; icon: IconName }[] = [
  { match: 'prophecy',     icon: 'scroll'   },
  { match: 'miracle',      icon: 'sparkle'  },
  { match: 'faith',        icon: 'shield'   },
  { match: 'wisdom',       icon: 'leaf'     },
  { match: 'resurrection', icon: 'bible'    },
  { match: 'passion',      icon: 'heart'    },
]

function getTagIcon(tag: string): IconName {
  const lower = tag.toLowerCase()
  return TAG_ICONS.find(({ match }) => lower.includes(match))?.icon ?? 'book'
}

interface StoryCardProps {
  story: Story
}

export default function StoryCard({ story }: StoryCardProps) {
  const href = `/stories/${story.id}/${slugify(story.title)}`
  const icon = getTagIcon(story.tag)

  return (
    <article
      className="card relative p-5 sm:p-6 flex flex-col h-full
                 hover:shadow-lift hover:border-gold-300 transition-all duration-200 group"
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="tag-badge">
            <Icon name={icon} className="w-3.5 h-3.5 mr-1 inline align-[-2px]" />
            {story.tag}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-ink-500 font-medium shrink-0">
            <Icon name="clock" className="w-3.5 h-3.5" />
            {story.read_time}
          </span>
        </div>

        {/* The stretched link makes the whole card clickable while keeping a
            single, correctly-labelled link in the accessibility tree. */}
        <h3 className="font-serif font-semibold text-ink-900 text-lg sm:text-xl leading-snug mb-2 group-hover:text-gold-800 transition-colors">
          <Link to={href} className="after:absolute after:inset-0 after:content-['']">
            {story.title}
          </Link>
        </h3>

        <p className="text-sm text-ink-600 line-clamp-3 leading-relaxed font-serif">
          {story.summary}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-parchment-200 flex items-center justify-between gap-3 text-xs">
        <span className="text-ink-500 italic truncate">{story.scripture}</span>
        <span
          aria-hidden="true"
          className="inline-flex items-center gap-1 font-semibold text-gold-800 shrink-0
                     group-hover:translate-x-0.5 transition-transform"
        >
          Read <Icon name="arrowRight" className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  )
}
