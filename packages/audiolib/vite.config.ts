import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';

export default defineConfig({
  base: './', // For fetching assets!
  plugins: [
    dts({
      include: ['src'],
      exclude: ['**/*.test.ts', '**/__tests__/**', '**/test-setup.ts'], // Added test-setup.ts
      outDir: 'dist',
      rollupTypes: true,
    }),
  ],

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@repo/audiolib',
      formats: ['es'], // , 'cjs'], // todo: add 'cjs', 'umd' ??
      fileName: 'index', // skoða Vite docs for fileName, þarf að passa við package.json
      // fileName: (format, entryName) => `my-lib-${entryName}.${format}.js`,
      // fileName: (format) => `audiolib.${format}.js`,
    },
    rollupOptions: {
      external: [/test-setup\.ts$/], // Exclude test setup from build
    },
  },
  resolve: {
    extensions: ['.js', '.ts'], // TOdo: henda
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // server configuration to serve html test files
  server: {
    fs: {
      // Allow serving files from one level up
      allow: ['..'],
    },
  },
  // Configured to serve test HTML files
  publicDir: 'public',
});
