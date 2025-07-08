export type EnvelopeType =
  | 'amp-env'
  | 'pitch-env'
  | 'filter-env'
  | 'loop-env'
  | 'default';

export type EnvelopePoint = {
  time: number; // Absolute time in seconds
  value: number; // 0-1 normalized
  curve?: 'linear' | 'exponential'; // Curve type to next point
};
