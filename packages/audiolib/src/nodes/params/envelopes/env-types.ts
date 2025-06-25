export type EnvelopeType = 'amp-env' | 'pitch-env' | 'loop-env' | 'default';

export interface EnvelopePoint {
  time: number; // 0-1 normalized
  value: number; // 0-1
  curve?: 'linear' | 'exponential'; // Curve type to next point
}

export type { EnvelopeData } from './Envelope';

// export interface EnvelopeData {
//   points: EnvelopePoint[];
//   loop?: boolean;
// }
