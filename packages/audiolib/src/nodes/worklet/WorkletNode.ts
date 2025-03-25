import { AudioParamDescriptor } from '../types';
import { registry } from './worklet-registry';
import { getStandardizedAWPNames } from './worklet-utils';

export async function createWorkletNode(
  context: BaseAudioContext,
  processorName: string,
  processFunction?: Function,
  params: AudioParamDescriptor[] = [],
  nodeOptions = {}
) {
  // Register or get existing processor
  if (processFunction) {
    // registry.register is a no-op if already registered
    await registry.register(context, processorName, {
      processFunction,
      params,
    });
  } else {
    // todo: check if this works (should still register without processFunction, otherwise remove the else)
    await registry.register(context, processorName);
  }

  // Create and return node
  const { registryName, className } = getStandardizedAWPNames(processorName);
  return new WorkletNode(context, { className, registryName }, nodeOptions);
}

// TODO: Consider making `connections` a WeakMap. Check support for AudioParam connections if needed.

class WorkletNode extends AudioWorkletNode {
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

export type { WorkletNode };
