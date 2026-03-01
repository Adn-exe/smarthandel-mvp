import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
      tailwindcss(),
      // PWA — Service Worker + Manifest
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['icons/icon.svg', 'icons/icon-192x192.png', 'icons/icon-512x512.png', 'images/**/*'],
        manifest: {
          id: '/?v=1',
          name: 'SmartHandel — Din Smarteste Handleliste',
          short_name: 'SmartHandel',
          description: 'Prissammenligning og ruteplanlegger for dagligvarer.',
          theme_color: '#E53935',
          background_color: '#F9FAFB',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone'],
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          categories: ['shopping', 'food'],
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icons/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          // Precache the app shell
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // Runtime caching for external resources
          runtimeCaching: [
            {
              // Google Fonts stylesheets
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
              },
            },
            {
              // Google Fonts webfonts
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // OpenStreetMap tiles
              urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'osm-tiles',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // API calls — try network first, fall back to cached
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 }, // 1 hour
                networkTimeoutSeconds: 10,
              },
            },
            {
              // Product images from Kassal or CDN
              urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|webp|gif)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'external-images',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: true, // Force enabled for debugging visibility issue
        },
      }),
      // Generate bundle analysis in production or when explicitly requested
      visualizer({
        open: false,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
      // Gzip and Brotli compression for static assets
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
    ],
    server: {
      port: parseInt(env.PORT || '5173'),
    },
    build: {
      outDir: 'dist',
      sourcemap: isProd, // Enable sourcemaps for production debugging
      minify: 'esbuild',
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          // Manual chunks for better caching and smaller entry point
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-utils': ['lucide-react', '@tanstack/react-query'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
  }
})
