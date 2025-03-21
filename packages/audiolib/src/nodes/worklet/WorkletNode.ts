import { WorkletManager } from './WorkletManager';
import { getStandardizedAWPNames } from './worklet-utils';
import { AudioParamDescriptor } from '../types';

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

  // Declare method overload signatures
  connect(
    destinationNode: AudioNode,
    output?: number,
    input?: number
  ): AudioNode;
  connect(destinationParam: AudioParam, output?: number): void;

  connect(
    destination: AudioNode | AudioParam,
    outputIndex?: number,
    inputIndex?: number
  ): AudioNode | void {
    super.connect(destination as any, outputIndex as any, inputIndex as any);

    if (destination instanceof AudioNode) {
      this.connections.set(destination, [outputIndex || 0, inputIndex || 0]);
      return destination;
    }
    return;
  }

  disconnect(destinationNode: AudioNode): void;
  disconnect(): void;

  disconnect(destination?: AudioNode): void {
    if (destination) {
      this.connections.delete(destination as AudioNode);
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

  static async create(
    context: BaseAudioContext,
    options: {
      processorName: string;
      processFunction: Function;
      params?: AudioParamDescriptor[];
      nodeOptions?: AudioWorkletNodeOptions;
      processorOptions?: Record<string, unknown>;
    }
  ): Promise<WorkletNode> {
    // Todo: util function to check for audio worklet support and context state
    const manager = WorkletManager.getInstance();

    // if (!manager) {
    //   throw new Error('WorkletManager is not initialized');
    // }

    // if (manager.hasRegistered(options.processorName)) {
    //   return new WorkletNode(
    //     context,
    //     getStandardizedAWPNames(options.processorName),
    //     options.nodeOptions
    //   );
    // }

    const {
      processorName,
      processFunction,
      params = [],
      nodeOptions = {},
      processorOptions = {},
    } = options;

    const { className, registryName } = getStandardizedAWPNames(processorName);

    const processorCode = manager.generateProcessorCode(
      { className, registryName },
      processFunction,
      params,
      processorOptions
    );

    await manager.registerProcessor(context, processorCode, registryName);

    return new WorkletNode(context, { className, registryName }, nodeOptions);
  }
}
