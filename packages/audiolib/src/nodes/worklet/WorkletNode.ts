// TODO: Consider making `connections` a WeakMap. Check support for AudioParam connections if needed.

export class WorkletNode extends AudioWorkletNode {
  private connections: Map<AudioNode, [number, number]>; // todo: make this a weakmap? Add AudioParam?

  constructor(
    context: BaseAudioContext,
    standardizedWAPNames: { registryName: string; className: string },
    options: AudioWorkletNodeOptions = {}
  ) {
    super(context, standardizedWAPNames.registryName, options);
    this.connections = new Map();
  }

  connect(
    destination: AudioNode | AudioParam,
    outputIndex?: number,
    inputIndex?: number
  ): this {
    super.connect(destination as any, outputIndex as any, inputIndex as any);

    if (destination instanceof AudioNode) {
      this.connections.set(destination, [outputIndex || 0, inputIndex || 0]);
    }
    return this;
  }

  disconnect(): void;

  disconnect(destination?: AudioNode | null): void {
    if (destination) {
      this.connections.delete(destination);
      super.disconnect(destination);
    } else {
      super.disconnect();
      this.connections.clear();
    }
  }

  setParam(name: string, value: number, time = 0): boolean {
    const param = (this.parameters as any)[name];
    if (!param) {
      console.warn(`Parameter "${name}" not found`);
      return false;
    }

    if (time > 0) {
      param.setValueAtTime(value, this.context.currentTime + time);
    } else {
      param.value = value;
    }

    return true;
  }

  setActive(active: boolean): void {
    this.port.postMessage({ active });
  }

  getConnections(): Map<AudioNode, [number, number]> {
    return this.connections;
  }
}

// draft drasl:
// getParameterDescriptors(): AudioParamDescriptor[] {
//   const { registryName } = getStandardizedAWPNames(this.constructor.name);
//   const definition = registry.getDefinition(registryName);
//   if (definition) {
//     return definition.parameterDescriptors;
//   }
//   return [];
// }
// getParameterDescriptor(name: string): AudioParamDescriptor | undefined {
//   const { registryName } = getStandardizedAWPNames(this.constructor.name);
//   const definition = registry.getDefinition(registryName);
//   if (definition) {
//     return definition.parameterDescriptors.find((param) => param.name === name);
//   }
//   return undefined;
// }
// getParameterValue(name: string): number | undefined {
//   const param = this.parameters.get(name);
//   if (param) {
//     return param.value;
//   }
//   return undefined;
// }
// getParameterValues(): Map<string, number> {
//   const values = new Map<string, number>();
//   this.parameters.forEach((param, name) => {
//     values.set(name, param.value);
//   });
//   return values;
// }

// HENDA
// static async create(
//   context: BaseAudioContext,
//   options: {
//     processorName: string;
//     processFunction: Function;
//     params?: AudioParamDescriptor[];
//     nodeOptions?: AudioWorkletNodeOptions;
//     processorOptions?: Record<string, unknown>;
//   }
// ): Promise<WorkletNode> {
//   if (!registry) {
//     throw new Error('WorkletRegistry is not initialized');
//   }

//   if (registry.hasRegistered(options.processorName, context)) {
//     return new WorkletNode(
//       context,
//       getStandardizedAWPNames(options.processorName),
//       options.nodeOptions
//     );
//   }

//   const {
//     processorName,
//     processFunction,
//     params = [],
//     nodeOptions = {},
//     processorOptions = {},
//   } = options;

//   const { className, registryName } = getStandardizedAWPNames(processorName);

//   const processorCode = generateProcessorCode(
//     { className, registryName },
//     processFunction,
//     params,
//     processorOptions
//   );

//   await registry.register(context, processorCode, registryName);

//   return new WorkletNode(context, { className, registryName }, nodeOptions);
// }
