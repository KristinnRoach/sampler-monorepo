// todo: remove the .d extension ?

export interface AudioParamDescriptor {
  name: string;
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
  automationRate: 'a-rate' | 'k-rate';
}

export interface ProcessorDefinition {
  processFunction: Function;
  params?: AudioParamDescriptor[];
  options?: Record<string, unknown>;
}
