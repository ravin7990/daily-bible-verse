/**
 * App settings, shared by the website and the Android app.
 *
 * Every key below is the *exact* SharedPreferences key the app reads and writes
 * (app/.../data/SettingsManager.kt and BibleRepository.kt). Because
 * `PREFS.APP_SETTINGS` is `'DailyBibleVersePrefs'` — the same SharedPreferences
 * file the app uses — a value written here lands on the phone on the next sync
 * and vice versa, with no translation layer in between.
 *
 * RTDB stores primitives only (`PrefsValue`), so every setting is a string,
 * number or boolean. Nothing in this module may return an object.
 *
 * Kept free of Firebase and of `bibleService` (which imports the Storage SDK)
 * because App.tsx imports this module, and it must stay on the entry path.
 */

import { useEffect, useMemo } from 'react'
import { usePrefs, PREFS } from '@/auth/AuthProvider'
import { readLocalPrefs, type PrefsMap } from '@/utils/localPrefs'

/* ── Prefs keys — do not rename, the phone depends on these ────────────── */
export const SETTINGS = {
  /** BibleRepository.getSelectedVersion() / setSelectedVersion() */
  bibleVersion: 'selectedBibleVersion',
  /** BibleRepository.getSecondaryBibleVersion(); `'NONE'` means "off". */
  secondaryVersion: 'secondaryBibleVersion',
  /** SettingsManager.PREF_TEXT_SIZE_PROGRESS — seekbar 0..20. */
  textSize: 'textSizeProgress',
  /** SettingsManager.PREF_DARK_MODE. */
  darkMode: 'darkModeEnabled',
  /** SettingsManager.selectedViewMode — `'TEXT'` or `'IMAGE'`. */
  viewMode: 'selectedViewMode',
  /** SettingsManager.PREF_SPEECH_RATE — a TTS rate multiplier. */
  speechRate: 'ttsSpeechRate',
  /** SettingsManager.PREF_NOTIFICATION_ENABLED. */
  notifications: 'notificationEnabled',
  /** SettingsManager.PREF_NOTIFICATION_HOUR, 0..23. */
  notificationHour: 'notificationHour',
  /** SettingsManager.PREF_NOTIFICATION_MINUTE, 0..59. */
  notificationMinute: 'notificationMinute',
  /** SettingsManager.PREF_US_STRATEGY_ENABLED. */
  usStrategy: 'usStrategyEnabled',
} as const

export type ViewMode = 'TEXT' | 'IMAGE'

/** Sentinel the app uses for "no parallel translation". */
export const NO_SECONDARY_VERSION = 'NONE'

/** SettingsManager.SEEK_BAR_MAX_PROGRESS. */
export const TEXT_SIZE_MIN = 0
export const TEXT_SIZE_MAX = 20
export const DEFAULT_TEXT_SIZE_PROGRESS = 8
export const DEFAULT_SPEECH_RATE = 0.75
export const DEFAULT_NOTIFICATION_HOUR = 8
export const DEFAULT_NOTIFICATION_MINUTE = 0

/**
 * Speech-rate bounds for the web slider. The app's seekbar range is not
 * visible from here, so these are the Web Speech API's comfortable band,
 * centred on the app's own 0.75 default.
 */
export const SPEECH_RATE_MIN = 0.5
export const SPEECH_RATE_MAX = 1.5
export const SPEECH_RATE_STEP = 0.05

/** SettingsManager.BASE_TEXT_SIZE_SP / MAX_TEXT_SIZE_INCREMENT_SP. */
const BASE_TEXT_SIZE_SP = 16
const MAX_TEXT_SIZE_INCREMENT_SP = 12

/**
 * Reproduce SettingsManager.calculateVerseTextSize, so one `textSizeProgress`
 * value means the same physical size on the phone and on the web.
 */
export function verseTextSizeSp(progress: number): number {
  return BASE_TEXT_SIZE_SP + progress * (MAX_TEXT_SIZE_INCREMENT_SP / TEXT_SIZE_MAX)
}

/** SettingsManager.calculateBodyTextSize. */
export function bodyTextSizeSp(progress: number): number {
  return verseTextSizeSp(progress) * 0.9
}

/**
 * The multiplier applied to the website's own type ramp.
 *
 * Normalised against the app's default, so `textSizeProgress: 8` renders the
 * site's designed sizes untouched and every other value scales from there.
 * The web keeps its designed typography; only the scale moves.
 */
export function textScale(progress: number): number {
  return verseTextSizeSp(progress) / verseTextSizeSp(DEFAULT_TEXT_SIZE_PROGRESS)
}

/* ── Coercion ──────────────────────────────────────────────────────────────
   Prefs arrive from localStorage or RTDB as loosely typed JSON, and a phone
   may have written a value the web never validated. Read defensively and fall
   back to the app's own default rather than rendering NaN. */

function readString(values: PrefsMap, key: string, fallback: string): string {
  const v = values[key]
  return typeof v === 'string' && v.length > 0 ? v : fallback
}

