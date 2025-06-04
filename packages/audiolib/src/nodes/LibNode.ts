import { NodeID } from '@/nodes/node-store';
import { LibParam, ParamType } from './params';
import { InstrumentType, LibInstrument } from './instruments';
import { Message, MessageHandler } from '@/events';

export type BaseNodeType =
  | 'instrument'
  | 'voice'
  | 'fx'
  | 'param'
  | 'container'
  | 'recorder'
  | 'audiolib';

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
  | ContainerType
  | VoiceType
  | ParamType
  | FxType;

export type AudioGraph = {
  root: LibNode;
};

// Base interface for all nodes
export interface LibNode {
  readonly nodeId: NodeID;
  readonly nodeType: NodeType;
  readonly isReady: boolean;
  dispose(): void;
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

export interface TimeKeeper {
  readonly now: number;
}

export interface SampleLoader {
  loadSample(...args: TODO[]): Promise<TODO>;
}

// Container node
export interface LibContainerNode extends LibNode, Connectable {
  readonly nodeType: ContainerType;

  add(child: LibNode): this;
  remove(child: LibNode): this;
  nodes: LibNode[];
}

// Voice node - handles actual sound generation
export interface LibVoiceNode extends LibNode, Connectable {
  readonly nodeType: VoiceType;

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

// destination: Destination | null; //LibNode | AudioDestinationNode | AudioNode | null;
// in?: Connectable[] | AudioNode | null;
// out?: Connectable[] | AudioNode | null; // TODO: Standardize so don't have to distinguish between LibAudioNodes and AudioNodes, make required and remove "| AudioNode"
