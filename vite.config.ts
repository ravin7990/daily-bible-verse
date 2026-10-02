import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'

/**
 * Public base path.
 *
 * GitHub Pages serves a project site from `/<repo>/`, so the default keeps that
 * prefix. Set `VITE_BASE_PATH=/` once a custom domain is live, which is also
 * what stops every internal URL from carrying a stale `/daily-bible-verse`
 * prefix onto the new host.
 */
const BASE_PATH = process.env.VITE_BASE_PATH || '/daily-bible-verse/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'sitemap.xml', 'llms.txt', 'icons/*'],
      manifest: {
        name: 'Bible Verse of the Day',
        short_name: 'BibleVerse',
        description: 'Daily Bible verses, reflections, stories, and prayers.',
        theme_color: '#1f2939',
        background_color: '#fdfbf7',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        // Keep the precache lean. The multi-megabyte Bible translations are
        // fetched on demand and cached by the runtime rules below; precaching
        // them would bloat the install and slow the service worker startup.
        globIgnores: [
          '**/bibles/**',
          '**/stats.html',
          '**/stories.json',
          '**/prayer.json',
          '**/prayers_full_merged.json',
          '**/jesus_teachings.json',
        ],
        // Fonts stay precached (124 kB total) since they are on the critical
        // rendering path and are preloaded in index.html.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // Bible manifests and per-book chapter files. Immutable for a given
            // deploy, so CacheFirst makes repeat visits instant and enables
            // offline reading after the first book is opened.
            urlPattern: /\/bibles\/[A-Z0-9]+\/(manifest|\d+)\.json/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bible-chapters-cache',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /.*\/bibles\/.*\.json/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bible-versions-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            // Firestore responses are cached in the service worker's Cache
            // Storage, which is shared by every visitor of the browser profile
            // and readable by any script running on this origin.
            //
            // That is safe today only because the web reads exclusively public
            // collections (stories, prayers, teachings, verse images). The moment
            // a private or per-user query is fetched on the client, it lands in
            // this cache and becomes readable by the next person to use the
            // device. The allowlist below is deliberately narrow so that adding
            // a private collection fails closed rather than silently leaking.
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/v1\/projects\/[^/]+\/databases\/\(default\)\/documents\/(stories|prayers|jesus_teachings|verse_images|community_creations)\b/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'public-content-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 } },
          },
        ],
      },
    }),
    visualizer({ open: false, filename: 'dist/stats.html' }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('react-router')) return 'router'
          if (id.includes('react-helmet')) return 'helmet'

          // NOTE: Firebase is deliberately NOT forced into a manual chunk.
          // Doing so made Rollup hoist the whole SDK (~590 kB) into the entry's
          // static graph, which Vite then emitted as a <link modulepreload> —
          // so every signed-out visitor downloaded it before first paint.
          // Leaving it to the default splitting keeps auth and RTDB behind the
          // dynamic imports in AuthProvider, where they belong. Firebase is
          // only ever loaded after sign-in or on a page that needs it.
        },
      },
    },
  },
})
