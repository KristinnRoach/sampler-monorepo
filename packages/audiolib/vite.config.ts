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
    minify: false, // Disable minification for debugging // TODO: hardcode the processor names in GrainSamplerWorklet class ?

    rollupOptions: {
      external: [], // Add any external dependencies here if needed
      output: {
        globals: {}, // Define globals for UMD builds if needed
        // manualChunks: undefined, // Disable automatic chunk splitting ??
        // preserveModules: true, // Preserves module structure
        format: 'es',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
    },
  },
});
