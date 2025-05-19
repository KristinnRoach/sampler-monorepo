import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';

export default defineConfig({
  base: './',
  plugins: [
    dts({
      include: ['src'],
      exclude: ['**/*.test.ts', '**/__tests__/**', '**/test-setup.ts'],
      outDir: 'dist',
      rollupTypes: true,
    }),
  ],

  build: {
    outDir: 'dist',
    emptyOutDir: false, // prevent worklets being erased
    assetsInlineLimit: 0, // Prevent inlining (possibly not needed when using build-processors.js)

    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@repo/audiolib',
      formats: ['es'],
      fileName: 'index', // skoða
    },
    rollupOptions: {
      external: [/test-setup\.ts$/], // Exclude test setup from build
    },
    // output: { globals: {}, }, // skoða
  },
  resolve: {
    extensions: ['.js', '.ts'], // TOdo: henda
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // server configuration to serve html test files
  // server: {
  //   fs: {
  //     // Allow serving files from one level up
  //     allow: ['..', './dist'],
  //   },
  // },
  // Configured to serve test HTML files
  // publicDir: 'public',
});
