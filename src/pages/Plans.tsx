import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '@/components/layout/SEO'
import PageHeader from '@/components/ui/PageHeader'
import Icon from '@/components/ui/Icon'
import clsx from 'clsx'
import { useReadingPlan } from '@/utils/userProgress'
import {
  READING_PLANS,
  PLAN_CATEGORIES,
  getReadingsForPlanDay,
  formatReadings,
  appIndexToManifestId,
  type ReadingPlan,
} from '@/utils/readingPlans'
import { useAuth } from '@/auth/AuthProvider'
import AuthModal from '@/components/auth/AuthModal'

export default function Plans() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [filter, setFilter] = useState<string>('All')

  const {
    plan, currentDay, completedDays, progressPercent, elapsedDays,
    isDayComplete, startPlan, leavePlan, setDay, markDayComplete,
  } = useReadingPlan()

  const filtered = useMemo(
    () => (filter === 'All' ? READING_PLANS : READING_PLANS.filter(p => p.category === filter)),
    [filter],
  )

  const todayReadings = plan ? getReadingsForPlanDay(plan.id, currentDay - 1) : []
  const finished = !!plan && completedDays.length >= plan.durationDays

  // Progress works signed out too - it just stays on this device until sign-in.
  function begin(p: ReadingPlan) {
    startPlan(p.id)
  }

  return (
    <>
      <SEO
        title="Bible Reading Plans"
        description="Guided Bible reading plans: 7 days of peace, 14 days of healing, 30 days in the Psalms, the Gospels in 30 days, and the New Testament in 90 days."
        canonical="/plans"
      />

      <main id="main-content" className="shell pb-16 sm:pb-20">
        <PageHeader
          icon="scroll"
          eyebrow="Guided Reading"
          title="Bible Reading Plans"
          subtitle="Follow a structured path through Scripture. Progress syncs with the mobile app, so you can continue where you left off on either device."
        />

        {plan ? (
          <section className="card p-5 sm:p-7 mb-10 animate-slide-up" aria-label="Active reading plan">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
              <span
                aria-hidden="true"
                className="grid place-items-center w-12 h-12 rounded-xl bg-ink-800
                           text-gold-300 shrink-0"
              >
                <Icon name={plan.icon} className="w-6 h-6" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="eyebrow">Active plan</p>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-900">
                  {plan.title}
                </h2>
                <p className="text-sm text-ink-600 mt-1">{plan.description}</p>
              </div>
              <button
                type="button"
                onClick={leavePlan}
                className="text-xs font-medium text-ink-500 hover:text-ink-900
                           underline underline-offset-4 shrink-0 self-start"
              >
                Leave plan
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline justify-between text-sm mb-2">
                <span className="font-semibold text-ink-900">
                  Day {currentDay} of {plan.durationDays}
                </span>
                <span className="text-ink-600">
                  {completedDays.length} done · {progressPercent}%
                </span>
              </div>
              <div
                className="h-2.5 bg-parchment-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={completedDays.length}
                aria-valuemin={0}
                aria-valuemax={plan.durationDays}
                aria-label={`${plan.title} progress`}
              >
                <div
                  className="h-full bg-gold-600 rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              <p className="text-xs text-ink-500 mt-2">Day {elapsedDays} of your journey.</p>
            </div>
            {finished ? (
              <div className="text-center py-6 bg-gold-50 border border-gold-200 rounded-xl">
                <Icon name="sparkle" className="w-8 h-8 mx-auto mb-2 text-gold-700" />
                <p className="font-serif text-lg font-semibold text-gold-900">
                  Plan complete — well done!
                </p>
                <p className="text-sm text-gold-800 mt-1">
                  You finished all {plan.durationDays} days. Pick another plan below.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-parchment-100 border border-parchment-200 rounded-xl p-4 sm:p-5">
                  <p className="text-xs font-semibold text-ink-600 uppercase tracking-eyebrow mb-1.5">
                    Today&rsquo;s reading · Day {currentDay}
                  </p>
                  <p className="font-serif text-lg sm:text-xl font-semibold text-ink-900">
                    {formatReadings(todayReadings)}
                  </p>

                  {todayReadings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const first = todayReadings[0]
                        navigate(`/bible?book=${appIndexToManifestId(first[0])}&chapter=${first[1]}`)
                      }}
                      className="btn-primary mt-4 !py-2 text-sm"
                    >
                      <Icon name="bible" className="w-4 h-4" />
                      Start reading
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-2.5 mt-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDayComplete(currentDay)}
                    onChange={e => markDayComplete(currentDay, e.target.checked)}
                    className="w-5 h-5 accent-gold-600"
                  />
                  <span className="text-sm font-medium text-ink-800">
                    Mark day {currentDay} as complete
                  </span>
                </label>
              </>
            )}

            {/* Day list — hidden for the long plans, where it would be unusable */}
            {plan.durationDays <= 30 && (
              <div className="mt-6 pt-5 border-t border-parchment-200">
                <h3 className="text-xs font-semibold text-ink-600 uppercase tracking-eyebrow mb-3">
                  All days
                </h3>
                <ul className="space-y-1.5">
                  {Array.from({ length: plan.durationDays }, (_, i) => i + 1).map(day => {
                    const done = isDayComplete(day)
                    const isToday = day === currentDay
                    return (
                      <li key={day}>
                        <button
                          type="button"
                          onClick={() => setDay(day)}
                          className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                            'border transition-colors',
                            isToday
                              ? 'border-gold-400 bg-gold-50'
                              : 'border-transparent hover:bg-parchment-100',
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={clsx(
                              'grid place-items-center w-6 h-6 rounded-full shrink-0 text-[11px] font-bold',
                              done ? 'bg-gold-600 text-white' : 'bg-parchment-200 text-ink-600',
                            )}
                          >
                            {done ? <Icon name="check" className="w-3.5 h-3.5" /> : day}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-ink-700">Day {day}</span>
                            <span className="block text-sm text-ink-600 truncate">
                              {formatReadings(getReadingsForPlanDay(plan.id, day - 1))}
                            </span>
                          </span>
                          {isToday && <span className="tag-badge shrink-0">Today</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>
        ) : null}
        <section aria-labelledby="all-plans">
          <h2 id="all-plans" className="section-title mb-1">All plans</h2>
          <p className="text-sm text-ink-600 mb-5">
            Choose a plan to begin. You can run one at a time.
          </p>

          <ul className="mb-5 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {['All', ...PLAN_CATEGORIES].map(cat => (
              <li key={cat} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setFilter(cat)}
                  aria-pressed={filter === cat}
                  className={clsx(
                    'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                    filter === cat
                      ? 'bg-ink-800 text-white border-ink-800'
                      : 'bg-white text-ink-700 border-parchment-300 hover:bg-parchment-100',
                  )}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => {
              const active = plan?.id === p.id
              return (
                <li key={p.id}>
                  <article className="card p-5 flex flex-col h-full hover:shadow-lift
                                      hover:border-gold-300 transition-all duration-200">
                    <span
                      aria-hidden="true"
                      className="grid place-items-center w-11 h-11 rounded-xl bg-gold-50
                                 text-gold-700 mb-3"
                    >
                      <Icon name={p.icon} className="w-5 h-5" />
                    </span>
                    <p className="tag-badge mb-2">{p.category}</p>
                    <h3 className="font-serif text-lg font-semibold text-ink-900 mb-1.5">
                      {p.title}
                    </h3>
                    <p className="text-sm text-ink-600 leading-relaxed flex-1 mb-4">
                      {p.description}
                    </p>
                    <p className="text-xs font-medium text-ink-500 mb-3">{p.durationDays} days</p>
                    <button
                      type="button"
                      onClick={() => begin(p)}
                      disabled={active}
                      className={clsx('w-full text-sm', active ? 'btn-secondary' : 'btn-primary')}
                    >
                      {active ? 'Currently active' : plan ? 'Switch to this plan' : 'Start plan'}
                    </button>
                  </article>
                </li>
              )
            })}
          </ul>
        </section>

        {!user && (
          <div className="card p-5 mt-10 flex flex-col sm:flex-row items-start sm:items-center
                          justify-between gap-4 bg-parchment-100 border-parchment-200">
            <div className="flex items-start gap-3">
              <Icon name="sparkle" className="w-5 h-5 text-gold-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-ink-900 text-sm">Sync across your devices</p>
                <p className="text-sm text-ink-600">
                  Your plan progress is saved on this device. Sign in to keep it in step
                  with the mobile app.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setAuthOpen(true)} className="btn-gold shrink-0">
              Sign in to sync
            </button>
          </div>
        )}
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        reason="Sign in to keep your reading plan progress in sync with the mobile app."
      />
    </>
  )
}