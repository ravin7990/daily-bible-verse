import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import SEO from '@/components/layout/SEO'
import PageHeader from '@/components/ui/PageHeader'
import { SITE_NAME, LEGAL_UPDATED } from '@/utils/siteConfig'

/**
 * Shared shell for the four trust pages (About, Contact, Privacy, Terms).
 *
 * Google AdSense reviewers expect these to be real, readable pages rather than
 * a paragraph in a footer, so they share a consistent, legible layout: a
 * constrained measure, a dated header, and cross-links between the legal pages.
 */
export default function LegalPage({
  title,
  canonical,
  seoTitle,
  seoDescription,
  showDate = true,
  children,
}: {
  title: string
  /** Route path, e.g. "/privacy". Explicit because the title is not a URL slug. */
  canonical: string
  seoTitle: string
  seoDescription: string
  showDate?: boolean
  children: ReactNode
}) {
  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
      />

      <div className="shell py-10 md:py-14 max-w-3xl">
        <PageHeader
          title={title}
          subtitle={showDate ? `Last updated ${LEGAL_UPDATED}` : undefined}
        />

        <div className="card space-y-6 text-[15px] leading-relaxed text-ink-700">
          {children}
        </div>

        <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
          <Link to="/about"     className="hover:text-ink-900">About</Link>
          <Link to="/contact"   className="hover:text-ink-900">Contact</Link>
          <Link to="/privacy"   className="hover:text-ink-900">Privacy Policy</Link>
          <Link to="/terms"     className="hover:text-ink-900">Terms of Use</Link>
          <Link to="/"          className="hover:text-ink-900">{SITE_NAME} home</Link>
        </nav>
      </div>
    </>
  )
}

/** A titled section inside a legal page. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-ink-900 mb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
