import { NodeID } from '@/nodes/node-store';
import { InstrumentType } from './instruments';
import { Message, MessageHandler } from '@/events';

export type BaseNodeType =
  | 'instrument'
  | 'voice'
  | 'fx'
  | 'param'
  | 'container'
  | 'recorder'
  | 'audiograph';

export type ContainerType = 'pool' | 'chain' | 'audiolib';

export type VoiceType = 'sample' | 'karplus-strong' | 'osc';

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
  | VoiceType
  | ContainerType
  | string;
// | ParamType
// | FxType;

// Base interface for all nodes
export interface LibNode {
  readonly nodeId: NodeID;
  readonly nodeType: NodeType;
  readonly initialized: boolean;
  dispose(): void;
}

export interface AudioGraph extends LibNode {
  audioContext: AudioContext | null;
}

export type Destination = Connectable | AudioNode | AudioParam;

export interface Connectable {
  connect(
    destination: Destination,
    output?: number | 'main' | 'alt' | 'all',
    input?: number | 'main' | 'alt' | 'all'
  ): Destination;

  disconnect(output?: 'main' | 'alt' | 'all', destination?: Destination): this;
}

export interface Messenger {
  onMessage(type: string, handler: MessageHandler<Message>): () => TODO;
}

export interface SampleLoader {
  loadSample(...args: TODO[]): Promise<TODO>;
}

// Voice node - handles actual sound generation
export interface LibVoiceNode extends LibNode, Connectable {
  readonly nodeType: VoiceType;

  getParam(name: string): AudioParam | null; // todo: ParamType
  setParam(name: string, value: number, timestamp: number, options: TODO): this;

  trigger(options: TODO): TODO;
  release(options?: TODO): TODO;
  stop(): TODO;
  sendToProcessor(data: TODO): void;
}

// export interface TimeKeeper {
//   readonly now: number;
// }
