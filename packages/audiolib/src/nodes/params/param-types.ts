import type { AudioParamDescriptor } from '../../types/audio-param-descriptor';

export interface LibParamDescriptor extends AudioParamDescriptor {
  nodeId: NodeID;
  dataType: 'number' | 'boolean' | 'enum';
  defaultValue: any; // Override to make required and allow any type

  step?: number;
  enumValues?: string[];
  group?: string;
}

export type NormalizeOptions = { from: [number, number]; to: [number, number] };
