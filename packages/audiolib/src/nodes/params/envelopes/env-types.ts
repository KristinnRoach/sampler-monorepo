export type EnvelopeType = 'amp-env' | 'pitch-env' | 'loop-env' | 'default';

export type EnvelopePoint = {
  time: number; // 0-1 normalized
  value: number; // 0-1
  curve?: 'linear' | 'exponential'; // Curve type to next point
};
