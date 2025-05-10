// audioworklet-plugin.js
import { resolve } from 'path';
import { build } from 'vite';

export default function audioWorkletPlugin() {
  return {
    name: 'vite-audioworklet-plugin',

    // Build processors during dev server start and production build
    async buildStart() {
      console.log('Building AudioWorklet processors...');

      // Trigger separate build for processor code
      await build({
        configFile: false,
        build: {
          lib: {
            entry: resolve(
              __dirname,
              'src/test-plugin/audio/processors/index.ts'
            ),
            formats: ['es'],
            fileName: 'processors',
          },
          outDir: 'public/processors',
          emptyOutDir: true,
        },
        resolve: {
          // Add any special resolvers if needed
        },
      });
    },
  };
}
