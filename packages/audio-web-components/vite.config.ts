import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AudioWebComponents',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['@repo/audiolib'],
      output: {
        globals: {
          '@repo/audiolib': 'audiolib'
        }
      }
    }
  },
  plugins: [
    dts({
      include: ['src'],
      exclude: ['**/*.test.ts', '**/__tests__/**'],
      outDir: 'dist',
      rollupTypes: true,
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
