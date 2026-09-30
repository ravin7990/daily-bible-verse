import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/daily-bible-verse/',
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
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'firestore-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 } },
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
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('react-router')) return 'router'
          if (id.includes('react-helmet')) return 'helmet'
        },
      },
    },
  },
})
