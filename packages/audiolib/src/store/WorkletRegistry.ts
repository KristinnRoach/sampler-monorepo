// WorkletRegistry.ts

import { getAudioContext } from '@/context/globalAudioContext';
import { getStandardizedAWPNames } from '../utils/worklet-utils';
import { importFileAsBlob } from '../utils/worklet-utils';

class WorkletRegistry {
  private static instance: WorkletRegistry;
  private registeredProcessors = new Map<BaseAudioContext, Set<string>>();

  private constructor() {}

  static getInstance(): WorkletRegistry {
    if (!WorkletRegistry.instance) {
      WorkletRegistry.instance = new WorkletRegistry();
    }
    return WorkletRegistry.instance;
  }

  async register(
    path: string,
    name: string, // todo: optional (inferred from name)
    context?: BaseAudioContext // todo: optional (inferred from the global getAudioContext)
  ): Promise<string> {
    const ctx = context ? context : await getAudioContext();

    if (!ctx)
      throw console.error(
        'no AudioContext available for registering audioWorkletProcessors'
      );

    const { registryName } = getStandardizedAWPNames(name);

    // Check if registered with this context
    const existingProcessors = this.registeredProcessors.get(ctx) || new Set();

    // If already registered, return the registry name
    if (existingProcessors.has(registryName)) {
      return registryName;
    }

    // Get code from path as string
    const codeBlob = await importFileAsBlob(path);

    // const promise =
    await ctx.audioWorklet.addModule(URL.createObjectURL(codeBlob));

    // Track registration
    if (!this.registeredProcessors.has(ctx)) {
      this.registeredProcessors.set(ctx, new Set());
    }

    this.registeredProcessors.get(ctx)!.add(registryName);

    return registryName;
  }

  hasRegistered(name: string, audioContext?: BaseAudioContext): boolean {
    // todo: skip if name already has correct format, also.. -->  ensure getStandardizedAWPNames is idempotent!
    const { registryName } = getStandardizedAWPNames(name);
    if (audioContext) {
      const contextProcessors = this.registeredProcessors.get(audioContext);
      return contextProcessors ? contextProcessors.has(registryName) : false;
    }
    for (const contextProcessors of this.registeredProcessors.values()) {
      if (contextProcessors.has(registryName)) {
        return true;
      }
    }
    return false;
  }

  getRegisteredProcessors(context: BaseAudioContext): Set<string> | undefined {
    return this.registeredProcessors.get(context);
  }
}

export const registry = WorkletRegistry.getInstance();

// todo: weakmap ? unregister + clear
// // Unregister a processor from a specific context
// unregister(context: BaseAudioContext, name: string): void {
//   const { registryName } = getStandardizedAWPNames(name);
//   const contextProcessors = this.registeredProcessors.get(context);
//   if (contextProcessors) {
//     contextProcessors.delete(registryName);
//     if (contextProcessors.size === 0) {
//       this.registeredProcessors.delete(context);
//     }
//   }
// }

// import { AudioParamDescriptor, ProcessorDefinition } from '../types/types';

// type PathToProcessorJsFile = string;

// type ProcessorInfo =
//   | {
//       processFunction: Function;
//       processorParams?: AudioParamDescriptor[];
//       processorOptions?: Record<string, unknown>;
//     }
//   | PathToProcessorJsFile;
// storeProcessorDefinition(name: string, definition: ProcessorInfo): string {
//   const { registryName } = getStandardizedAWPNames(name);

//   if (typeof definition === 'object' && 'processFunction' in definition) {
//     this.registeredDefinitions.set(registryName, definition);
//   } else {
//     throw new Error('Invalid processor definition provided');
//   }

//   return registryName;
// }

// // Clear all registrations for a specific context

// // Single register method that handles both definition and context registration
// async register(
//   context: BaseAudioContext,
//   name: string,
//   definition?: ProcessorInfo
// ): Promise<string> {
//   const { registryName, className } = getStandardizedAWPNames(name);

//   // // Store definition if provided
//   // if (typeof definition === 'object' && 'processFunction' in definition) {
//   //   this.registeredDefinitions.set(registryName, definition);
//   // }

//   // Check if already registered with this context
//   const existingProcessors =
//     this.registeredProcessors.get(context) || new Set();

//   // If already registered, return the registry name
//   if (existingProcessors.has(registryName)) {
//     console.warn(
//       `Processor ${name} already registered with this context. Skipping registration.`
//     );
//     return registryName;
//   }

//   // Get definition or throw
//   const def = this.registeredDefinitions.get(registryName);
//   if (!def) {
//     throw new Error(`Processor ${name} not defined`);
//   }

//   // Generate and register
//   const processorCode = generateProcessorCode(
//     { className, registryName },
//     def.processFunction,
//     def.processorParams || [],
//     def.processorOptions || {}
//   );

//   const blob = new Blob([processorCode], {
//     type: 'application/javascript',
//   });

//   const promise = context.audioWorklet.addModule(URL.createObjectURL(blob));

//   await tryCatch(promise, `Error registering processor ${name}:`);

//   // Track registration
//   if (!this.registeredProcessors.has(context)) {
//     this.registeredProcessors.set(context, new Set());
//   }

//   this.registeredProcessors.get(context)!.add(registryName);

//   return registryName;
// }
