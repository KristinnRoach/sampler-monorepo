// import { getAudioContext } from '@/context/globalAudioContext';
import { registry } from '@/processors/ProcessorRegistry';
import { DEFAULTS } from './SharedByBaseNodes';

export function createWorkletNode(
  audioContext: BaseAudioContext,
  registeredProcessorName: string,
  nodeOptions: AudioWorkletNodeOptions = {}
): BaseWorkletNode {
  // Check if the processor is registered
  if (!registry.hasRegistered(registeredProcessorName)) {
    throw new Error(
      `AudioWorkletProcessor "${registeredProcessorName}" is not registered.`
    );
  }
  return new BaseWorkletNode(
    audioContext,
    registeredProcessorName,
    nodeOptions
  );
}

class BaseWorkletNode extends AudioWorkletNode {
  // implements Node { // todo: eventbus
  private connections: Map<AudioNode | AudioParam, [number, number]>; // todo: make this a WeakMap?

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
  ): AudioNode {
    if (destination instanceof AudioNode) {
      super.connect(destination, outputIndex, inputIndex);
    } else if (destination instanceof AudioParam) {
      super.connect(destination, outputIndex);
    }
    if (destination instanceof AudioNode) {
      this.connections.set(destination, [outputIndex || 0, inputIndex || 0]);
    }
    return this;
  }

  disconnect(): void;

  disconnect(destination?: AudioNode | null): void {
    if (destination) {
      super.disconnect(destination);
      this.connections.delete(destination);
    } else {
      super.disconnect();
      this.connections.clear();
    }
  }

  getParam(name: string): AudioParam {
    const param = (this as any).parameters.get(name); //as AudioParam
    if (param && param instanceof AudioParam) {
      return param as AudioParam;
    } else {
      console.warn(`Parameter: ${name} not found`);
      throw new Error(`Parameter: ${name} not found in: ${this}`);
    }
  }

  setTargetAtTime(
    name: string,
    targetValue: number,
    rampTime?: number,
    offsetSeconds?: number
  ): boolean {
    return DEFAULTS.METHODS.setTargetAtTime(
      this,
      name,
      targetValue,
      rampTime,
      offsetSeconds
    );
  }

  setActive(active: boolean): void {
    this.port.postMessage({ active });
  }

  getConnections(): Map<AudioNode | AudioParam, [number, number]> {
    return this.connections;
  }
}

export { BaseWorkletNode };

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
