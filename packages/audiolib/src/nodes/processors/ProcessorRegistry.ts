// @store/ProcessorRegistry.ts
import { ensureAudioCtx } from '@/context/globalAudioContext';
import PROCESSORS from '.';

// Union type of processor names that have been predefined by audiolib
export type AudiolibProcessor = keyof typeof PROCESSORS;
export type ProcessorName = AudiolibProcessor | string;

type registryOptions = {
  processorName: ProcessorName;
  rawSource?: string; // raw source code for the processor if not predefined
};

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
      await this.register({ processorName });
    });
  }

  async register(options: registryOptions): Promise<string | null> {
    // , blobURL: string): Promise<void> {
    const audioContext = await ensureAudioCtx();
    const name = options.processorName;

    if (this.hasRegistered(name)) {
      console.log(`Processor '${name}' is already registered.`);
      return name;
    }

    console.info(`Processor ${name} not registered, registering now...`);

    const rawSource =
      options.rawSource || PROCESSORS[name as AudiolibProcessor];

    const blob = new Blob([rawSource], {
      type: 'application/javascript',
    });

    const blobURL = URL.createObjectURL(blob);

    try {
      // Register the processor with the audio worklet
      await audioContext.audioWorklet.addModule(blobURL);

      // Store the blob URL for later cleanup if needed // ?? Unnecessary bloat?
      this.blobURLStore.set(name, blobURL);

      // Mark this processor as registered
      this.registeredProcessors.add(name);
      console.log(`'${name}' registered successfully.`);

      return name;
    } catch (error) {
      console.error(
        `Failed to register audio worklet processor '${name}':`,
        error
      );
      return null;
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
