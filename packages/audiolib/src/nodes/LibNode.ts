import { NodeID } from '@/store/state/IdStore';
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
  // readonly nodeType: string;
  readonly nodeType: NodeType;
  readonly now: number;

  onMessage(type: string, handler: MessageHandler<Message>): () => void;

  connect(
    destination: LibNode | AudioNode | null,
    outputIndex?: number,
    inputIndex?: number
  ): this | AudioNode | AudioParam;

  disconnect(destination?: LibNode | AudioNode | null): void;

  dispose(): void;
}

// Voice node - handles actual sound generation
export interface LibVoiceNode extends LibNode {
  readonly nodeType: VoiceType;
  readonly processorNames: string[];
  readonly paramMap: Map<string, AudioParam>;

  getParam(name: string): AudioParam | null; // todo: ParamType
  setParam(name: string, value: number, options: any): this;

  trigger(options: any): this;
  release(options?: any): this;
  stop(): this;
  sendToProcessor(data: any): void;
}

// Instrument node - manages voices
export interface LibInstrument extends LibNode {
  readonly nodeType: InstrumentType;

  play(midiNote: number, modifiers: TODO, velocity?: number): this;
  release(midiNote?: number, modifiers?: TODO): this;
  releaseAll(): this;

  setParamValue(name: string, value: number): this;
  getParamValue(name: string): number | null;

  onGlobalLoopToggle?(modifers?: TODO): this;
}

// Effect node
export interface LibFxNode extends LibNode {
  readonly nodeType: FxType;

  bypass(shouldBypass: boolean): this;
  setMix(value: number): this;
}

// Container node
export interface LibContainerNode extends LibNode {
  readonly nodeType: ContainerType;

  add(child: LibNode): this;
  remove(child: LibNode): this;
  getChildren(): LibNode[];
}

// Parameter node
export interface LibParamNode extends LibNode {
  readonly nodeType: ParamType;

  getValue(): number;
  setValue(value: number): this;
  getTarget(): AudioParam | null;
}
