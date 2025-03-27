// WorkletRegistry.ts

import { generateProcessorCode } from '../utils/generateProcessorCode';
import { getStandardizedAWPNames } from '../utils/worklet-utils';
import { ProcessorDefinition, AudioParamDescriptor } from '../types/types';
import { importFileAsBlob } from '../utils/worklet-utils';
import { tryCatch } from '@/utils/tryCatch';

type PathToProcessorJsFile = string;

type ProcessorInfo =
  | {
      processFunction: Function;
      processorParams?: AudioParamDescriptor[];
      processorOptions?: Record<string, unknown>;
    }
  | PathToProcessorJsFile;

class WorkletRegistry {
  private static instance: WorkletRegistry;
  private registeredDefinitions: Map<string, ProcessorDefinition> = new Map();
  private registeredProcessors = new Map<BaseAudioContext, Set<string>>();

  // Singleton pattern to ensure only one instance of WorkletRegistry
  private constructor() {}

  static getInstance(): WorkletRegistry {
    if (!WorkletRegistry.instance) {
      WorkletRegistry.instance = new WorkletRegistry();
    }
    return WorkletRegistry.instance;
  }

  async registerFromPath(
    context: BaseAudioContext,
    name: string,
    path: string
  ): Promise<string> {
    const { registryName } = getStandardizedAWPNames(name);

    // Check if already registered with this context
    const existingProcessors =
      this.registeredProcessors.get(context) || new Set();

    // If already registered, return the registry name
    if (existingProcessors.has(registryName)) {
      return registryName;
    }

    // Get code from path as string
    const codeBlob = await importFileAsBlob(path);

    // const promise =
    await context.audioWorklet.addModule(URL.createObjectURL(codeBlob));

    // await tryCatch(promise, `Error registering processor ${name}:`);

    // Track registration
    if (!this.registeredProcessors.has(context)) {
      this.registeredProcessors.set(context, new Set());
    }

    this.registeredProcessors.get(context)!.add(registryName);

    return registryName;
  }

  // Single register method that handles both definition and context registration
  async register(
    context: BaseAudioContext,
    name: string,
    definition?: ProcessorInfo
  ): Promise<string> {
    const { registryName, className } = getStandardizedAWPNames(name);

    // Store definition if provided
    if (typeof definition === 'object' && 'processFunction' in definition) {
      this.registeredDefinitions.set(registryName, definition);
    }

    // Check if already registered with this context
    const existingProcessors =
      this.registeredProcessors.get(context) || new Set();

    // If already registered, return the registry name
    if (existingProcessors.has(registryName)) {
      console.warn(
        `Processor ${name} already registered with this context. Skipping registration.`
      );
      return registryName;
    }

    // Get definition or throw
    const def = this.registeredDefinitions.get(registryName);
    if (!def) {
      throw new Error(`Processor ${name} not defined`);
    }

    // Generate and register
    const processorCode = generateProcessorCode(
      { className, registryName },
      def.processFunction,
      def.processorParams || [],
      def.processorOptions || {}
    );

    const blob = new Blob([processorCode], {
      type: 'application/javascript',
    });

    const promise = context.audioWorklet.addModule(URL.createObjectURL(blob));

    await tryCatch(promise, `Error registering processor ${name}:`);

    // Track registration
    if (!this.registeredProcessors.has(context)) {
      this.registeredProcessors.set(context, new Set());
    }

    this.registeredProcessors.get(context)!.add(registryName);

    return registryName;
  }

  hasRegistered(name: string, audioContext?: BaseAudioContext): boolean {
    // todo: make cleaner
    const { registryName } = getStandardizedAWPNames(name);
    // todo: skip this if name has correct format  // todo: make naming function idempotent
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

  getDefinitions(): Map<string, ProcessorDefinition> {
    return this.registeredDefinitions;
  }

  getDefinition(name: string): ProcessorDefinition | undefined {
    const { registryName } = getStandardizedAWPNames(name);
    return this.registeredDefinitions.get(registryName);
  }

  hasDefinition(name: string): boolean {
    const { registryName } = getStandardizedAWPNames(name);
    return this.registeredDefinitions.has(registryName);
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

// // Clear all registrations for a specific context
