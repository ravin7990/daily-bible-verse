import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Ink: deep navy, the primary brand + text color ──────────────
           Chosen for AAA contrast on parchment/white surfaces.            */
        ink: {
          50:  '#f4f6f9',
          100: '#e6eaf0',
          200: '#cbd3e0',
          300: '#a3b0c6',
          400: '#74869f',
          500: '#526580',
          600: '#3d4d66',
          700: '#2f3c52',
          800: '#1f2939',
          900: '#16202f',
          950: '#0d1523',
        },

        /* ── Parchment: warm neutral page surface ────────────────────── */
        parchment: {
          50:  '#fdfbf7',
          100: '#faf6ef',
          200: '#f3ece0',
          300: '#e8ddcb',
        },

        /* ── Gold: the single accent. 600+ is AA-safe for text. ──────── */
        gold: {
          50:  '#fdf8ed',
          100: '#f9edcf',
          200: '#f2d99c',
          300: '#e8c062',
          400: '#dca63c',
          500: '#c98a26',
          600: '#b06d1d',
          700: '#91531c',
          800: '#77431f',
          900: '#63391e',
        },

        /* Back-compat alias: older pages use `sacred-*`. Same ramp as ink
           so the whole codebase recolors at once without touching 7 files. */
        sacred: {
          50:  '#f4f6f9',
          100: '#e6eaf0',
          200: '#cbd3e0',
          300: '#a3b0c6',
          400: '#74869f',
          500: '#526580',
          600: '#3d4d66',
          700: '#2f3c52',
          800: '#1f2939',
          900: '#16202f',
          950: '#0d1523',
        },
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
