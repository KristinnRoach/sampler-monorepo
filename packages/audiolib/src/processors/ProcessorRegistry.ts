// @store/ProcessorRegistry.ts
import { ensureAudioCtx } from '@/context/globalAudioContext';
import PROCESSORS from '@/processors';

// Create a union type of all valid processor names
export type AudiolibProcessor = keyof typeof PROCESSORS; // ?

// Singleton for AudioWorkletProcessor registration
class ProcessorRegistry {
  private static instance: ProcessorRegistry;
  private registeredProcessors = new Set<string>();
  private blobURLStore: Map<string, string> = new Map(); // move or remove

  private constructor() {}

  static getInstance(): ProcessorRegistry {
    if (!ProcessorRegistry.instance) {
      ProcessorRegistry.instance = new ProcessorRegistry();
    }

    return ProcessorRegistry.instance;
  }

  async registerDefaultProcessors(): Promise<void> {
    Object.keys(PROCESSORS).forEach(async (processorName) => {
      await this.register(processorName as AudiolibProcessor);
    });
  }

  async register(processorName: AudiolibProcessor): Promise<void> {
    // , blobURL: string): Promise<void> {
    const audioContext = await ensureAudioCtx();

    if (this.hasRegistered(processorName)) {
      return;
    }

    const rawSource = PROCESSORS[processorName];
    const blob = new Blob([rawSource], {
      type: 'application/javascript',
    });
    const blobURL = URL.createObjectURL(blob);

    try {
      // Register the processor with the audio worklet
      await audioContext.audioWorklet.addModule(blobURL);

      // Store the blob URL for later cleanup if needed
      this.blobURLStore.set(processorName, blobURL);

      // Mark this processor as registered
      this.registeredProcessors.add(processorName);
    } catch (error) {
      console.error(
        `Failed to register audio worklet processor '${processorName}':`,
        error
      );
      throw error;
    }
  }

  hasRegistered(registryName: string): boolean {
    return this.registeredProcessors.has(registryName);
  }

  getRegisteredProcessors(): Set<string> {
    console.log('getting registered processors:', this.registeredProcessors);
    return this.registeredProcessors;
  }

  // Cleanup method (call when shutting down the audio system)
  dispose() {
    this.blobURLStore.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    this.blobURLStore.clear();
    this.registeredProcessors.clear();
  }
}

export const registry = ProcessorRegistry.getInstance();

// // Define paths to worklet source files (using urls for Vite)
// export const PROCESSORS = {
//   'loop-control-processor': {
//     path: './loop/loop-control-processor.js',
//     pathURL: new URL(
//       'src/processors/loop/loop-control-processor.js',
//       import.meta.url
//     ).toString(),
//   },
//   'random-noise-processor': {
//     path: './noise/random-noise-processor.js',
//     pathURL: new URL(
//       'src/processors//noise/random-noise-processor.js',
//       import.meta.url
//     ).toString(),
//   },
//   'feedback-delay-processor': {
//     path: './delays/feedback-delay-processor.js',
//     pathURL: new URL(
//       'src/processors/delays/feedback-delay-processor.js',
//       import.meta.url
//     ).toString(),
//   },
// } as const;
