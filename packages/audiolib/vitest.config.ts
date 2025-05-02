import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Todo: try the commented out config below

export default defineConfig({
  test: {
    environment: 'jsdom', // Creates an isolated test environment
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
    testTimeout: 10000,
    setupFiles: ['src/utils/test-setup.ts'],
    // Mocks for web audio api - should only exist in the test environment!
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});

// import { fileURLToPath, URL } from 'node:url';
// import { defineConfig } from 'vitest/config';

// export default defineConfig({
//   test: {
//     browser: {
//       enabled: true,
//       headless: true,
//       name: 'chrome', // browser name is required
//     },
//     // logHeapUsage: true,
//     reporters: 'default',
//     benchmark: {
//       include: ['**/*.bench.{js,ts}'],
//     },
//   },
//   resolve: {
//     alias: {
//       '@': fileURLToPath(new URL('./src', import.meta.url)),
//       '@test': fileURLToPath(new URL('./test', import.meta.url)),
//     },
//   },
// });
