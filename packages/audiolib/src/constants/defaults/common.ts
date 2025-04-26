export const DEFAULT_SAMPLE_RATE = 48000;

export const DEFAULT_VELOCITY = {
  peak: { midi: 100, normalized: 0.78125 },
  sustain: { midi: 100, normalized: 0.78125 },
} as const;

export const MIN_ABS_AMPLITUDE = 0.000001;
