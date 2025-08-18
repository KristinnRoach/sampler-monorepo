import { defineConfig } from 'vite';
import { resolve } from 'path';
// import dts from 'vite-plugin-dts';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',

  plugins: [
    VitePWA({
      registerType: 'autoUpdate', // Automatically update the service worker
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'], // assets to cache
      manifest: {
        name: 'Hljóð-Smali',
        short_name: 'HljóðSmali',
        description: 'Sampler Instrument',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        enabled: false, // enable PWA in dev for testing
      },
    }),
  ],

  server: {
    port: 3002,
    open: true,
    host: true, // Allow access from network
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('gsap')) return 'vendor-gsap';
            if (id.includes('dexie')) return 'vendor-dexie';
            return 'vendor';
          }
          if (id.includes('packages/audiolib')) return 'audiolib';
          if (id.includes('packages/audio-components'))
            return 'audio-components';
        },
      },
    },
  },

  // Resolve workspace dependencies
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@repo/audio-components': resolve(
        __dirname,
        '../../packages/audio-components/dist/index.js'
      ),
    },
  },
});
