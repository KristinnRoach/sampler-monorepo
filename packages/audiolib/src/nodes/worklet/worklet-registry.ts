// worklet-registry.ts

import { generateProcessorCode } from './generateProcessorCode';
import { getStandardizedAWPNames } from './worklet-utils';
import { ProcessorDefinition } from '../types';

class WorkletRegistry {
  private static instance: WorkletRegistry;
  private definitions: Map<string, ProcessorDefinition> = new Map();
  private registeredProcessors = new Map<BaseAudioContext, Set<string>>();

  // Singleton pattern to ensure only one instance of WorkletRegistry
  private constructor() {}

  static getInstance(): WorkletRegistry {
    if (!WorkletRegistry.instance) {
      WorkletRegistry.instance = new WorkletRegistry();
    }
    return WorkletRegistry.instance;
  }

  // Single register method that handles both definition and context registration
  async register(
    context: BaseAudioContext,
    name: string,
    definition?: ProcessorDefinition
  ): Promise<string> {
    const { registryName, className } = getStandardizedAWPNames(name);

    // Store definition if provided
    if (definition) {
      this.definitions.set(registryName, definition);
    }

    // Check if already registered with this context
    const contextProcessors =
      this.registeredProcessors.get(context) || new Set();
    if (contextProcessors.has(registryName)) {
      return registryName;
    }

    // Get definition or throw
    const processorDef = this.definitions.get(registryName);
    if (!processorDef) {
      throw new Error(`Processor ${name} not defined`);
    }

    // Generate and register
    const processorCode = generateProcessorCode(
      { className, registryName },
      processorDef.processFunction,
      processorDef.params || [],
      processorDef.options || {}
    );

    const blob = new Blob([processorCode], { type: 'application/javascript' });
    await context.audioWorklet.addModule(URL.createObjectURL(blob));

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
    return this.definitions;
  }

  getDefinition(name: string): ProcessorDefinition | undefined {
    const { registryName } = getStandardizedAWPNames(name);
    return this.definitions.get(registryName);
  }

  hasDefinition(name: string): boolean {
    const { registryName } = getStandardizedAWPNames(name);
    return this.definitions.has(registryName);
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
