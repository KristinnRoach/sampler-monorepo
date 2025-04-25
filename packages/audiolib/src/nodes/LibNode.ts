export interface LibNode {
  readonly nodeId: NodeID;
  readonly nodeType: string;

  connect(
    destination: AudioNode | AudioParam,
    outputIndex?: number,
    inputIndex?: number
  ): this | AudioNode | AudioParam;
  disconnect(destination?: AudioNode | null): void;

  dispose(): void;
}

export interface LibSourceNode extends LibNode {
  readonly processorNames: string[];

  paramMap: Map<string, AudioParam>; // Workaround for TypeScript issue with AudioParamMap

  getParam(name: string): AudioParam | null;
  setParam(name: string, value: number, options: TODO): this;

  addListener(event: string, listener: Function): this;
  removeListener(event: string, listener: Function): this;

  trigger(options: TODO): this;
  release(options?: TODO): this;
  sendToProcessor(data: any): void;

  stop(): this; // force immediate stop
}

export interface LibInstrument extends LibNode {
  play(midiNote: number, velocity?: number): this;
  release(midiNote?: number): this;
  releaseAll(): this;

  setParamValue(name: string, value: number): this;
  getParamValue(name: string): number | null;

  addListener(event: string, listener: Function): this;
  removeListener(event: string, listener: Function): this;
}