function readNumber(values: PrefsMap, key: string, fallback: number): number {
  const v = values[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function readBoolean(values: PrefsMap, key: string, fallback: boolean): boolean {
  const v = values[key]
  return typeof v === 'boolean' ? v : fallback
}

/** Clamp into a range — guards against a phone writing out-of-range junk. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
/** The values `Restore defaults` writes, matching SettingsManager's defaults. */
export const DEFAULT_SETTINGS: PrefsMap = {
  [SETTINGS.bibleVersion]: 'KJV',
  [SETTINGS.secondaryVersion]: NO_SECONDARY_VERSION,
  [SETTINGS.textSize]: DEFAULT_TEXT_SIZE_PROGRESS,
  // The app defaults to dark; the website is designed light-first, so a
  // visitor who has never set it sees the light theme until they choose.
  [SETTINGS.darkMode]: false,
  [SETTINGS.viewMode]: 'TEXT',
  [SETTINGS.speechRate]: DEFAULT_SPEECH_RATE,
  [SETTINGS.notifications]: false,
  [SETTINGS.notificationHour]: DEFAULT_NOTIFICATION_HOUR,
  [SETTINGS.notificationMinute]: DEFAULT_NOTIFICATION_MINUTE,
  [SETTINGS.usStrategy]: false,
}

/**
 * Push dark mode + text size onto <html>.
 *
 * A plain function rather than an effect only, so it can run both at module
 * load (before React mounts, which stops a dark-theme visitor seeing a white
 * flash) and from the hook (so an incoming phone sync repaints the page).
 */
export function applyDocumentSettings(darkMode: boolean, progress: number): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', darkMode)
  root.style.setProperty('--bvtv-text-scale', textScale(progress).toFixed(3))
}

// Boot-time application: App.tsx imports this module, so the stored theme is
// already on <html> by the time React renders anything.
{
  const stored = readLocalPrefs(PREFS.APP_SETTINGS)
  applyDocumentSettings(
    readBoolean(stored, SETTINGS.darkMode, false),
    clamp(
      Math.round(readNumber(stored, SETTINGS.textSize, DEFAULT_TEXT_SIZE_PROGRESS)),
      TEXT_SIZE_MIN, TEXT_SIZE_MAX,
    ),
  )
}
export interface AppSettings {
  /** Raw prefs map, for anything this module does not model. */
  values: PrefsMap
  /** Write a patch through the sync layer (local + cloud, merged). */
  update: (patch: PrefsMap) => void

  bibleVersion: string
  secondaryVersion: string
  darkMode: boolean
  /** `textSizeProgress`, clamped to the app's seekbar range. */
  textSize: number
  /** Multiplier currently applied to `--bvtv-text-scale`. */
  textScale: number
  /** The app's own sp values for the current text size. */
  verseSizeSp: number
  bodySizeSp: number
  speechRate: number
  viewMode: ViewMode
  notificationsEnabled: boolean
  notificationHour: number
  notificationMinute: number
  usStrategyEnabled: boolean
  /** Reset every key this page owns back to the app's defaults. */
  restoreDefaults: () => void
}

/**
 * Read + write the app settings, applying the two that affect the whole
 * document (dark mode and text size).
 *
 * Works signed out against localStorage and merges with the cloud on sign-in,
 * so a change made on the phone shows up here without a reload.
 */
export function useAppSettings(): AppSettings {
  const [values, setValues] = usePrefs(PREFS.APP_SETTINGS)

  const textSize = clamp(
    Math.round(readNumber(values, SETTINGS.textSize, DEFAULT_TEXT_SIZE_PROGRESS)),
    TEXT_SIZE_MIN,
    TEXT_SIZE_MAX,
  )
  const darkMode = readBoolean(values, SETTINGS.darkMode, false)

  // Repaint <html> whenever either value changes — including when the change
  // arrives from the phone rather than from a control on this page.
  useEffect(() => {
    applyDocumentSettings(darkMode, textSize)
  }, [darkMode, textSize])

  return useMemo<AppSettings>(() => ({
    values,
    update: setValues,
    bibleVersion: readString(values, SETTINGS.bibleVersion, 'KJV'),
    secondaryVersion: readString(values, SETTINGS.secondaryVersion, NO_SECONDARY_VERSION),
    darkMode,
    textSize,
    textScale: textScale(textSize),
    verseSizeSp: verseTextSizeSp(textSize),
    bodySizeSp: bodyTextSizeSp(textSize),
    speechRate: clamp(
      readNumber(values, SETTINGS.speechRate, DEFAULT_SPEECH_RATE),
      SPEECH_RATE_MIN,
      SPEECH_RATE_MAX,
    ),
    viewMode: readString(values, SETTINGS.viewMode, 'TEXT') === 'IMAGE' ? 'IMAGE' : 'TEXT',
    notificationsEnabled: readBoolean(values, SETTINGS.notifications, false),
    notificationHour: clamp(
      Math.round(readNumber(values, SETTINGS.notificationHour, DEFAULT_NOTIFICATION_HOUR)),
      0, 23,
    ),
    notificationMinute: clamp(
      Math.round(readNumber(values, SETTINGS.notificationMinute, DEFAULT_NOTIFICATION_MINUTE)),
      0, 59,
    ),
    usStrategyEnabled: readBoolean(values, SETTINGS.usStrategy, false),
    restoreDefaults: () => setValues({ ...DEFAULT_SETTINGS }),
  }), [values, setValues, darkMode, textSize])
}