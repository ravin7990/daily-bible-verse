import { Link } from 'react-router-dom'
import SEO from '@/components/layout/SEO'
import Icon from '@/components/ui/Icon'

export default function NotFound() {
  return (
    <>
      <SEO
        title="Page Not Found"
        description="The page you are looking for does not exist."
        noIndex
      />
      <main
        id="main-content"
        className="shell-narrow min-h-[60vh] flex flex-col items-center justify-center py-20 text-center"
      >
        <span
          aria-hidden="true"
          className="grid place-items-center w-16 h-16 rounded-2xl bg-ink-800 text-gold-300 mb-5 shadow-soft"
        >
          <Icon name="book" className="w-8 h-8" />
        </span>
        <p className="eyebrow">Error 404</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 mb-3 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-ink-600 mb-8 max-w-sm text-pretty">
          This page doesn&rsquo;t exist. Let&rsquo;s guide you back to God&rsquo;s Word.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="btn-primary">
            <Icon name="home" className="w-4 h-4" />
            Return Home
          </Link>
          <Link to="/archive" className="btn-secondary">
            <Icon name="archive" className="w-4 h-4" />
            Browse Archive
          </Link>
        </div>
      </main>
    </>
  )
}
