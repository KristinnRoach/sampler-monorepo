import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'audiolib',
      fileName: 'index',
    },
    minify: false, // Disable minification for debugging
    rollupOptions: {
      external: [], // Add any external dependencies here if needed
      output: {
        globals: {}, // Define globals for UMD builds if needed
        format: 'es',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // server configuration to serve test files
  server: {
    fs: {
      // Allow serving files from one level up
      allow: ['..'],
    },
  },
  // Configured to serve test HTML files
  publicDir: 'public',
});
