import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      name: 'AudioWebComponents',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@repo/audiolib'],
      output: {
        globals: {
          '@repo/audiolib': 'audiolib',
        },
        // Ensure CSS is extracted to a separate file
        assetFileNames: (assetInfo) => {
          const assetName = assetInfo.names?.[0] || assetInfo.name;
          if (assetName?.endsWith('.css')) {
            return 'audio-components.css';
          }
          return assetName || 'assets/[name].[ext]';
        },
      },
    },
    // Ensure CSS is extracted
    cssCodeSplit: false,
  },
  plugins: [
    // DTS for vanilla entry
    dts({
      tsconfigPath: 'tsconfig.json',
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
