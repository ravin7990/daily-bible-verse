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
}

function getTheme(tag: string): ThemeConfig {
  const lower = tag.toLowerCase()

  if (lower.includes('prophecy') || lower.includes('revelation') || lower.includes('covenant')) {
    return {
      gradient: 'from-purple-950 via-indigo-950 to-sacred-950',
      icon: '📜',
      accentColor: 'text-purple-300',
    }
  }
  if (lower.includes('miracle') || lower.includes('glory') || lower.includes('power')) {
    return {
      gradient: 'from-amber-950 via-gold-950 to-yellow-950',
      icon: '✨',
      accentColor: 'text-gold-200',
    }
  }
  if (lower.includes('faith') || lower.includes('courage') || lower.includes('trust')) {
    return {
      gradient: 'from-blue-950 via-sacred-950 to-indigo-950',
      icon: '🛡️',
      accentColor: 'text-blue-200',
    }
  }
  if (lower.includes('wisdom') || lower.includes('teach') || lower.includes('parable')) {
    return {
      gradient: 'from-emerald-950 via-teal-950 to-cyan-950',
      icon: '🌿',
      accentColor: 'text-emerald-200',
    }
  }
  if (lower.includes('resurrection') || lower.includes('jesus') || lower.includes('christ')) {
    return {
      gradient: 'from-sacred-950 via-purple-950 to-indigo-950',
      icon: '✝️',
      accentColor: 'text-gold-300',
    }
  }
  if (lower.includes('passion') || lower.includes('cross') || lower.includes('sacrifice')) {
    return {
      gradient: 'from-rose-950 via-red-950 to-purple-950',
      icon: '🕊️',
      accentColor: 'text-rose-200',
    }
  }

  // Default theme
  return {
    gradient: 'from-indigo-950 via-sacred-950 to-sacred-900',
    icon: '📖',
    accentColor: 'text-sacred-200',
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
      className={`relative w-full ${heightClass} bg-gradient-to-br ${theme.gradient} overflow-hidden flex flex-col justify-between p-6 text-white shadow-inner select-none`}
      role="img"
      aria-label={`${tag}: ${title}`}
    >
      {/* Decorative ambient glow */}
      <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl opacity-10 pointer-events-none select-none filter blur-[1px]">
        {theme.icon}
      </div>

      {/* Top badges */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
          <span aria-hidden="true">{theme.icon}</span>
          {tag}
        </span>
        {showReadTime && readTime && (
          <span className="text-xs bg-black/40 backdrop-blur-md text-white/90 px-2.5 py-0.5 rounded-full font-medium border border-white/10">
            {readTime}
          </span>
        )}
      </div>

      {/* Title & category imprint */}
      <div className="relative z-10 mt-auto">
        <span className="text-xs font-serif italic text-gold-300 block mb-1">
          The Word of the Lord
        </span>
        <h3 className="font-serif font-bold text-xl sm:text-2xl text-white/95 line-clamp-2">
          {title}
        </h3>
      </div>
    </div>
  )
}
