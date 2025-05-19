import { NodeID } from '@/nodes/node-store';
import { Message, MessageHandler } from '@/events';

export type BaseNodeType =
  | 'instrument'
  | 'voice'
  | 'fx'
  | 'param'
  | 'container'
  | 'recorder'
  | 'audiolib';

export type InstrumentType = 'sampler' | 'synth';

export type ContainerType = 'pool' | 'chain' | 'audiolib';

export type VoiceType = 'sample' | 'karplus-strong' | 'osc';

export type ParamType = 'macro' | 'lib-param' | 'web-audio-param'; // 'AudioParam';

export type FxType =
  | 'feedback-delay'
  | 'reverb'
  | 'chorus'
  | 'filter'
  | 'eq'
  | 'compressor';

// Union of all types
export type NodeType =
  | BaseNodeType
  | InstrumentType
  | ContainerType
  | VoiceType
  | ParamType
  | FxType;

// Base interface for all nodes
export interface LibNode {
  readonly nodeId: NodeID;
  readonly nodeType: NodeType;
  readonly now: number;

  onMessage(type: string, handler: MessageHandler<Message>): () => void;

  connect(
    destination?: TODO,
    outputIndex?: number,
    inputIndex?: number
  ): this | TODO;

  disconnect(destination?: TODO): void;

  dispose(): void;
}

// Container node
export interface LibContainerNode extends LibNode {
  readonly nodeType: ContainerType;

  add(child: LibNode): this;
  remove(child: LibNode): this;
  nodes: LibNode[];
}

export interface SampleLoader {
  loadSample(...args: TODO[]): Promise<TODO>;
}

// Instrument node
export interface LibInstrument extends LibNode {
  readonly nodeType: InstrumentType;

  play(...args: TODO[]): TODO;
  release(...args: TODO[]): this;
  panic(...args: TODO[]): this;
}

// Voice node - handles actual sound generation
export interface LibVoiceNode extends LibNode {
  readonly nodeType: VoiceType;

  connect(
    destination?: LibVoiceNode | LibParamNode | AudioNode | AudioParam,
    outputIndex?: number,
    inputIndex?: number
  ): this;

  getParam(name: string): AudioParam | null; // todo: ParamType
  setParam(name: string, value: number, options: TODO): this;

  trigger(options: TODO): TODO;
  release(options?: TODO): TODO;
  stop(): TODO;
  sendToProcessor(data: TODO): void;
}

// Parameter node
export interface LibParamNode extends LibNode {
  readonly nodeType: ParamType;

  getValue(): number;
  setValue(value: number): this;
}

// Effect node
export interface LibFxNode extends LibNode {
  readonly nodeType: FxType;

  bypass(shouldBypass: boolean): this;
  setMix(value: number): this;
}
