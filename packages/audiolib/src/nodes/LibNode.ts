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

  // todo: triggers should be here
  // triggerAttack(midiNote: number, velocity?: number): this;
  // triggerRelease(midiNote: number): this;
  // triggerAttackRelease(
  //   midiNote: number,
  //   duration: number,
  //   velocity?: number
  // ): void;
  // releaseAll(): this;

  play(options: TODO): this;
  stop(): this;
}

export interface LibInstrument extends LibNode {
  playNote(midiNote: number, velocity?: number): this;
  stopNote(midiNote: number): this;

  triggerAttack(midiNote: number, velocity?: number): this;
  triggerRelease(midiNote: number): this;
  triggerAttackRelease(
    midiNote: number,
    duration: number,
    velocity?: number
  ): void;
  releaseAll(): this;

  setParamValue(name: string, value: number): this;
  getParamValue(name: string): number | null;

  addListener(event: string, listener: Function): this;
  removeListener(event: string, listener: Function): this;
}
