export type TODO = any;

export type IsReady = boolean;

export type AudioContextTimeSeconds = number;

export type NodeID = string; // | number; // | symbol; // TODO -> Standardize id's
export type NodeType =
  | 'Source' // No inputs - Leaf
  | 'Group'
  | 'Param'
  | 'Processor'
  | 'Destination'; // Root

export interface AudioParamDescriptor {
  name: string;
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
  automationRate: 'a-rate' | 'k-rate';
}

// export interface ProcessorDefinition {
//   processFunction: Function;
//   processorParams?: AudioParamDescriptor[];
//   processorOptions?: Record<string, unknown>;
// }
