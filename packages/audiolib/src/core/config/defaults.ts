import type { AudioLibConfig, WebAudioConfig } from './types';

export const AUDIOLIB_DEFAULTS: AudioLibConfig = {
  audio: {
    // type: WebAudioConfig
    sampleRate: 48000,
    options: {
      latencyHint: 'interactive', // Todo: Explore other options for minimal latency
    } as const,
  } as const,
} as const;
