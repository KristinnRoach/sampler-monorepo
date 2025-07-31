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
    port: 3000,
    open: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
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
