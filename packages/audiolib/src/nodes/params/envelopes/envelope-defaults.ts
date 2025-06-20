import type { EnvelopePoint } from '..';

export const DEFAULT_AMP_ENV: EnvelopePoint[] = [
  { time: 0, value: 0, curve: 'exponential' },
  { time: 0.01, value: 1, curve: 'exponential' },
  { time: 1, value: 0.000001, curve: 'exponential' },
];

export const DEFAULT_PITCH_ENV: EnvelopePoint[] = [
  { time: 0, value: 0, curve: 'exponential' },
  { time: 0.01, value: 0, curve: 'exponential' },
  { time: 1, value: 0, curve: 'linear' },
];
