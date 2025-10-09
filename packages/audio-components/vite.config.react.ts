import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'frameworks/react/reactEntry': resolve(
          __dirname,
          'src/frameworks/react/reactEntry.ts'
        ),
      },
      name: 'AudioWebComponentsReact',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@repo/audiolib', 'react', 'react-dom'],
      output: {
        globals: {
          '@repo/audiolib': 'audiolib',
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    // Don't output CSS for framework builds, it's already in vanilla
    cssCodeSplit: false,
    emptyOutDir: false, // Don't clear dist since vanilla build already ran
  },
  plugins: [
    react(),
    // DTS for React entry
    dts({
      tsconfigPath: 'tsconfig.react.json',
      outDir: 'dist',
      entryRoot: 'src',
      rollupTypes: false,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
