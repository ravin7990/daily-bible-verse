import { Link } from 'react-router-dom'
import SEO from '@/components/layout/SEO'

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
        className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center"
      >
        <span className="text-6xl mb-4" aria-hidden="true">📖</span>
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6 max-w-sm">
          This page doesn't exist. Let's guide you back to God's Word.
        </p>
        <Link to="/" className="btn-primary">
          ← Return Home
        </Link>
      </main>
    </>
  )
}
