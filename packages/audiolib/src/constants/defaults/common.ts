import { normalizeMidi } from '@/utils';

export const audio = {
  sampleRate: 48000,
  numberOfChannels: 2,
};

export const midi = {
  note: 60,
  note_normalized: normalizeMidi(60),
  velocity: 100,
  velocity_normalized: normalizeMidi(100),
};

export const DEFAULT_SAMPLE_RATE = 48000;

export const DEFAULT_SOURCE_PROPS = {
  nrInputs: 0,
  nrOutputs: 1,
  playbackRate: 1,
  loop: false,
  startTime: 0,
  loopStart: 0,
};
