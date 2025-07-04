export interface AudioParamDescriptor {
  name: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  automationRate: 'a-rate' | 'k-rate';
}

export interface LibParamDescriptor extends AudioParamDescriptor {
  nodeId: NodeID;
  dataType: 'number' | 'boolean' | 'enum';
  defaultValue: any; // Override to make required and allow any type

  // Additional properties
  step?: number;
  enumValues?: string[];
  group?: string;
}

export type NormalizeOptions = { from: [number, number]; to: [number, number] };
