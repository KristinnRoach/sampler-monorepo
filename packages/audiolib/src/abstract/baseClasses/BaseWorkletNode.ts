import { getAudioContext, ensureAudioCtx } from '@/context/globalAudioContext';
import { registry, ProcessorName } from '@/nodes/processors/ProcessorRegistry';
import { DEFAULTS } from '../shared-utils';
import { LibNode } from './LibNode';
import { createNodeId } from '@/store/IdStore';

export function createWorkletNode(
  props: AudioWorkletNodeOptions | TODO = {
    context: getAudioContext(),
    processorName: 'dummy-processor',
    workletOptions: {},
  }
): BaseWorkletNode {
  if (!registry.hasRegistered(props.processorName)) {
    throw new Error(
      `AudioWorkletProcessor "${props.processorName}" is not registered.`
    );
  }
  return new BaseWorkletNode(props);
}

// idempotent and safe to use wherever async is ok
export async function createAndRegisterWorklet(
  processorCode: string,
  props: AudioWorkletNodeOptions | TODO = {
    context: getAudioContext(),
    processorName: 'dummy-processor',
    workletOptions: {},
  }
): Promise<BaseWorkletNode> {
  let ctx: AudioContext = props.context; // BaseAudioContext |
  if (!ctx) {
    ctx = await ensureAudioCtx();
  }

  let registeredName = props.processorName;
  if (!registry.hasRegistered(props.processorName)) {
    registeredName = await registry.register({
      processorName: props.processorName,
      rawSource: processorCode,
    });
  }

  return new BaseWorkletNode({
    context: ctx,
    processorName: registeredName,
    ...props,
  });
}

class BaseWorkletNode extends AudioWorkletNode implements LibNode {
  static readonly DEFAULT_PROCESSOR: ProcessorName;

  readonly nodeId: string;
  readonly processorName: ProcessorName;
  paramMap: Map<string, AudioParam>; // Workaround for TypeScript issue with AudioParamMap

  private connections: Map<AudioNode | AudioParam, [number, number]>; // todo: rethink whether this is worth it (if so WeakMap?)

  constructor(
    // todo: add type for SourceNodeOptions etc
    props: AudioWorkletNodeOptions | TODO = {
      context: getAudioContext(),
      processorName: 'dummy-processor',
      workletOptions: {},
    }
  ) {
    super(props.context, props.processorName, props.workletOptions);
    this.nodeId = createNodeId();
    this.processorName = props.processorName;

    this.paramMap = this.parameters as Map<string, AudioParam>; // ts-error hax
    this.connections = new Map();
  }

  static async register(processorName: ProcessorName): Promise<boolean> {
    return (await registry.register({ processorName })) !== null;
  }

  static isProcessorRegistered(processorName: ProcessorName): boolean {
    return registry.hasRegistered(processorName);
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

  dispose(): void {
    this.disconnect();
    this.connections.clear();
    this.port.close();
  }

  getParam(name: string): AudioParam | null {
    // rethink
    const param = this.paramMap.get(name);
    if (param && param instanceof AudioParam) {
      return param as AudioParam;
    } else {
      console.warn(`Parameter: ${name} not found in: ${this}`);
      return null;
    }
  }

  setTargetAtTime(
    // rethink
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
    // rethink
    this.port.postMessage({ active });
  }

  getConnections(): Map<AudioNode | AudioParam, [number, number]> {
    return this.connections;
  }

  get ProcessorName(): string {
    return this.processorName;
  }

  static async createNodeAsync<T extends typeof BaseWorkletNode>(
    this: T,
    props: AudioWorkletNodeOptions | TODO = {} // todo: add type for SourceNodeOptions etc
  ): Promise<InstanceType<T>> {
    const ctx = props.context || (await ensureAudioCtx());
    if (!ctx.audioWorklet) throw new Error('AudioWorklet not supported');

    const name = props.processorName || this.DEFAULT_PROCESSOR;
    if (!name) throw new Error('No processor name provided');

    let registeredName = name;
    if (!registry.hasRegistered(name)) {
      registeredName = (await registry.register({ processorName: name })) || '';
      if (!registeredName) throw new Error(`Failed to register ${name}.`);
    }

    return new this({
      context: ctx,
      processorName: registeredName,
      ...props,
    }) as InstanceType<typeof this>;
  }

  static createNonAsync<T extends typeof BaseWorkletNode>(
    props: AudioWorkletNodeOptions | TODO = {} // todo: add type for SourceNodeOptions etc
  ): InstanceType<T> {
    const ctx = props.context || getAudioContext();

    if (!ctx.audioWorklet) throw new Error('AudioWorklet not supported');

    const name = props.processorName || this.DEFAULT_PROCESSOR;
    if (!name) throw new Error('No processor name provided');

    if (!registry.hasRegistered(name)) {
      throw new Error(`Processor ${name} not registered.`);
    }

    return new this({
      context: ctx,
      processorName: name,
      ...props,
    }) as InstanceType<T>;
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
