import { NodeID } from '@/nodes/node-store';
import { LibParam } from './nodes/params';
import { Message, MessageHandler, MessageBus } from '@/events';

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

  dispose(): void;
}

export interface Connectable {
  connect(
    destination?: TODO,
    outputIndex?: number,
    inputIndex?: number
  ): this | TODO;

  disconnect(destination?: TODO): void;
}

export interface Messenger {
  onMessage(type: string, handler: MessageHandler<Message>): () => TODO;
}

export interface TimeKeeper {
  readonly now: number;
}

export interface SampleLoader {
  loadSample(...args: TODO[]): Promise<TODO>;
}

// Container node
export interface LibContainerNode extends LibNode {
  readonly nodeType: ContainerType;

  add(child: LibNode): this;
  remove(child: LibNode): this;
  nodes: LibNode[];
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
    destination?: LibVoiceNode | LibParam | AudioNode | AudioParam,
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

// Effect node
export interface LibFxNode extends LibNode {
  readonly nodeType: FxType;

  bypass(shouldBypass: boolean): this;
  setMix(value: number): this;
}
