import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],

  target: 'esnext',
  commonjsOptions: {
    transformMixedEsModules: true,
  },

  optimizeDeps: {
    include: ['@repo/audiolib'],
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
