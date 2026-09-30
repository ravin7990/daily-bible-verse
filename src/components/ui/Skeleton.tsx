import clsx from 'clsx'

interface SkeletonProps {
  className?: string
  lines?:     number
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx('animate-pulse bg-gray-200 rounded-lg', className)}
      aria-hidden="true"
    />
  )
}

export function SkeletonLines({ lines = 3 }: SkeletonProps) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function VerseCardSkeleton() {
  return (
    <div className="card p-6 space-y-4" aria-busy="true" aria-label="Loading verse…">
      <Skeleton className="h-3 w-32" />
      <SkeletonLines lines={4} />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export function StoryCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-busy="true" aria-label="Loading story…">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <SkeletonLines lines={2} />
      </div>
    </div>
  )
}
