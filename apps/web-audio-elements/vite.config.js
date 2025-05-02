import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base path for assets
  base: './',

  // Configure server
  server: {
    port: 3000,
    open: true,
    // Allow loading files from parent directories for proper monorepo setup
    fs: {
      allow: ['..'],
    },
  },

  // Configure module resolution for proper workspace package imports
  resolve: {
    alias: {
      '@repo/audiolib': resolve(__dirname, '../../packages/audiolib'),
      '@repo/audio-web-components': resolve(
        __dirname,
        '../../packages/audio-web-components'
      ),
    },
  },

  // Optimize build
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
