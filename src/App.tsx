import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BottomNav from '@/components/layout/BottomNav'
import ErrorBoundary from '@/components/layout/ErrorBoundary'
import ScrollToTop from '@/components/ui/ScrollToTop'
import { VerseCardSkeleton } from '@/components/ui/Skeleton'

// Lazy-load all pages for code splitting
const Home        = lazy(() => import('@/pages/Home'))
const Archive     = lazy(() => import('@/pages/Archive'))
const Stories     = lazy(() => import('@/pages/Stories'))
const StoryDetail = lazy(() => import('@/pages/StoryDetail'))
const Prayers     = lazy(() => import('@/pages/Prayers'))
const Teachings   = lazy(() => import('@/pages/Teachings'))
const Bible       = lazy(() => import('@/pages/Bible'))
const Community   = lazy(() => import('@/pages/Community'))
const NotFound    = lazy(() => import('@/pages/NotFound'))

function PageLoader() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <VerseCardSkeleton />
    </div>
  )
}

export default function App() {
  return (
    <>
      {/* Skip to main content — accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <ScrollToTop />
      <Header />

      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"                    element={<Home />} />
            <Route path="/archive"             element={<Archive />} />
            <Route path="/stories"             element={<Stories />} />
            <Route path="/stories/:id"         element={<StoryDetail />} />
            <Route path="/stories/:id/:slug"   element={<StoryDetail />} />
            <Route path="/prayers"             element={<Prayers />} />
            <Route path="/teachings"           element={<Teachings />} />
            <Route path="/bible"               element={<Bible />} />
            <Route path="/community"           element={<Community />} />
            <Route path="*"                    element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      <Footer />
      <BottomNav />
    </>
  )
}
