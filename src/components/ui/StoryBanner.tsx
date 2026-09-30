interface StoryBannerProps {
  tag: string
  title: string
  readTime?: string
  heightClass?: string
  showReadTime?: boolean
}

interface ThemeConfig {
  gradient: string
  icon: string
  accentColor: string
  imageUrl: string
}

function getTheme(tag: string): ThemeConfig {
  const lower = tag.toLowerCase()

  if (lower.includes('prophecy') || lower.includes('revelation') || lower.includes('covenant')) {
    return {
      gradient: 'from-purple-950 via-indigo-950 to-sacred-950',
      icon: '📜',
      accentColor: 'text-purple-300',
      imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=80',
    }
  }
  if (lower.includes('miracle') || lower.includes('glory') || lower.includes('power')) {
    return {
      gradient: 'from-amber-950 via-gold-950 to-yellow-950',
      icon: '✨',
      accentColor: 'text-gold-200',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
    }
  }
  if (lower.includes('faith') || lower.includes('courage') || lower.includes('trust')) {
    return {
      gradient: 'from-blue-950 via-sacred-950 to-indigo-950',
      icon: '🛡️',
      accentColor: 'text-blue-200',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=80',
    }
  }
  if (lower.includes('wisdom') || lower.includes('teach') || lower.includes('parable')) {
    return {
      gradient: 'from-emerald-950 via-teal-950 to-cyan-950',
      icon: '🌿',
      accentColor: 'text-emerald-200',
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=80',
    }
  }
  if (lower.includes('resurrection') || lower.includes('jesus') || lower.includes('christ')) {
    return {
      gradient: 'from-sacred-950 via-purple-950 to-indigo-950',
      icon: '✝️',
      accentColor: 'text-gold-300',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80',
    }
  }
  if (lower.includes('passion') || lower.includes('cross') || lower.includes('sacrifice')) {
    return {
      gradient: 'from-rose-950 via-red-950 to-purple-950',
      icon: '🕊️',
      accentColor: 'text-rose-200',
      imageUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=700&q=80',
    }
  }

  // Default theme
  return {
    gradient: 'from-indigo-950 via-sacred-950 to-sacred-900',
    icon: '📖',
    accentColor: 'text-sacred-200',
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=700&q=80',
  }
}

export default function StoryBanner({
  tag,
  title,
  readTime,
  heightClass = 'h-48',
  showReadTime = true,
}: StoryBannerProps) {
  const theme = getTheme(tag)

  return (
    <div
      className={`relative w-full ${heightClass} bg-gradient-to-br ${theme.gradient} overflow-hidden flex flex-col justify-between p-4 text-white shadow-inner select-none group`}
      role="img"
      aria-label={`${tag}: ${title}`}
    >
      {/* Background Photography with smooth zoom on hover */}
      <img
        src={theme.imageUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 ease-out group-hover:scale-105"
      />

      {/* Dark gradient overlay for typography readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25 pointer-events-none" />

      {/* Top badges */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20 shadow-sm">
          <span aria-hidden="true">{theme.icon}</span>
          {tag}
        </span>
        {showReadTime && readTime && (
          <span className="text-xs bg-black/50 backdrop-blur-md text-white/90 px-2.5 py-0.5 rounded-full font-medium border border-white/10">
            {readTime}
          </span>
        )}
      </div>

      {/* Radiant scripture watermark / title */}
      <div className="relative z-10 mt-auto flex items-center gap-2">
        <span className="text-xs font-serif italic text-gold-300/90 line-clamp-1 drop-shadow-sm">
          ✨ Sacred Scripture Story
        </span>
      </div>
    </div>
  )
}
