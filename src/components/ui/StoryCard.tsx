import { Link } from 'react-router-dom'
import type { Story } from '@/types'
import { slugify } from '@/utils/dateUtils'

const TAG_ICONS: Record<string, string> = {
  prophecy: '📜',
  miracle: '✨',
  faith: '🛡️',
  wisdom: '🌿',
  resurrection: '✝️',
  passion: '🕊️',
}

function getTagIcon(tag: string): string {
  const lower = tag.toLowerCase()
  for (const [key, icon] of Object.entries(TAG_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return '📖'
}

interface StoryCardProps {
  story: Story
}

export default function StoryCard({ story }: StoryCardProps) {
  const href = `/stories/${story.id}/${slugify(story.title)}`
  const icon = getTagIcon(story.tag)

  return (
    <article className="card p-5 sm:p-6 flex flex-col justify-between hover:shadow-md hover:border-sacred-300 transition-all duration-200 group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-sacred-50 text-sacred-700 px-3 py-1 rounded-full border border-sacred-100">
            <span aria-hidden="true">{icon}</span>
            {story.tag}
          </span>
          <span className="text-xs text-gray-400 font-medium">⏱️ {story.read_time}</span>
        </div>

        {/* Title */}
        <h2 className="font-serif font-bold text-gray-900 text-lg sm:text-xl leading-snug mb-2 group-hover:text-sacred-700 transition-colors">
          <Link to={href} className="before:absolute before:inset-0 relative">
            {story.title}
          </Link>
        </h2>

        {/* Summary */}
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4 font-serif">
          {story.summary}
        </p>
      </div>

      {/* Bottom Footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-400 italic truncate max-w-[190px]">
          {story.scripture}
        </span>
        <span className="text-sacred-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
          Read Story <span>→</span>
        </span>
      </div>
    </article>
  )
}
