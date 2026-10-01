import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import SEO from '@/components/layout/SEO'
import PageHeader from '@/components/ui/PageHeader'
import Icon, { type IconName } from '@/components/ui/Icon'
import AuthModal from '@/components/auth/AuthModal'
import { useAuth } from '@/auth/AuthProvider'
import { BIBLE_VERSIONS } from '@/utils/bibleService'
import {
  useAppSettings,
  SETTINGS,
  NO_SECONDARY_VERSION,
  TEXT_SIZE_MIN,
  TEXT_SIZE_MAX,
  DEFAULT_TEXT_SIZE_PROGRESS,
  SPEECH_RATE_MIN,
  SPEECH_RATE_MAX,
  SPEECH_RATE_STEP,
  type ViewMode,
} from '@/utils/appSettings'

/* ── Small, dependency-free controls ──────────────────────────────────────
   Each one is a real form control (button[role=switch], input[type=range]),
   so the page is keyboard- and screen-reader-navigable without a component
   library. */

function Toggle({
  checked, onChange, label, description,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="font-semibold text-ink-900 text-sm">{label}</p>
        <p className="text-xs text-ink-600 mt-0.5 text-pretty">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative shrink-0 w-12 h-7 rounded-full transition-colors duration-200 mt-0.5',
          checked ? 'bg-ink-800' : 'bg-parchment-300',
        )}
      >
        <span
          aria-hidden="true"
          className={clsx(
            'absolute top-1 w-5 h-5 rounded-full bg-white shadow-soft transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}

function Slider({
  id, value, min, max, step, onChange, valueLabel,
}: {
  id: string
  value: number
  min: number
  max: number
  step: number
  onChange: (next: number) => void
  valueLabel: string
}) {
  return (
    <div className="py-3.5">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink-900">
          {valueLabel}
        </label>
        <span className="font-mono text-xs font-semibold text-ink-700 tabular-nums">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        className="bvtv-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <div className="flex justify-between text-[11px] text-ink-500 mt-2" aria-hidden="true">
        <span>Small</span>
        <span>Large</span>
      </div>
    </div>
  )
}

function Segmented<T extends string>({
  legend, options, value, onChange,
}: {
  legend: string
  options: { value: T; label: string; hint: string }[]
  value: T
  onChange: (next: T) => void
}) {
  return (
    <fieldset className="py-3.5">
      <legend className="text-sm font-semibold text-ink-900 mb-3">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'rounded-xl border px-3 py-2.5 text-left transition-colors',
              value === opt.value
                ? 'border-ink-800 bg-ink-800 text-white'
                : 'border-parchment-300 bg-white text-ink-800 hover:bg-parchment-100',
            )}
          >
            <span className="block text-sm font-semibold">{opt.label}</span>
            <span
              className={clsx(
                'block text-[11px] mt-0.5',
                value === opt.value ? 'text-parchment-200' : 'text-ink-500',
              )}
            >
              {opt.hint}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** A titled group of related settings. */
function Section({
  title, icon, children, footer,
}: {
  title: string
  icon: IconName
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="card p-5 sm:p-6 mb-6">
      <h2 className="flex items-center gap-2.5 font-serif text-lg font-bold text-ink-900 mb-1">
        <span
          aria-hidden="true"
          className="grid place-items-center w-8 h-8 rounded-lg bg-gold-50 text-gold-700 shrink-0"
        >
          <Icon name={icon} className="w-4 h-4" />
        </span>
        {title}
      </h2>
      <div className="divide-y divide-parchment-200">{children}</div>
      {footer && <div className="mt-4 pt-4 border-t border-parchment-200">{footer}</div>}
    </section>
  )
}

/** `8:05 AM`, from the app's hour/minute pair. */
function formatTime(hour: number, minute: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`
}

const SAMPLE_VERSE = 'Your word is a lamp for my feet, a light on my path.'
export default function Settings() {
  const { user, initialising, synced, lastSyncError } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const settings = useAppSettings()
  const { update, restoreDefaults } = settings

  /* Only the translations the web actually ships, so the value written to the
     phone is always one the app can load too (WEB, BSB, ASV, KJV, HINDI, RV1909). */
  const versions = BIBLE_VERSIONS
  const primary = versions.some(v => v.key === settings.bibleVersion)
    ? settings.bibleVersion
    : versions[0].key

  const secondaryOptions = [
    { key: NO_SECONDARY_VERSION, name: 'None' },
    ...versions.filter(v => v.key !== primary),
  ]
  const secondary = secondaryOptions.some(v => v.key === settings.secondaryVersion)
    ? settings.secondaryVersion
    : NO_SECONDARY_VERSION

  /** Speak a sample line so the rate can be judged before leaving the page. */
  function previewSpeechRate() {
    if (!('speechSynthesis' in window)) return

    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(
      'Your word is a lamp for my feet, a light on my path. Psalm 119, verse 105.',
    )
    utterance.rate = settings.speechRate
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  if (initialising) {
    return (
      <main id="main-content" className="shell-narrow py-20">
        <div className="h-8 w-48 bg-parchment-200 rounded-lg animate-pulse" aria-hidden="true" />
      </main>
    )
  }

  return (
    <>
      <SEO
        title="Settings"
        description="Choose your Bible translation, text size, dark mode and daily verse view. Your settings sync with the Bible Verse of the Day mobile app."
        canonical="/settings"
        noIndex
      />

      <main id="main-content" className="shell-narrow pb-16 sm:pb-20">
        <PageHeader
          icon="settings"
          eyebrow="Preferences"
          title="Settings"
          subtitle="Everything here is stored in the same settings file the mobile app uses, so a change made on either device follows you to the other."
        />

        {/* Sync state, worded to match Account.tsx so the two agree. */}
        <div className="card p-4 mb-6 flex items-start gap-3 bg-parchment-100 border-parchment-200">
          <Icon
            name={synced && !lastSyncError ? 'check' : 'sparkle'}
            className="w-5 h-5 text-gold-700 mt-0.5 shrink-0"
          />
          <div className="text-sm">
            <p className="font-semibold text-ink-900">
              {!user ? 'Saved on this device'
                : !synced ? 'Syncing with the app…'
                : lastSyncError ? 'Signed in — some data could not sync'
                : 'Synced with the app'}
            </p>
            <p className="text-ink-600 mt-0.5">
              {lastSyncError
                ? lastSyncError
                : user
                  ? 'These settings are shared with the Bible Verse of the Day mobile app.'
                  : 'Settings work without an account and sync the moment you sign in.'}
            </p>
            {!user && (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="text-xs font-semibold text-gold-800 hover:underline mt-1.5 inline-block"
              >
                Sign in to sync
              </button>
            )}
          </div>
        </div>
<Section title="Bible" icon="bible">
          <div className="py-3.5">
            <label htmlFor="primary-version" className="block text-sm font-semibold text-ink-900 mb-1">
              Primary translation
            </label>
            <p className="text-xs text-ink-600 mb-2.5 text-pretty">
              The translation the reader opens with.
            </p>
            <select
              id="primary-version"
              value={primary}
              onChange={e => {
                const next = e.target.value
                // The app refuses a parallel Bible identical to the primary one,
                // so clear it rather than letting the phone show a duplicate.
                update({
                  [SETTINGS.bibleVersion]: next,
                  ...(secondary === next
                    ? { [SETTINGS.secondaryVersion]: NO_SECONDARY_VERSION }
                    : {}),
                })
              }}
              className="w-full border border-parchment-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {versions.map(v => (
                <option key={v.key} value={v.key}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="py-3.5">
            <label htmlFor="secondary-version" className="block text-sm font-semibold text-ink-900 mb-1">
              Parallel translation
            </label>
            <p className="text-xs text-ink-600 mb-2.5 text-pretty">
              Shown alongside the primary one for side-by-side reading.
            </p>
            <select
              id="secondary-version"
              value={secondary}
              onChange={e => update({ [SETTINGS.secondaryVersion]: e.target.value })}
              className="w-full border border-parchment-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {secondaryOptions.map(v => (
                <option key={v.key} value={v.key}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <p className="text-xs text-ink-600 text-pretty">
              Changes apply to the reader straight away.
            </p>
            <Link to="/bible" className="btn-secondary !py-2 text-sm shrink-0">
              Open reader
            </Link>
          </div>
        </Section>

        <Section title="Reading" icon="book">
          <Slider
            id="text-size"
            valueLabel="Text size"
            value={settings.textSize}
            min={TEXT_SIZE_MIN}
            max={TEXT_SIZE_MAX}
            step={1}
            onChange={next => update({ [SETTINGS.textSize]: next })}
          />

          {/* Live preview: the same .verse-text class the site uses, so what
              you see here is exactly what today's verse will look like. */}
          <div className="py-3.5">
            <p className="text-[11px] font-semibold text-ink-600 uppercase tracking-eyebrow mb-2">
              Preview
            </p>
            <blockquote className="bg-parchment-100 border border-parchment-200 rounded-xl px-4 py-3.5">
              <p className="verse-text text-balance">&ldquo;{SAMPLE_VERSE}&rdquo;</p>
              <cite className="not-italic font-sans text-xs font-semibold text-gold-800 mt-1.5 block">
                Psalm 119:105
              </cite>
            </blockquote>
            <p className="text-xs text-ink-500 mt-2">
              Matches the app at {settings.verseSizeSp.toFixed(1)}sp verse /{' '}
              {settings.bodySizeSp.toFixed(1)}sp body
              {settings.textSize === DEFAULT_TEXT_SIZE_PROGRESS
                ? ' (app default)'
                : ` · ${Math.round(settings.textScale * 100)}% of the default size`}
            </p>
          </div>

          <Slider
            id="speech-rate"
            valueLabel="Speech rate"
            value={settings.speechRate}
            min={SPEECH_RATE_MIN}
            max={SPEECH_RATE_MAX}
            step={SPEECH_RATE_STEP}
            onChange={next => update({ [SETTINGS.speechRate]: next })}
          />

          {'speechSynthesis' in window && (
            <div className="py-3.5 flex items-center justify-between gap-4">
              <p className="text-xs text-ink-600 text-pretty">
                Used by the Listen button on every daily verse.
              </p>
              <button
                type="button"
                onClick={previewSpeechRate}
                aria-pressed={speaking}
                className="btn-secondary !py-2 text-sm shrink-0"
              >
                <Icon name={speaking ? 'stop' : 'volume'} className="w-4 h-4" />
                {speaking ? 'Stop' : 'Preview'}
              </button>
            </div>
          )}

          <Segmented<ViewMode>
            legend="Daily verse view"
            value={settings.viewMode}
            onChange={next => update({ [SETTINGS.viewMode]: next })}
            options={[
              { value: 'TEXT', label: 'Devotional', hint: 'Verse, reflection and prayer' },
              { value: 'IMAGE', label: 'Wallpaper', hint: 'The verse artwork first' },
            ]}
          />
        </Section>
<Section title="Appearance" icon="sparkle">
          <Toggle
            label="Dark mode"
            description="Deeper contrast for reading at night. Applies across the whole site."
            checked={settings.darkMode}
            onChange={next => update({ [SETTINGS.darkMode]: next })}
          />
        </Section>

        {/* Read-only on purpose: these four keys are how the phone configures
            its own notification schedule. The browser has no equivalent alarm,
            so the honest thing is to show the shared state and point at the
            app rather than offer a control that silently does nothing here. */}
        <Section title="Daily reminders" icon="clock">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 text-sm">Daily verse notification</p>
              <p className="text-xs text-ink-600 mt-0.5 text-pretty">
                Delivered by the mobile app
                {settings.notificationsEnabled && settings.notificationHour !== null
                  ? ` at ${formatTime(settings.notificationHour, settings.notificationMinute)}.`
                  : '.'}
              </p>
            </div>
            <span
              className={clsx(
                'shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border',
                settings.notificationsEnabled
                  ? 'bg-gold-50 text-gold-900 border-gold-200'
                  : 'bg-parchment-100 text-ink-600 border-parchment-300',
              )}
            >
              {settings.notificationsEnabled ? 'On' : 'Off'}
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 text-sm">US Strategy reading plan</p>
              <p className="text-xs text-ink-600 mt-0.5 text-pretty">
                An extra scheduled reading alongside your plan.
              </p>
            </div>
            <span
              className={clsx(
                'shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border',
                settings.usStrategyEnabled
                  ? 'bg-gold-50 text-gold-900 border-gold-200'
                  : 'bg-parchment-100 text-ink-600 border-parchment-300',
              )}
            >
              {settings.usStrategyEnabled ? 'On' : 'Off'}
            </span>
          </div>

          <div className="py-3.5">
            <a
              href="https://play.google.com/store/apps/details?id=com.bible.verseoftheday2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-800 hover:underline"
            >
              <Icon name="download" className="w-3.5 h-3.5" />
              Change reminders in the app
              <Icon name="arrowRight" className="w-3 h-3" />
            </a>
          </div>
        </Section>

        <button
          type="button"
          onClick={restoreDefaults}
          className="btn-secondary w-full"
        >
          Restore defaults
        </button>

        <p className="text-xs text-ink-500 mt-4 text-center text-pretty">
          Restore defaults resets every setting on this page to the value the mobile app
          starts with. Your reading progress and saved verses are not affected.
        </p>
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        reason="Sign in to keep your settings in sync with the mobile app."
      />
    </>
  )
}