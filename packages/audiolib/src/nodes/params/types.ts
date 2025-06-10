import { LibNode, Messenger } from '@/nodes/LibNode';
import { MessageHandler, Message } from '@/events';

// interface AudioParamDescriptor {
//   name: string;
//   defaultValue?: number;
//   minValue?: number;
//   maxValue?: number;
//   automationRate: 'a-rate' | 'k-rate';
// }

export interface ParamDescriptor {
  nodeId: NodeID;
  name: string;
  valueType: 'number' | 'boolean' | 'enum';

  // Aligned with AudioParam properties
  minValue?: number;
  maxValue?: number;
  defaultValue: any;

  // Additional properties
  step?: number;
  enumValues?: string[];
  group?: string;

  // Optional automation rate
  automationRate?: 'a-rate' | 'k-rate';
}

export interface LibParam extends LibNode {
  // , Messenger {
  readonly nodeType: ParamType;

  getValue: () => any;
  setValue: (value: any) => void;

  // UI integration
  descriptor: ParamDescriptor;
  onChange?: (callback: MessageHandler<Message>) => () => void;
}

export type ParamType =
  | 'macro'
  | 'param'
  // todo: switch to the more specific types below
  | 'loopStart'
  | 'loopEnd'
  | 'start'
  | 'end'
  | 'attack'
  | 'decay'
  | 'sustain'
  | 'release'
  | 'rampTime'
  | 'volume'
  | 'playbackRate';
