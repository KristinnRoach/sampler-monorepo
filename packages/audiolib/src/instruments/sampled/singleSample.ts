// src/instruments/internal/sampler-engine.ts - Internal implementation
// import type { AudioContext } from 'standardized-audio-context';
// import { Voice } from './voice';
// import type { SamplerOptions } from '../../types';

export class SingleSampleInstrument {
  // private voices: Map<number, Voice> = new Map();
  private sample: AudioBuffer | null = null;

  constructor(
    private context: AudioContext,
    private output: AudioNode
    // private options: SamplerOptions = {}
  ) {}

  setSample(buffer: AudioBuffer): void {
    this.sample = buffer;
  }

  // noteOn(note: number, velocity: number): void {
  //   if (!this.sample) return;

  //   const voice = new Voice(this.context, this.output, this.options);
  //   voice.start(this.sample, note, velocity);
  //   this.voices.set(note, voice);
  // }

  // noteOff(note: number): void {
  //   const voice = this.voices.get(note);
  //   if (voice) {
  //     voice.release();
  //     this.voices.delete(note);
  //   }
  // }
}
