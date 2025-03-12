import { Voice } from './Voice.js';

// VoiceManager - Manages audio voices and playback
// TODO: Clean up and implement proper voice management and polyphony,
// clarify optimal responsibilities for VoiceManager versus Voice
// add EventTarget to either or both for event handling

export class VoiceManager {
  _audioContext: AudioContext | null; // Todo: make private
  private _polyphony: number;
  private _activeVoices: Map<string, Voice>;
  private _nextId: number;
  private _bufferCache: Map<string, AudioBuffer>;
  private _eventListeners: Map<string, Function[] | Function>;
  private _isInitialized: boolean;

  constructor() {
    this._audioContext = null;
    this._activeVoices = new Map();
    this._nextId = 1;
    this._bufferCache = new Map();
    this._eventListeners = new Map();
    this._isInitialized = false;

    // Try to initialize early
    this.init();
  }

  init(): boolean {
    if (!this._audioContext) {
      this._audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 48000,
      });

      this.preCreateVoices();

      this._isInitialized = true;
      return true;
    }
    return false;
  }

  get polyphony(): number {
    return this._polyphony;
  }

  set polyphony(value: number) {
    this._polyphony = value;
  }

  preCreateVoices(count: number = this._polyphony): void {
    if (!this._audioContext || !this._isInitialized) this.init();
    for (let i = 0; i < count; i++) {
      this.createVoice(this._audioContext!.createBuffer(1, 1, 48000));
    }
  }

  async loadAudioURL(url: string): Promise<AudioBuffer> {
    if (!this._audioContext || !this._isInitialized) this.init();

    if (this._bufferCache.has(url)) {
      return this._bufferCache.get(url) as AudioBuffer;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer =
        await this._audioContext!.decodeAudioData(arrayBuffer);

      this._bufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }

  async loadAudioFile(file: File, cache: boolean = true): Promise<AudioBuffer> {
    if (!this._audioContext || !this._isInitialized) this.init();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer =
        await this._audioContext!.decodeAudioData(arrayBuffer);

      // cache by file name
      if (cache) {
        this._bufferCache.set(file.name, audioBuffer);
      }

      return audioBuffer;
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }

  createVoice(buffer: AudioBuffer): string {
    if (!this._audioContext) this.init();

    const voice = new Voice(this._audioContext!, buffer);
    const id = `voice_${this._nextId++}`;

    this._activeVoices.set(id, voice);

    return id;
  }

  getVoice(id: string): Voice | null {
    return this._activeVoices.get(id) || null;
  }

  setBuffer(voiceId: string, buffer: AudioBuffer): void {
    const voice = this.getVoice(voiceId);
    if (!voice) return;

    voice.setBuffer(buffer);
  }

  midiNoteToPlaybackRate(midiNote: number): number {
    return Math.pow(2, (midiNote - 69) / 12);
  }

  // TODO: remove voiceId and replace with internal voice management
  play(voiceId: string, midiNote?: number): boolean {
    // Try to auto-resume context if needed but don't wait for it
    if (this._audioContext?.state === 'suspended') {
      this._audioContext.resume();
    }

    const voice = this.getVoice(voiceId);
    if (!voice) return false;

    // Immediate play without waiting for Promise resolution
    voice.play(this.midiNoteToPlaybackRate(midiNote));
    return true;
  }

  stop(voiceId: string): boolean {
    const voice = this.getVoice(voiceId);
    if (!voice) return false;

    voice.stop();
    return true;
  }

  setLoopPoints(
    voiceId: string,
    loopStart: number,
    loopEnd: number,
    interpolationTime: number | null = null
  ): boolean {
    const voice = this.getVoice(voiceId);
    if (!voice) return false;

    voice.setLoopPoints(loopStart, loopEnd, interpolationTime);
    return true;
  }

  on(
    voiceId: string,
    eventName: string,
    callback: (detail: any) => void
  ): void {
    const key = `${voiceId}:${eventName}`;

    if (!this._eventListeners.has(key)) {
      this._eventListeners.set(key, []);

      if (eventName === 'loopPointsInterpolated') {
        const handler = (event: CustomEvent) => {
          const listeners = this._eventListeners.get(key) as Function[];
          listeners.forEach((cb) => cb(event.detail));
        };

        document.addEventListener(eventName, handler as EventListener);
        this._eventListeners.set(`${key}:handler`, handler);
      }
    }

    const listeners = this._eventListeners.get(key) as Function[];
    listeners.push(callback);
  }

  off(
    voiceId: string,
    eventName: string,
    callback: (detail: any) => void
  ): void {
    const key = `${voiceId}:${eventName}`;

    if (!this._eventListeners.has(key)) return;

    const listeners = this._eventListeners.get(key) as Function[];
    const index = listeners.indexOf(callback);

    if (index !== -1) {
      listeners.splice(index, 1);

      if (listeners.length === 0) {
        const handler = this._eventListeners.get(`${key}:handler`) as Function;
        if (handler) {
          document.removeEventListener(eventName, handler as EventListener);
          this._eventListeners.delete(`${key}:handler`);
        }
        this._eventListeners.delete(key);
      }
    }
  }

  // Optimized resume that returns immediately if already running
  resume(): Promise<void> {
    if (!this._audioContext) {
      this.init();
      return Promise.resolve();
    }

    if (this._audioContext.state === 'suspended') {
      return this._audioContext.resume();
    }

    return Promise.resolve();
  }

  // New method to preload/warm audio context
  preloadAudioContext(): void {
    if (!this._audioContext) this.init();

    // Create and immediately release a silent buffer to "warm up" the audio system
    if (this._audioContext) {
      const silentBuffer = this._audioContext.createBuffer(
        1,
        this._audioContext.sampleRate * 0.01, // 10ms of silence
        this._audioContext.sampleRate
      );

      const source = this._audioContext.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(this._audioContext.destination);
      source.start();
      source.stop(this._audioContext.currentTime + 0.01);
    }
  }

  destroyVoice(voiceId: string): boolean {
    const voice = this.getVoice(voiceId);
    if (!voice) return false;

    if (voice.isPlaying) {
      voice.stop();
    }

    this._activeVoices.delete(voiceId);

    const prefix = `${voiceId}:`;
    for (const key of this._eventListeners.keys()) {
      if (key.startsWith(prefix)) {
        const [, eventName] = key.split(':');
        const handler = this._eventListeners.get(`${key}:handler`) as Function;

        if (handler) {
          document.removeEventListener(eventName, handler as EventListener);
          this._eventListeners.delete(`${key}:handler`);
        }

        this._eventListeners.delete(key);
      }
    }

    return true;
  }

  destroyAllVoices(): void {
    for (const voiceId of this._activeVoices.keys()) {
      this.destroyVoice(voiceId);
    }
  }

  dispose(): void {
    this.destroyAllVoices();

    if (this._audioContext) {
      this._audioContext.close();
      this._audioContext = null;
    }
  }
}
