// @store/ProcessorRegistry.ts
import { getAudioContext } from '@/context/globalAudioContext';
import { getBlobURL } from '@/processors/registry-utils';

// Define paths to worklet source files
export const PROCESSORS = {
  'loop-control-processor': {
    path: './loop/loop-control-processor.js',
  },
  // Add other processors here
} as const;

// Create a union type of all valid processor names
export type VerifiedProcessor = keyof typeof PROCESSORS; // TODO: Rethink

// Singleton for AudioWorkletProcessor registration

class ProcessorRegistry {
  private static instance: ProcessorRegistry;
  private registeredProcessors = new Set<string>();
  private blobURLs: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): ProcessorRegistry {
    if (!ProcessorRegistry.instance) {
      ProcessorRegistry.instance = new ProcessorRegistry();
    }

    return ProcessorRegistry.instance;
  }

  async register(processorName: VerifiedProcessor): Promise<void> {
    // , blobURL: string): Promise<void> {
    const audioContext = await getAudioContext();

    const blobURL = await getBlobURL(
      PROCESSORS[processorName].path,
      true,
      'application/javascript'
    );

    console.log('blobURL', blobURL);

    if (!audioContext) {
      console.error('Audio context is not initialized');
      return;
    }

    if (this.hasRegistered(processorName)) {
      return;
    }

    try {
      // Register the processor with the audio worklet
      await audioContext.audioWorklet.addModule(blobURL);

      // Store the blob URL for later cleanup if needed
      this.blobURLs.set(processorName, blobURL);

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
    this.blobURLs.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    this.blobURLs.clear();
    this.registeredProcessors.clear();
  }
}

export const registry = ProcessorRegistry.getInstance();
