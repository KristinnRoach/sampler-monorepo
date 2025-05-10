// utils.ts - Utility functions for the package

// Helper function to get the processor path
export function getProcessorUrl() {
  // Try different paths for development and production
  const paths = [
    // Path from application root (for production build)
    '/processors/processors.js',
    // Path via node_modules (for development)
    '/node_modules/@repo/test/public/processors/processors.js',
    // Direct path for bundling in library
    new URL('../public/processors/processors.js', import.meta.url).href
  ];
  
  return paths[0]; // Start with the first path
}

// Function to try multiple paths to load the audio worklet
export async function loadAudioWorkletWithFallback(context: AudioContext) {
  const paths = [
    // Path from application root (for production build)
    '/processors/processors.js',
    // Path via node_modules (for development)
    '/node_modules/@repo/test/public/processors/processors.js',
    // Absolute path if accessed from package
    new URL('../public/processors/processors.js', import.meta.url).href
  ];
  
  // Try each path until one works
  let lastError = null;
  for (const path of paths) {
    try {
      await context.audioWorklet.addModule(path);
      console.log('AudioWorklet module loaded successfully from:', path);
      return; // Success!
    } catch (error) {
      console.warn(`Failed to load AudioWorklet from ${path}:`, error);
      lastError = error;
    }
  }
  
  // If we get here, all paths failed
  throw lastError || new Error('Failed to load AudioWorklet from all paths');
}
