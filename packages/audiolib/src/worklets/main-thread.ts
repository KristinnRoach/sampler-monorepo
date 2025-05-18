import { registry } from './worklet-registry';

const paths = [
  // Path that works in development (keep this as the first attempt)
  '/node_modules/@repo/audiolib/dist/processors/processors.js',
  // Relative path for production build
  './processors/processors.js',
  // Other potential paths
  '/processors/processors.js',
  new URL('../dist/processors/processors.js', import.meta.url).href,
];

// Function to try multiple paths to load the audio worklet
export async function initProcessors(context: AudioContext) {
  // Try each path until one works
  let lastError = null;
  for (const path of paths) {
    if (!registry.has(path)) {
      try {
        console.log(`Attempting to load AudioWorklet from: ${path}`);
        await context.audioWorklet.addModule(path);
        registry.add(path);
        console.log('AudioWorklet module loaded successfully from:', path);
        return {
          sucess: true,
          loadedPath: path,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.debug(`Failed to load AudioWorklet from ${path}:`, error);
        lastError = error;
      }
    }
  }

  // If we get here, all paths failed
  throw lastError || new Error('Failed to load AudioWorklet from all paths');
}

// Helper function to get the processor path
export function getProcessorUrl() {
  // Try different paths for development and production
  const paths = [
    // Path from application root (for production build)
    '/processors/processors.js',
    // Path via node_modules (for development)
    '/node_modules/@repo/test/dist/processors/processors.js',
    // Direct path for bundling in library
    new URL('../dist/processors/processors.js', import.meta.url).href,
  ];

  return paths[0]; // Start with the first path
}
