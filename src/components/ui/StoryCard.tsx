import { Link } from 'react-router-dom'
import type { Story } from '@/types'
import { slugify } from '@/utils/dateUtils'

import StoryBanner from '@/components/ui/StoryBanner'

interface StoryCardProps {
  story: Story
}

export default function StoryCard({ story }: StoryCardProps) {
  const href = `/stories/${story.id}/${slugify(story.title)}`

  return (
    <article className="card group hover:shadow-md transition-shadow duration-200">
      <StoryBanner
        tag={story.tag}
        title={story.title}
        readTime={story.read_time}
        heightClass="h-44"
      />

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">{story.read_time}</span>
        </div>
        <h2 className="font-serif font-semibold text-gray-900 text-base sm:text-lg leading-snug mb-2 group-hover:text-sacred-700 transition-colors">
          <Link to={href} className="before:absolute before:inset-0 relative">
            {story.title}
          </Link>
        </h2>
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{story.summary}</p>
        <p className="mt-3 text-xs text-gray-400 italic line-clamp-1">{story.scripture}</p>
      </div>
    </article>
  )
}
