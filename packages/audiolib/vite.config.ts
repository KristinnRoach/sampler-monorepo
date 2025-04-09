import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  base: './', // For fetching assets!
  plugins: [
    dts({
      include: ['src'],
      exclude: ['**/*.test.ts', '**/__tests__/**'], // todo: ensure compatibility with tsconfig
      outDir: 'dist',
      rollupTypes: true,
    }),
  ],

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@repo/audiolib',
      formats: ['es', 'cjs'], // todo: add 'cjs', 'umd' ??
      fileName: 'index',
    },

    // minify: false, // Disable minification for debugging
    // rollupOptions: {
    //   external: [], // Add any external dependencies here if needed
    //   output: {
    //     globals: {}, // Define globals for UMD builds if needed
    //     format: 'es',
    //   },
    // },
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
