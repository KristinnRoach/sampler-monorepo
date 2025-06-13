// main-thread.ts
import { registry } from './worklet-registry';

let processorsInitialized = false;

// Static paths to try first
const staticPaths = [
  // Path that works in development (first attempt)
  '/node_modules/@repo/audiolib/dist/processors/processors.js',
  // Relative path for production build
  './processors/processors.js',
  // Other potential paths
  '/processors/processors.js',
  /* @vite-ignore */
  new URL('../dist/processors/processors.js', import.meta.url).href,
];

// Helper function to create a Blob URL from the processor code
async function getBlobUrl(): Promise<string> {
  try {
    // Try to fetch the processors code
    const possibleFetchUrls = [
      // Try the URL that worked in development first
      /* @vite-ignore */
      new URL('../dist/processors/processors.js', import.meta.url).href,
      // Add other potential URLs to fetch from
      '/processors/processors.js',
      './processors/processors.js',
    ];

    let processorCode = null;
    let lastFetchError = null;

    // Try each fetch URL until one works
    for (const fetchUrl of possibleFetchUrls) {
      try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        processorCode = await response.text();
        console.info(`Fetched processor code from: ${fetchUrl}`);
        break;
      } catch (fetchError) {
        console.debug(`Failed to fetch from ${fetchUrl}:`, fetchError);
        lastFetchError = fetchError;
      }
    }

    // If we couldn't fetch the code, throw an error
    if (!processorCode) {
      throw (
        lastFetchError ||
        new Error("Couldn't fetch processor code from any URL")
      );
    }

    // Create a Blob URL from the code
    const blob = new Blob([processorCode], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    return blobUrl;
  } catch (error) {
    console.error('Failed to create Blob URL:', error);
    throw error;
  }
}

// Function to try multiple paths to load the audio worklet
export async function initProcessors(context: AudioContext) {
  if (processorsInitialized) {
    console.info('AudioWorklet processors already initialized, skipping');
    return {
      success: true,
      loadedPath: 'already-initialized',
      timestamp: new Date().toISOString(),
    };
  }

  // First try all static paths
  let lastError = null;

  for (const path of staticPaths) {
    if (!registry.has(path)) {
      try {
        await context.audioWorklet.addModule(path);
        registry.add(path);
        processorsInitialized = true;

        console.info('AudioWorklet module loaded successfully from:', path);
        return {
          success: true,
          loadedPath: path,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error;
      }
    }
  }

  // If all static paths failed, try the Blob URL approach as a last resort
  try {
    const blobUrl = await getBlobUrl();

    if (!registry.has(blobUrl)) {
      await context.audioWorklet.addModule(blobUrl);
      registry.add(blobUrl);

      processorsInitialized = true;
      console.info('AudioWorklet module loaded from Blob URL');
    }

    // Clean up the the loaded blob URL
    URL.revokeObjectURL(blobUrl);

    return {
      success: true,
      loadedPath: 'blob-url',
      timestamp: new Date().toISOString(),
    };
  } catch (blobError) {
    console.error('Failed to load AudioWorklet from Blob URL:', blobError);
    // Combine all errors
    lastError = new Error(
      `Failed to load AudioWorklet from all paths. Last error: ${
        (lastError instanceof Error && lastError.message) || 'Unknown error'
      }. Blob URL error: ${
        typeof blobError === 'object' && blobError && 'message' in blobError
          ? (blobError as { message: string }).message
          : String(blobError)
      }`
    );
  }

  // If we get here, all paths failed including the Blob URL
  throw lastError || new Error('Failed to load AudioWorklet from all paths');
}

// Helper function to get the processor path (used elsewhere if needed)
export function getProcessorUrl() {
  // Try different paths for development and production
  return staticPaths[0]; // Start with the first path
}
