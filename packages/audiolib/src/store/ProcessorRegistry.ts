// @store/ProcessorRegistry.ts
import { getAudioContext } from '@/context/globalAudioContext';

// Singleton for AudioWorkletProcessor registration

// Define paths to worklet source files
export const PROCESSOR_PATHS = {
  'loop-processor': '../processors/loop/loop-processor.js',
} as const;

// Import worklet sources via bundler-specific methods
export async function getProcessorSource(
  processorName: keyof typeof PROCESSOR_PATHS
): Promise<string> {
  try {
    const path = PROCESSOR_PATHS[processorName];

    // For Vite specifically
    const module = await import(
      /* @vite-ignore */
      `${path}?raw`
    );

    return module.default;
  } catch (error) {
    console.error(
      `Error loading processor source for ${processorName}:`,
      error
    );
    throw error;
  }
}

// Helper to create blob URLs from processor source
export function createBlobURL(
  source: string,
  type: string = 'application/javascript'
): string {
  const blob = new Blob([source], { type });
  return URL.createObjectURL(blob);
}

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

  async register(processorName: string, blobURL: string): Promise<void> {
    const audioContext = await getAudioContext();

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
