import { AudioParamDescriptor } from '@/types/types';
import { registry } from './WorkletRegistry';
import { getStandardizedAWPNames } from './worklet-utils';

export async function generateWorkletNode(
  audioContext: BaseAudioContext,
  processorName: string,
  processFunction?: Function,
  params: AudioParamDescriptor[] = [],
  nodeOptions = {},
  processorOptions = {}
): Promise<WorkletNode> {
  // Register or get existing processor
  if (processFunction) {
    // register is a no-op if already registered
    await registry.register(audioContext, processorName, {
      processFunction,
      processorParams: params,
      processorOptions: processorOptions,
    });
  } else {
    // todo: check if this works (should still register without processFunction, otherwise remove the else)
    await registry.register(audioContext, processorName);
  }

  // Create and return node
  const { registryName } = getStandardizedAWPNames(processorName);
  return new WorkletNode(audioContext, registryName, nodeOptions);
}

export function createWorkletNode(
  audioContext: BaseAudioContext,
  registeredProcessorName: string,
  nodeOptions: AudioWorkletNodeOptions = {}
): WorkletNode {
  const { registryName } = getStandardizedAWPNames(registeredProcessorName);
  return new WorkletNode(audioContext, registryName, nodeOptions);
}

// TODO: Consider making `connections` a WeakMap. Check support for AudioParam connections if needed.
class WorkletNode extends AudioWorkletNode {
  private connections: Map<AudioNode, [number, number]>; // todo: make this a weakmap? Add AudioParam?

  constructor(
    context: BaseAudioContext,
    processorName: string,
    options: AudioWorkletNodeOptions = {}
  ) {
    super(context, processorName, options);
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

export { WorkletNode };
// export default WorkletNode;

// interface AudioWorkletProcessorOptions {
//   processorName?: string;
//   processorState?: Record<string, any>;
//   processorCode?: string;
//   constructorCode?: Function;
//   messageHandler?: Function;
//   processFunction?: Function;
//   params?: AudioParamDescriptor[];
//   options?: {
//     state?: Record<string, unknown>;
//     constructorCode?: Function;
//     messageHandler?: Function;
//   };
// }

// interface AudioWorkletNodeOptions {
//   outputChannelCount?: number[];
//   channelCount?: number;
//   channelCountMode?: 'max' | 'clamped-max' | 'explicit';
//   channelInterpretation?: 'speakers' | 'discrete';
//   numberOfInputs?: number;
//   numberOfOutputs?: number;
//   processorOptions?: Record<string, any>;
//   parameterData?: Record<string, number>;
//   port?: MessagePort;
//   tailTime?: number;
//   renderQuantumRange?: [number, number];
//   processorName?: string;
//   processorState?: Record<string, any>;
//   processorCode?: string;
// }
