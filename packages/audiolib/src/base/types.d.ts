// Todo: check if .d.ts is beneficial or not (might help if worklet processors are vanilla js)
export interface AudioParamDescriptor {
  name: string;
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
  automationRate: 'a-rate' | 'k-rate';
}
