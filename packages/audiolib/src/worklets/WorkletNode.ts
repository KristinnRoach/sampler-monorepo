import { WorkletConfig, DefaultWorkletConfig } from './types';

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
  send(message: TConfig['message']): this {
    this.port.postMessage(message);
    return this;
  }

  onMessage(callback: (event: MessageEvent<TConfig['message']>) => void): this {
    this.port.onmessage = callback;
    return this;
  }

  // Audio routing (overrides parent methods)
  connect(destination: AudioNode): AudioNode;
  connect(destination: AudioParam): AudioParam;
  connect(destination: AudioNode | AudioParam): AudioNode | AudioParam {
    super.connect(destination as any);
    return destination;
  }

  disconnect(): this {
    super.disconnect();
    return this;
  }

  // Cleanup
  dispose(): void {
    this.disconnect();
  }
}
