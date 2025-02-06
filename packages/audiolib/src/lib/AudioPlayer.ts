// packages/audiolib/src/lib/AudioPlayer.ts
import { AudioContextManager } from './AudioContext';
import type { AudioPlayerOptions } from './types';

export class AudioPlayer {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private isLoaded = false;
  private options: AudioPlayerOptions = {
    volume: 1,
    loop: false,
    loopStart: 0,
    loopEnd: 0,
  };

  get loaded(): boolean {
    return this.isLoaded;
  }

  constructor(options?: AudioPlayerOptions) {
    this.options = { ...this.options, ...options };
  }

  async load(arrayBuffer: ArrayBuffer): Promise<void> {
    this.context = await AudioContextManager.getInstance();
    this.buffer =
      await AudioContextManager.createBufferFromArrayBuffer(arrayBuffer);
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    this.setVolume(this.options.volume || 1);
    this.isLoaded = true;
  }

  play(): void {
    if (!this.context || !this.buffer) {
      throw new Error('Audio not loaded');
    }

    this.stop();
    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = this.options.loop || false;

    if (this.options.loop) {
      this.source.loopStart = this.options.loopStart || 0;
      this.source.loopEnd = this.options.loopEnd || this.buffer.duration;
    }

    if (this.gainNode) {
      this.source.connect(this.gainNode);
    }

    this.source.start();
  }

  setLoopPoints(start: number, end: number): void {
    this.options.loopStart = start;
    this.options.loopEnd = end;

    if (this.source && this.source.loop) {
      this.source.loopStart = start;
      this.source.loopEnd = end;
    }
  }

  setLoopEnabled(enabled: boolean): void {
    this.options.loop = enabled;
    if (this.source) {
      this.source.loop = enabled;
    }
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // Ignore errors if source already stopped
      }
      this.source = null;
    }
  }

  setVolume(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
    this.options.volume = value;
  }

  isPlaying(): boolean {
    return this.source !== null;
  }
}
