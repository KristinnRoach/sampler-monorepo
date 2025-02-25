import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],

  optimizeDeps: {
    include: ['@repo/audio-components'],
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
