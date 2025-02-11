// src/audiolib.ts - Main class and factory
// import { AudioContext } from 'standardized-audio-context';
// import { AudioLibConfig } from './types';
// import { createAudioContext } from './core/context';
// import { Sampler } from './instruments/sampler';
import { AudioContextManager } from './AudioContext';
import { AudioLibConfig, AUDIOLIB_DEFAULTS } from './config';

export function createAudiolib(config?: AudioLibConfig) {
  return new Audiolib(config);
}

export class Audiolib {
  private context: AudioContext | null = null;
  private config: AudioLibConfig;

  constructor(config?: AudioLibConfig) {
    this.config = config || AUDIOLIB_DEFAULTS;

    console.log('Audiolib created. Call initialize() to start.');
  }

  async initialize(): Promise<void> {
    this.context = await AudioContextManager.getInstance(this.config.audio);
  }

  //   createSampler(options?: any): Sampler {
  //     return new Sampler(this.context, options);
  //   }

  dispose(): void {
    this.context?.close();
  }
}
