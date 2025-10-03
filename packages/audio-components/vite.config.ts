import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  build: {
    lib: {
      entry: {
        // Vanilla
        index: resolve(__dirname, 'src/index.ts'),
        // SolidJS
        'frameworks/solidjs/solidjsEntry': resolve(
          __dirname,
          'src/frameworks/solidjs/solidjsEntry.ts'
        ),
      },
      name: 'AudioWebComponents',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@repo/audiolib', 'solid-js', 'solid-js/web'],
      output: {
        globals: {
          '@repo/audiolib': 'audiolib',
          'solid-js': 'solid',
          'solid-js/web': 'solidWeb',
        },
        // Ensure CSS is extracted to a separate file
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'audio-components.css';
          }
          return assetInfo.name || 'assets/[name].[ext]';
        },
      },
    },
    // Ensure CSS is extracted
    cssCodeSplit: false,
  },
  plugins: [
    solidPlugin(),
    // SEPARATE DTS INSTANCES FOR EACH ENTRY
    // dts({
    //   include: ['src/index.ts', 'src/elements/**/*', 'src/shared/**/*'],
    //   exclude: ['**/*.test.ts', '**/__tests__/**', 'src/frameworks/**'],
    //   outDir: 'dist',
    //   entryRoot: 'src',
    //   rollupTypes: true,
    // }),
    // dts({
    //   include: ['src/frameworks/solidjs/**/*'],
    //   exclude: ['**/*.test.ts', '**/__tests__/**'],
    //   outDir: 'dist',
    //   entryRoot: 'src',
    //   rollupTypes: true,
    // }),

    // Single DTS instance with proper configuration
    dts({
      include: ['src/**/*'],
      exclude: [
        '**/*.test.ts',
        '**/__tests__/**',
        // Exclude problematic files that cause build issues
        'src/shared/utils/icons/**/*',
        'src/elements/controls/envelope/env-playheads.ts',
        'src/elements/controls/envelope/EnvelopeSVG.ts',
        'src/elements/primitives/createSVGButton.ts',
      ],
      outDir: 'dist',
      entryRoot: 'src',
      rollupTypes: false, // Keep individual files for better IntelliSense
    }),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
