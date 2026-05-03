import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg'],
      prompt: true,
      manifest: {
        name: 'Nalewkarz Master',
        short_name: 'Nalewki',
        description: 'Rzemieślnicze receptury nalewek – kalkulator i zarządzanie recepturami',
        theme_color: '#7c3aed',
        background_color: '#0f0d14',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,jpg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'firebase-auth' },
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'firestore' },
          },
          {
            urlPattern: /^https:\/\/www\.nalewki\.ebra\.pl/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
