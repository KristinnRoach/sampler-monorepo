import { defineConfig } from 'vite';
import { resolve } from 'path';
// import dts from 'vite-plugin-dts';
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',

  plugins: [
    // Not yet
    // dts(),
    // VitePWA({ registerType: 'autoUpdate' })
  ],

  server: {
    port: 3001,
    open: true,
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
