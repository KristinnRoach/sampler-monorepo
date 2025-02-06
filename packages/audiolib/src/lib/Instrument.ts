// packages/audiolib/src/lib/Instrument.ts
import { AudioContextManager } from './AudioContext';
import { Voice } from './Voice';
import type { InstrumentParameters, InstrumentState } from './types';

export class Instrument {
  private voices: Voice[] = [];
  private maxVoices: number = 8; // For now
  private audioBuffer: AudioBuffer | null = null;
  private subscribers = new Set<(state: InstrumentState) => void>();

  private params: InstrumentParameters = {
    gain: 1,
    loopStart: 0,
    loopEnd: 0,
    loopEnabled: false,
  };

  private state: InstrumentState = {
    isPlaying: new Map(),
    velocity: new Map(),
    parameters: this.params,
  };

  async loadSample(arrayBuffer: ArrayBuffer) {
    this.audioBuffer =
      await AudioContextManager.createBufferFromArrayBuffer(arrayBuffer);

    // Initialize with one voice for testing
    this.voices = [
      new Voice(this.audioBuffer, {
        loop: this.params.loopEnabled,
        loopStart: this.params.loopStart,
        loopEnd: this.params.loopEnd,
      }),
    ];
  }

  triggerNote(noteNumber: number, velocity: number = 1) {
    if (!this.arrayBuffer) return;

    // Find free voice or steal one
    let voice = this.voices.find((v) => !v.isPlaying);
    if (!voice && this.voices.length < this.maxVoices) {
      voice = new Voice(this.arrayBuffer, {
        loop: this.params.loopEnabled,
        loopStart: this.params.loopStart,
        loopEnd: this.params.loopEnd,
      });
      this.voices.push(voice);
    }

    if (voice) {
      voice.trigger(noteNumber, velocity);
      this.state.isPlaying.set(noteNumber, true);
      this.state.velocity.set(noteNumber, velocity);
      this.notifySubscribers();
    }
  }

  releaseNote(noteNumber: number) {
    const voice = this.voices.find((v) => v.currentNote === noteNumber);
    if (voice) {
      voice.release();
      this.state.isPlaying.delete(noteNumber);
      this.state.velocity.delete(noteNumber);
      this.notifySubscribers();
    }
  }

  setParameter<K extends keyof InstrumentParameters>(
    key: K,
    value: InstrumentParameters[K]
  ) {
    this.params[key] = value;

    // Apply parameter changes to all voices
    if (key === 'loopStart' || key === 'loopEnd') {
      this.voices.forEach((voice) =>
        voice.setLoopPoints(this.params.loopStart, this.params.loopEnd)
      );
    } else if (key === 'loopEnabled') {
      this.voices.forEach((voice) => voice.setLoopEnabled(value as boolean));
    }

    this.state.parameters = { ...this.params };
    this.notifySubscribers();
  }

  onStateChange(callback: (state: InstrumentState) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.state));
  }
}
