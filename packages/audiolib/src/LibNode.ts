import { NodeID } from '@/state/registry/NodeIDs';
import { Message, MessageHandler } from '@/events';
import { PressedModifiers } from '@/input';

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

// Instrument node - manages voices
export interface LibInstrument extends LibNode {
  readonly nodeType: InstrumentType;

  play(midiNote: number, velocity: number, modifiers: PressedModifiers): this;
  release(midiNote?: number, modifiers?: PressedModifiers): this;
  releaseAll(): this;

  setParamValue(name: string, value: number): this;
  getParamValue(name: string): number | null;
}

// Voice node - handles actual sound generation
export interface LibVoiceNode extends LibNode {
  readonly nodeType: VoiceType;
  readonly processorNames: string[];
  // readonly paramMap: Map<string, AudioParam>;

  connect(
    destination?: LibVoiceNode | LibParamNode | AudioNode | AudioParam,
    outputIndex?: number,
    inputIndex?: number
  ): this;

  getParam(name: string): AudioParam | null; // todo: ParamType
  setParam(name: string, value: number, options: TODO): this;

  trigger(options: TODO): this;
  release(options?: TODO): this;
  stop(): this;
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
