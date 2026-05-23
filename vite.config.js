import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // Use our custom sw.js so we can add push notification handlers
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',

      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png'],

      // ── Web App Manifest ────────────────────────────────────────────────────
      manifest: {
        name: 'GreenGuild AI',
        short_name: 'GreenGuild',
        description:
          'A community-driven, AI-powered platform empowering smallholder farmers through collaborative intelligence and offline-first diagnostics.',
        theme_color: '#1b4332',
        background_color: '#1b4332',
        display: 'standalone',
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
            purpose: 'any maskable',
          },
        ],
      },

      // ── injectManifest options ──────────────────────────────────────────────
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
    }),
  ],
});
