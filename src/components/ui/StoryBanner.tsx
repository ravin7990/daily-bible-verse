import Icon, { type IconName } from '@/components/ui/Icon'

interface StoryBannerProps {
  tag: string
  title: string
  readTime?: string
  heightClass?: string
  showReadTime?: boolean
}

interface ThemeConfig {
  gradient: string
  icon: IconName
  accentColor: string
}

function getTheme(tag: string): ThemeConfig {
  const lower = tag.toLowerCase()

  if (lower.includes('prophecy') || lower.includes('revelation') || lower.includes('covenant')) {
    return {
      gradient: 'from-ink-950 via-ink-900 to-ink-800',
      icon: 'scroll',
      accentColor: 'text-gold-300',
    }
  }
  if (lower.includes('miracle') || lower.includes('glory') || lower.includes('power')) {
    return {
      gradient: 'from-ink-950 via-ink-900 to-gold-900',
      icon: 'sparkle',
      accentColor: 'text-gold-200',
    }
  }
  if (lower.includes('faith') || lower.includes('courage') || lower.includes('trust')) {
    return {
      gradient: 'from-ink-950 via-ink-800 to-ink-900',
      icon: 'shield',
      accentColor: 'text-gold-200',
    }
  }
  if (lower.includes('wisdom') || lower.includes('teach') || lower.includes('parable')) {
    return {
      gradient: 'from-ink-950 via-ink-800 to-ink-700',
      icon: 'leaf',
      accentColor: 'text-gold-200',
    }
  }
  if (lower.includes('resurrection') || lower.includes('jesus') || lower.includes('christ')) {
    return {
      gradient: 'from-ink-950 via-ink-900 to-ink-800',
      icon: 'bible',
      accentColor: 'text-gold-300',
    }
  }
  if (lower.includes('passion') || lower.includes('cross') || lower.includes('sacrifice')) {
    return {
      gradient: 'from-ink-950 via-ink-900 to-gold-900',
      icon: 'heart',
      accentColor: 'text-gold-200',
    }
  }

  // Default theme
  return {
    gradient: 'from-ink-950 via-ink-900 to-ink-800',
    icon: 'book',
    accentColor: 'text-gold-200',
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
      {/* Oversized watermark icon */}
      <Icon
        name={theme.icon}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32
                   text-white opacity-[0.07] pointer-events-none select-none"
      />

      {/* Top badges */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-eyebrow bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
          <Icon name={theme.icon} className="w-3.5 h-3.5" />
          {tag}
        </span>
        {showReadTime && readTime && (
          <span className="inline-flex items-center gap-1 text-xs bg-ink-950/50 backdrop-blur-md text-white/90 px-2.5 py-1 rounded-full font-medium border border-white/10">
            <Icon name="clock" className="w-3 h-3" />
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
