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
      gradient: 'from-purple-900 via-indigo-900 to-sacred-800',
      icon: '📜',
      accentColor: 'text-purple-300',
    }
  }
  if (lower.includes('miracle') || lower.includes('glory') || lower.includes('power')) {
    return {
      gradient: 'from-amber-700 via-gold-600 to-yellow-600',
      icon: '✨',
      accentColor: 'text-gold-200',
    }
  }
  if (lower.includes('faith') || lower.includes('courage') || lower.includes('trust')) {
    return {
      gradient: 'from-blue-900 via-sacred-800 to-indigo-900',
      icon: '🛡️',
      accentColor: 'text-blue-200',
    }
  }
  if (lower.includes('wisdom') || lower.includes('teach') || lower.includes('parable')) {
    return {
      gradient: 'from-emerald-900 via-teal-800 to-cyan-900',
      icon: '🌿',
      accentColor: 'text-emerald-200',
    }
  }
  if (lower.includes('resurrection') || lower.includes('jesus') || lower.includes('christ')) {
    return {
      gradient: 'from-sacred-900 via-purple-900 to-indigo-950',
      icon: '✝️',
      accentColor: 'text-gold-300',
    }
  }
  if (lower.includes('passion') || lower.includes('cross') || lower.includes('sacrifice')) {
    return {
      gradient: 'from-red-950 via-rose-900 to-purple-950',
      icon: '🕊️',
      accentColor: 'text-rose-200',
    }
  }

  // Default theme
  return {
    gradient: 'from-indigo-900 via-sacred-700 to-sacred-900',
    icon: '📖',
    accentColor: 'text-sacred-200',
  }
}

export default function StoryBanner({
  tag,
  title,
  readTime,
  heightClass = 'h-44',
  showReadTime = true,
}: StoryBannerProps) {
  const theme = getTheme(tag)

  return (
    <div
      className={`relative w-full ${heightClass} bg-gradient-to-br ${theme.gradient} overflow-hidden flex flex-col justify-between p-4 text-white shadow-inner select-none`}
      role="img"
      aria-label={`${tag}: ${title}`}
    >
      {/* Decorative background geometry */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl opacity-15 pointer-events-none select-none filter blur-[1px]">
        {theme.icon}
      </div>

      {/* Top badges */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/15 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20">
          <span aria-hidden="true">{theme.icon}</span>
          {tag}
        </span>
        {showReadTime && readTime && (
          <span className="text-xs bg-black/30 backdrop-blur-sm text-white/90 px-2 py-0.5 rounded-full font-medium">
            {readTime}
          </span>
        )}
      </div>

      {/* Radiant cross watermark */}
      <div className="relative z-10 mt-auto flex items-center gap-2">
        <span className="text-xs font-serif italic text-white/80 line-clamp-1">
          The Word of the Lord
        </span>
      </div>
    </div>
  )
}
