import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'frameworks/solidjs/solidjsEntry': resolve(
          __dirname,
          'src/frameworks/solidjs/solidjsEntry.ts'
        ),
      },
      name: 'AudioWebComponentsSolid',
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
      },
    },
    // Don't output CSS for framework builds, it's already in vanilla
    cssCodeSplit: false,
    emptyOutDir: false, // Don't clear dist since vanilla build already ran
  },
  plugins: [
    solidPlugin(),
    // DTS for SolidJS entry
    dts({
      tsconfigPath: 'tsconfig.solid.json',
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
