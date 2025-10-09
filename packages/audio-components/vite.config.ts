import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';
import react from '@vitejs/plugin-react';

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
        // React
        'frameworks/react/reactEntry': resolve(
          __dirname,
          'src/frameworks/react/reactEntry.ts'
        ),
      },
      name: 'AudioWebComponents',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@repo/audiolib',
        'solid-js',
        'solid-js/web',
        'react',
        'react-dom',
      ],
      output: {
        globals: {
          '@repo/audiolib': 'audiolib',
          'solid-js': 'solid',
          'solid-js/web': 'solidWeb',
          react: 'React',
          'react-dom': 'ReactDOM',
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
    react(),
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
    // DTS for vanilla entry
    dts({
      tsconfigPath: 'tsconfig.json',
      include: ['src/**/*'],
      exclude: [
        '**/*.test.ts',
        '**/__tests__/**',
        'src/frameworks/react/**/*',
        'src/frameworks/solidjs/**/*',
      ],
      outDir: 'dist',
      entryRoot: 'src',
      rollupTypes: false,
    }),
    // DTS for React entry
    dts({
      tsconfigPath: 'tsconfig.react.json',
      include: ['src/frameworks/react/**/*'],
      outDir: 'dist/frameworks/react',
      entryRoot: 'src/frameworks/react',
      rollupTypes: false,
    }),
    // DTS for SolidJS entry
    dts({
      tsconfigPath: 'tsconfig.solidjs.json',
      include: ['src/frameworks/solidjs/**/*'],
      outDir: 'dist/frameworks/solidjs',
      entryRoot: 'src/frameworks/solidjs',
      rollupTypes: false,
    }),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
