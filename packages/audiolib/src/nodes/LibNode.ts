import { NodeID } from '@/nodes/node-store';
import { ILibAudioNode } from './LibAudioNode';

export type BaseNodeType =
  | 'instrument'
  | 'voice'
  | 'fx'
  | 'param'
  | 'container'
  | 'recorder'
  | 'audiograph';

export type InstrumentType = 'sample-player' | 'synth';

export type ContainerType = 'pool' | 'chain' | 'audiolib';

export type VoiceType =
  | 'sample-voice'
  | 'karplus-strong-voice'
  | 'osc-voice'
  | 'noise-voice';

export type CustomFxType =
  | 'feedback-delay'
  | 'harmonic-feedback'
  | 'distortion'
  | 'dattorro-reverb';

type NativeAudioNode =
  | 'AudioWorkletNode'
  | 'GainNode'
  | 'BiquadFilterNode'
  | 'AudioBufferSourceNode'
  | 'DynamicsCompressorNode';

// Union of all types
export type NodeType =
  | NativeAudioNode
  | BaseNodeType
  | InstrumentType
  | VoiceType
  | ContainerType
  | string
  | CustomFxType;
// | ParamType

// Base interface for all nodes
export interface LibNode {
  readonly nodeId: NodeID;
  readonly nodeType: NodeType;
  readonly initialized: boolean;
  dispose(): void;
}

// Voice node - handles actual sound generation
export interface LibVoiceNode extends LibNode {
  readonly nodeType: VoiceType;

  getParam(name: string): AudioParam | null; // todo: ParamType
  setParam(name: string, value: number, timestamp: number, options: TODO): this;

  trigger(options: TODO): TODO;
  release(options?: TODO): TODO;
  stop(): TODO;
  sendToProcessor(data: TODO): void;
}

export interface SampleLoader {
  loadSample(...args: TODO[]): Promise<TODO>;
}

export type Destination = ILibAudioNode | AudioNode | AudioParam;

// export interface Messenger {
//   onMessage(type: string, handler: MessageHandler<Message>): () => TODO;
// }

// export interface AudioGraph extends LibNode {
//   audioContext: AudioContext | null;
// }

// export interface Connectable {
//   connect(
//     destination: Destination,
//     output?: number | 'dry' | 'wet' | 'main' | 'alt',
//     input?: number | 'main' | 'dry' | 'wet' | 'alt'
//   ): Destination;

//   disconnect(
//     output?: 'main' | 'dry' | 'wet' | 'alt',
//     destination?: Destination
//   ): this;
// }
