import type { Config } from 'tailwindcss'

/**
 * Every colour is expressed as `rgb(var(--token) / <alpha-value>)`, with the
 * channel triplets themselves living in index.css.
 *
 * The reason is dark mode: `darkMode: 'class'` only switches the `dark` class
 * on <html>, it cannot rewrite the ~40 components that already use `ink-*` /
 * `parchment-*` / `gold-*`. Pointing those classes at CSS variables means the
 * whole palette re-points from one `:root` block plus one `.dark` block, and
 * `<alpha-value>` keeps `bg-ink-800/90` and friends compositing as before.
 */
const channel = (token: string) => `rgb(var(--${token}) / <alpha-value>)`

const inkRamp = {
  50:  channel('ink-50'),
  100: channel('ink-100'),
  200: channel('ink-200'),
  300: channel('ink-300'),
  400: channel('ink-400'),
  500: channel('ink-500'),
  600: channel('ink-600'),
  700: channel('ink-700'),
  800: channel('ink-800'),
  900: channel('ink-900'),
  950: channel('ink-950'),
}

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Ink: deep navy, the primary brand + text color ──────────────
           Chosen for AAA contrast on parchment/white surfaces.            */
        ink: inkRamp,

        /* ── Parchment: warm neutral page surface ────────────────────── */
        parchment: {
          50:  channel('parchment-50'),
          100: channel('parchment-100'),
          200: channel('parchment-200'),
          300: channel('parchment-300'),
        },

        /* ── Gold: the single accent. 600+ is AA-safe for text. ──────── */
        gold: {
          50:  channel('gold-50'),
          100: channel('gold-100'),
          200: channel('gold-200'),
          300: channel('gold-300'),
          400: channel('gold-400'),
          500: channel('gold-500'),
          600: channel('gold-600'),
          700: channel('gold-700'),
          800: channel('gold-800'),
          900: channel('gold-900'),
        },

        /* Back-compat alias: older pages use `sacred-*`. Same ramp as ink
           so the whole codebase recolors at once without touching 7 files. */
        sacred: inkRamp,
      },

      fontFamily: {
        /* Self-hosted variable fonts — no Google Fonts round trip. */
        serif: ['"Lora Variable"', 'Georgia', 'Cambria', 'serif'],
        sans:  ['"Inter Variable"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },

      maxWidth: {
        prose: '68ch',
        reading: '46rem',
      },

      boxShadow: {
        soft: '0 1px 2px rgba(22,32,47,0.04), 0 4px 16px rgba(22,32,47,0.06)',
        lift: '0 2px 4px rgba(22,32,47,0.04), 0 12px 32px rgba(22,32,47,0.10)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },

      letterSpacing: {
        eyebrow: '0.14em',
      },

      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
