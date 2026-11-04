import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icons/*.png', 'favicon.png'],
    manifest: {
      name: 'Afroscholars',
      short_name: 'Afroscholars',
      description: 'Plataforma de bolsas de estudo para estudantes africanos',
      theme_color: '#059669',
      background_color: '#059669',
      display: 'standalone',
      lang: 'pt',
      id: '/',
      start_url: '/',
      scope: '/',
      shortcuts: [
        { name: 'Bolsas', url: '/bolsas' },
        { name: 'Cursos', url: '/cursos' },
        { name: 'Comunidades', url: '/comunidades' },
      ],
      icons: [
        {
          src: 'icons/pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png',
        },
        {
          src: 'icons/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'icons/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: 'icons/mask-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],

    },
    workbox: {
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      // O service-worker.js é tratado à parte: sem o importar, as notificações push nunca aparecem.
      globIgnores: ['service-worker.js'],
      importScripts: ['service-worker.js'],
      cleanupOutdatedCaches: true,
      navigateFallback: 'index.html',
      // Estes caminhos são da API: respondidos com o index.html, o login com Google nunca lá chegaria.
      navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
      // As respostas da API não ficam guardadas: são dados privados, e o aparelho pode ter outro utilizador.
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-fonts',
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    
  },
  build:{
    chunkSizeWarningLimit: 2000,
  }
})
