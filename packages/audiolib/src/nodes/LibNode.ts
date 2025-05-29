import { NodeID } from '@/nodes/node-store';
import { LibParam, ParamType } from './params';
import { Message, MessageHandler } from '@/events';

export type BaseNodeType =
  | 'instrument'
  | 'voice'
  | 'fx'
  | 'param'
  | 'container'
  | 'recorder'
  | 'audiolib';

export type InstrumentType = 'sample-player' | 'synth';

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
  root: LibAudioNode;
};

// Base interface for all nodes
export interface LibAudioNode {
  readonly nodeId: NodeID;
  readonly nodeType: NodeType;
  readonly isReady: boolean;

  // parent?: LibAudioNode | 'isRoot';
  destination?: LibAudioNode | AudioDestinationNode | AudioNode | null; // TODO: make required and consolidate types

  in?: LibAudioNode[] | AudioNode | MediaStreamAudioSourceNode | null;
  out?: LibAudioNode[] | AudioNode | null; // TODO: Standardize so don't have to distinguish between LibAudioNodes and AudioNodes, make required and remove "| AudioNode"
  firstChildren?: Array<LibAudioNode | AudioNode>;

  // subGraph?: {
  //   parent: LibAudioNode;
  //   in?: LibAudioNode[];
  //   out: LibAudioNode[];
  //   firstChildren?: LibAudioNode[];
  // };

  // TODO: subGraph: { in: LibNode[], out: LibNode[]} ,
  // get in, get out, children or subGraph?: LibC

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
export interface LibContainerNode extends LibAudioNode {
  readonly nodeType: ContainerType;

  add(child: LibAudioNode): this;
  remove(child: LibAudioNode): this;
  nodes: LibAudioNode[];
}

// Instrument node
export interface LibInstrument extends LibAudioNode {
  readonly nodeType: InstrumentType;

  play(...args: TODO[]): TODO;
  release(...args: TODO[]): this;
  panic(...args: TODO[]): this;
}

// Voice node - handles actual sound generation
export interface LibVoiceNode extends LibAudioNode {
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
export interface LibFxNode extends LibAudioNode {
  readonly nodeType: FxType;

  bypass(shouldBypass: boolean): this;
  setMix(value: number): this;
}
