import { WorkletConfig, DefaultWorkletConfig } from './worklet-types';

export class WorkletNode<
  TConfig extends WorkletConfig = DefaultWorkletConfig,
> extends AudioWorkletNode {
  constructor(audioContext: AudioContext, processorName: string) {
    super(audioContext, processorName);
  }

  // Parameter control
  setParam<K extends keyof TConfig['params']>(
    name: K,
    value: TConfig['params'][K]
  ): this {
    const param = this.parameters.get(name as string);
    if (!param) {
      console.warn(`Parameter '${String(name)}' not found on worklet node`);
      return this;
    }
    param.setValueAtTime(value, this.context.currentTime);
    return this;
  }

  getParam<K extends keyof TConfig['params']>(name: K): AudioParam | undefined {
    return this.parameters.get(name as string);
  }

  // Message passing
  sendProcessorMessage(message: TConfig['message']): this {
    this.port.postMessage(message);
    return this;
  }

  onProcessorMessage(
    callback: (event: MessageEvent<TConfig['message']>) => void
  ): this {
    this.port.onmessage = callback;
    return this;
  }

  dispose(): void {
    this.disconnect();
    this.port.onmessage = null;
    this.port.close();
  }
}
