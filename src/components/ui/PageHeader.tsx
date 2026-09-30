import type { ReactNode } from 'react'
import Icon, { type IconName } from '@/components/ui/Icon'

interface PageHeaderProps {
  /** Small uppercase label above the title. */
  eyebrow?: string
  icon?:    IconName
  title:    string
  /** Short supporting line. Doubles as the on-page context for the <h1>. */
  subtitle?: string
  /** Optional right-aligned controls (filters, counts, CTAs). */
  actions?:  ReactNode
  /** Heading level. Pages should keep exactly one <h1>. */
  as?:       'h1' | 'h2'
}

/**
 * Consistent page-level heading block.
 *
 * Every route renders the same eyebrow → title → subtitle rhythm so the pages
 * feel like one product, and so each page still has exactly one <h1> followed
 * by <h2> sections (clean heading outline for SEO and screen readers).
 */
export default function PageHeader({
  eyebrow,
  icon,
  title,
  subtitle,
  actions,
  as: Heading = 'h1',
}: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <p className="eyebrow">
            {icon && <Icon name={icon} className="w-3.5 h-3.5" />}
            {eyebrow}
          </p>
        )}
        <Heading className="section-title text-balance">{title}</Heading>
        {subtitle && (
          <p className="text-ink-600 text-sm sm:text-base mt-1.5 max-w-prose text-pretty">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}