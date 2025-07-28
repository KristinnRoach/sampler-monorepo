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
    this.parameters
      .get(name as string)
      ?.setValueAtTime(value, this.context.currentTime);
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
  }
}
