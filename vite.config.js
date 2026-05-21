import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // Automatically update the service worker in the background
      registerType: 'autoUpdate',

      // Assets to pre-cache alongside the built JS/CSS
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png'],

      // ── Web App Manifest ────────────────────────────────────────────────────
      manifest: {
        name: 'GreenGuild AI',
        short_name: 'GreenGuild',
        description:
          'A community-driven, AI-powered platform empowering smallholder farmers through collaborative intelligence and offline-first diagnostics.',
        theme_color: '#1b4332',
        background_color: '#1b4332',
        display: 'standalone',       // no browser chrome — looks like a native app
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable', // works on Android adaptive icons
          },
        ],
      },

      // ── Workbox offline caching strategy ───────────────────────────────────
      workbox: {
        // Pre-cache all built assets (JS, CSS, HTML, images, fonts)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        runtimeCaching: [
          // Google Fonts — cache for 1 year
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Unsplash images — cache for 7 days
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API calls — network first, fall back to cache
          {
            urlPattern: /^https:\/\/api\.greenguild\.ai\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
