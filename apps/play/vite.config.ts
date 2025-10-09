import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import solidPlugin from 'vite-plugin-solid';
import solidSvg from 'vite-plugin-solid-svg';

export default defineConfig({
  base: './',

  plugins: [
    solidPlugin(),
    solidSvg(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically update the service worker
      includeAssets: [
        'icons/favicon.svg',
        'icons/favicon.ico',
        'icons/apple-touch-icon-180x180.png',
      ], // assets to cache
      manifest: {
        name: 'Hljóð-Smali',
        short_name: 'HljóðSmali',
        description: 'Sampler Instrument',
        theme_color: '#666',
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
          },
          {
            src: 'icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/favicon_io/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/favicon_io/android-chrome-512x512.png',
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
    hmr: {
      overlay: false,
    },
    port: 3000,
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

          // if (id.includes('packages/audio-components')) {
          //   if (id.includes('solidjs')) {
          //     return 'audio-components/solidjs';
          //   } else {
          //     return 'audio-components';
          //   }
          // }
        },
      },
    },
  },

  // Resolve workspace dependencies
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});

// '@repo/audio-components': resolve(
//   __dirname,
//   '../../packages/audio-components'
// ),
