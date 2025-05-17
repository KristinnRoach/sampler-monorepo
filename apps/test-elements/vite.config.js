import { defineConfig, searchForWorkspaceRoot } from 'vite';
import path from 'path';
// import { resolve } from 'path';

export default defineConfig({
  // Base path for assets
  // base: './',

  // Configure server
  server: {
    port: 3000,
    open: true,
    // Allow loading files from parent directories
    fs: {
      allow: [
        // Allow the default workspace root
        searchForWorkspaceRoot(process.cwd()),
        // Explicitly allow the packages directory
        path.resolve(__dirname, '../../packages'),
      ],
    },
  },

  // // Configure module resolution for proper workspace package imports
  // resolve: {
  //   // alias: {
  //   //   '@repo/audiolib': resolve(__dirname, '../../packages/audiolib'),
  //   //   '@repo/audio-web-components': resolve(
  //   //     __dirname,
  //   //     '../../packages/audio-web-components'
  //   //   ),
  //   // },
  // },

  // Optimize build
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
