import { defineConfig } from 'vitest/config';

// Todo: try the commented out config below

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
    testTimeout: 10000, // Increased timeout for tests
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
