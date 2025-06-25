import type { EnvelopeType, EnvelopeData } from './env-types';

export const ENV_DEFAULTS: Record<EnvelopeType, EnvelopeData> = {
  default: {
    points: [
      { time: 0, value: 0, curve: 'exponential' },
      { time: 0.01, value: 1, curve: 'exponential' },
      { time: 1, value: 0.000001, curve: 'exponential' },
    ],
    loop: false,
  },

  'amp-env': {
    points: [
      { time: 0, value: 0, curve: 'exponential' },
      { time: 0.01, value: 1, curve: 'exponential' },
      { time: 1, value: 0.000001, curve: 'exponential' },
    ],
    loop: false,
  },

  'pitch-env': {
    points: [
      { time: 0, value: 0, curve: 'exponential' },
      { time: 0.01, value: 0, curve: 'exponential' },
      { time: 1, value: 0, curve: 'linear' },
    ],
    loop: false,
  },

  'loop-env': {
    points: [
      { time: 0, value: 0, curve: 'exponential' },
      { time: 0.01, value: 0, curve: 'exponential' },
      { time: 1, value: 0, curve: 'linear' },
    ],
    loop: false,
  },
} as const;
