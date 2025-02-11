// apps/my-app/src/audioUtils.js
// import { loadSample } from '@kid/audiolib'; // will use instrument.loadSample() ?

// interface LoadSampleWithCache {
//   (url: string): boolean;
// }

// export const loadSampleWithCache: LoadSampleWithCache = async (url) => {
//   try {
//     // Try fetching from the network first
//     let isLoaded = await loadSample(url);

//     if (isLoaded) return isLoaded;
//   } catch (error) {
//     // Fallback to cache if network fails or sample is null
//     const cache = await caches.open('my-app-cache-v1');
//     const cachedResponse = await cache.match(url);
//     if (!cachedResponse) throw new Error(`Sample not found in cache: ${url}`);

//     return cachedResponse;
//   }
// };
