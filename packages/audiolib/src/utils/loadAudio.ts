// src/utils/loadAudio.ts

import { getAudioContext } from '@/context/globalAudioContext';
import {
  storeAudioSample,
  getAudioSample,
  hasAudioSample,
} from '@/store/idb/audioStorage';

/**
 * Loads and decodes an audio sample from a URL or file path
 * with IndexedDB caching support
 *
 * @param path - URL or path to the audio file
 * @param options - Loading options
 * @returns Promise resolving to the decoded AudioBuffer
 * @throws Error if loading or decoding fails
 */
export async function loadAudioSample(
  path: string,
  options: {
    useCache?: boolean; // Whether to use IndexedDB cache
    forceReload?: boolean; // Whether to force reload even if cached
    cacheId?: string; // Custom ID for caching (defaults to path)
  } = { useCache: true, forceReload: false }
): Promise<AudioBuffer> {
  const { useCache = true, forceReload = false, cacheId = path } = options;

  try {
    // Check cache first if enabled and not forcing reload
    if (useCache && !forceReload) {
      const cached = await hasAudioSample(cacheId);

      if (cached) {
        console.log(`Loading audio sample from cache: ${cacheId}`);
        const cachedBuffer = await getAudioSample(cacheId);

        if (cachedBuffer) {
          return cachedBuffer;
        }
      }
    }

    const audioContext = getAudioContext();
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch audio file: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    if (useCache) {
      await storeAudioSample(cacheId, path, audioBuffer);
    }

    return audioBuffer;
  } catch (error) {
    console.error('Error loading audio sample:', error);
    throw new Error(
      `Failed to load audio sample from ${path}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Loads multiple audio samples at once
 *
 * @param paths - Array of URLs or paths to audio files
 * @param options - Loading options (same as loadAudioSample)
 * @returns Promise resolving to a Map of paths to AudioBuffers
 */
export async function loadAudioSamples(
  paths: string[],
  options: Parameters<typeof loadAudioSample>[1] = {}
): Promise<Map<string, AudioBuffer>> {
  const samples = new Map<string, AudioBuffer>();

  await Promise.all(
    paths.map(async (path) => {
      try {
        const buffer = await loadAudioSample(path, options);
        samples.set(path, buffer);
      } catch (error) {
        console.warn(`Failed to load sample ${path}:`, error);
      }
    })
  );

  return samples;
}

// simpler version without IndexedDB caching below:

// import { getAudioContext } from '../context/globalAudioContext';

// /**
//  * Loads and decodes an audio sample from a URL or file path
//  *
//  * @param path - URL or path to the audio file
//  * @returns Promise resolving to the decoded AudioBuffer
//  * @throws Error if loading or decoding fails
//  */
// export async function loadAudioSample(path: string): Promise<AudioBuffer> {
//   try {
//     // Get the audio context
//     const audioContext = await getAudioContext();

//     // Fetch the audio file
//     const response = await fetch(path);

//     // Check if the fetch was successful
//     if (!response.ok) {
//       throw new Error(
//         `Failed to fetch audio file: ${response.status} ${response.statusText}`
//       );
//     }

//     // Get the audio data as ArrayBuffer
//     const arrayBuffer = await response.arrayBuffer();

//     // Decode the audio data
//     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

//     return audioBuffer;
//   } catch (error) {
//     console.error('Error loading audio sample:', error);
//     throw new Error(
//       `Failed to load audio sample from ${path}: ${error instanceof Error ? error.message : String(error)}`
//     );
//   }
// }

// /**
//  * Loads multiple audio samples at once
//  *
//  * @param paths - Array of URLs or paths to audio files
//  * @returns Promise resolving to a Map of paths to AudioBuffers
//  */
// export async function loadAudioSamples(
//   paths: string[]
// ): Promise<Map<string, AudioBuffer>> {
//   const samples = new Map<string, AudioBuffer>();

//   await Promise.all(
//     paths.map(async (path) => {
//       try {
//         const buffer = await loadAudioSample(path);
//         samples.set(path, buffer);
//       } catch (error) {
//         console.warn(`Failed to load sample ${path}:`, error);
//       }
//     })
//   );

//   return samples;
// }
