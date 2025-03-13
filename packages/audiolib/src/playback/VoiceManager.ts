import { Voice } from './Voice.js';

// VoiceManager - Manages audio voices and playback
export class SamplePlayer {
  // most practical abstractions for the use case? Instrument / Player / VoiceManager.. no redundant classes, use utility / factory functions and interfaces where feasible
  _audioContext: AudioContext | null; // Todo: make private
  private _buffer: AudioBuffer;
  // Todo: separate responsibilities, single source of truth: this or Voice or delegate (to AudioContext? or buffermanager)

  private _polyphony: number;
  private _voices: Map<string, Voice>;
  private _nextId: number;
  private _bufferCache: Map<string, AudioBuffer>;
  private _eventListeners: Map<string, Function[] | Function>;
  private _isInitialized: boolean;

  constructor(polyphony: number = 8) {
    this._audioContext = null;
    this._voices = new Map();
    this._nextId = 1;
    this._bufferCache = new Map();
    this._eventListeners = new Map();
    this._isInitialized = false;
    this._polyphony = polyphony;

    // Try to initialize early
    this.init();
  }

  // Must be called in response to user interaction e.g. first click
  async init(): Promise<boolean> {
    if (this.initAudioContext()) {
      await this.ensureAudioContext();
      this._isInitialized = true;

      // // Create a default voice and set it as current
      // if (!this._voices.size && !this._buffer) {
      //   const emptyBuffer = this._audioContext!.createBuffer(1, 1, 48000);
      // }

      console.log('Audio context initialized');
      return true;
    }
    console.warn('Failed to initialize audio context');
    return false;
  }

  initAudioContext(): boolean {
    if (!this._audioContext) {
      try {
        this._audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)({
          latencyHint: 'interactive',
          sampleRate: 48000,
        });
        return true;
      } catch (error) {
        console.error('Failed to create AudioContext:', error);
        return false;
      }
    }
    return true;
  }

  async ensureAudioContext(): Promise<boolean> {
    if (!this._audioContext) {
      return this.init();
    }

    try {
      await this._audioContext.resume();
      return this._audioContext.state === 'running';
    } catch (error) {
      console.error('Failed to resume AudioContext:', error);
      return false;
    }
  }

  get polyphony(): number {
    return this._polyphony;
  }

  set polyphony(value: number) {
    this._polyphony = value;
  }

  // // Get the current default voice ID
  // getCurrentVoiceId(): string {
  //   if (!this._currentVoiceId) {
  //     // Create a default voice if none exists
  //     const emptyBuffer = this._audioContext!.createBuffer(1, 1, 48000);
  //     this._currentVoiceId = this.createVoice(emptyBuffer);
  //   }
  //   return this._currentVoiceId;
  // }

  // // Set the current default voice ID
  // setCurrentVoiceId(voiceId: string): boolean {
  //   if (this._voices.has(voiceId)) {
  //     this._currentVoiceId = voiceId;
  //     return true;
  //   }
  //   return false;
  // }

  async _preCreateVoices(
    buffer: AudioBuffer | undefined = this._buffer,
    count: number = this._polyphony
  ): Promise<void> {
    if (!this._isInitialized) {
      await this.init();
    }

    if (!buffer) {
      buffer = this._audioContext!.createBuffer(1, 1, 48000);
      console.warn('buffer has not been set, creating empty voices');
    }

    for (let i = 0; i < count; i++) {
      this.createVoice(buffer);
    }
  }

  // Modified to return a Promise to avoid freezing
  async loadAudioFile(
    arrayBuffer: ArrayBuffer,
    cache: boolean = true,
    fileName?: string
  ): Promise<AudioBuffer> {
    if (!this._audioContext || !this._isInitialized) {
      await this.init();
    }

    await this.ensureAudioContext();

    try {
      // Use a Promise to handle audio decoding asynchronously
      const audioBuffer =
        await this._audioContext!.decodeAudioData(arrayBuffer);

      // Cache by file name if provided
      if (cache && fileName) {
        this._bufferCache.set(fileName, audioBuffer);
      }

      return audioBuffer;
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }

  createVoice(buffer: AudioBuffer): string {
    if (!this._audioContext) {
      // todo: clear system for where this check is needed
      throw new Error(
        'Audio not initialized - If already called init(), try ensureAudioContext()'
      );
    }

    if (this._voices.size >= this._polyphony) {
      throw new Error(
        'Polyphony limit reached, voices.size: ' +
          this._voices.size +
          'nextId: ' +
          this._nextId +
          'polyphony: ' +
          this._polyphony
        // extra checks for debugging, ensure these values are the same
      );
    }

    const voice = new Voice(this._audioContext, buffer);
    const id = `voice_${this._nextId++}`;

    this._voices.set(id, voice); // caller of createVoice sets it as next voice ??

    return id;
  }

  getVoice(voiceId: string): Voice | null {
    // If no voiceId provided, use the current default
    const id = voiceId;
    return this._voices.get(id) || null;
  }

  // Get an available inactive voice, // Todo: update and fix
  _getFreeVoice(): Voice {
    // Look for an inactive voice
    for (const voice of this._voices.values()) {
      if (!voice.isPlaying) {
        return voice;
      }
    }
    throw new Error('All voices are currently active');
  }

  // Modified to accept optional voiceId
  setBuffer(buffer: AudioBuffer): boolean {
    // todo: multiple buffers?
    // possibly allow setting buffer for a specific voice voiceId?: string = null

    this._buffer = buffer;
    // todo: validate buffer (return false if fails)
    // todo: clean up previous voices
    this.destroyAllVoices();

    this._preCreateVoices(buffer);
    return true;
  }

  midiNoteToPlaybackRate(midiNote: number): number {
    return Math.pow(2, (midiNote - 69) / 12);
  }

  // Modified to use optional voiceId
  play(midiNote?: number, voiceId?: string): boolean {
    // Try to auto-resume context if needed but don't wait for it
    if (this._audioContext?.state === 'suspended') {
      this._audioContext.resume();
    }

    if (!this._buffer) {
      console.warn('No buffer set, cannot play');
      return false;
    }

    const voice = this._getFreeVoice();
    if (!voice) return false; //fix

    // Apply MIDI note if provided, otherwise use default rate (1.0)
    const rate =
      midiNote !== undefined ? this.midiNoteToPlaybackRate(midiNote) : 1.0;

    console.log('midinote: ', midiNote, 'rate: ', rate);
    voice.play(rate);
    return true;
  }

  // Modified to use optional voiceId
  stop(voiceId?: string): boolean {
    let voice = this.getVoice(voiceId); // TODO: Fix - keyboard handler - midinote id?
    if (!voice) {
      voice = this._getFreeVoice(); // TEMPFIX FOR NOW !!!
    }

    voice.stop();
    return true;
  }

  stopAll(): void {
    for (const voice of this._voices.values()) {
      voice.stop();
    }
  }

  setLoopPoint(
    value_ms: number,
    param: 'loopStart' | 'loopEnd',
    interpolationTime_ms: number | null = null
    //voiceId?: string
  ): boolean {
    // const voice = this.getVoice(); // FOR ALL VOICES?? voiceId);
    const voice = this._getFreeVoice(); // TEMP FIX
    if (!voice) return false;

    voice.setLoopPoint(value_ms, param, interpolationTime_ms);
    return true;
  }

  // Modified event handling to use optional voiceId // Todo: check if this is bs
  on(
    eventName: string,
    callback: (detail: any) => void,
    voiceId: string
  ): void {
    const id = voiceId;
    if (!id) return;

    const key = `${id}:${eventName}`;

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

  // Modified event handling to use optional voiceId
  off(
    eventName: string,
    callback: (detail: any) => void,
    voiceId: string
  ): void {
    const id = voiceId;
    const key = `${id}:${eventName}`;

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

  async resume(): Promise<void> {
    if (!this._audioContext) {
      await this.init();
      return;
    }

    if (this._audioContext.state === 'suspended') {
      await this._audioContext.resume();
    }
  }

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

    this._voices.delete(voiceId);

    // // If this was the current voice, set to null
    // if (this._currentVoiceId === voiceId) {
    //   this._currentVoiceId = null;
    // }

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
    for (const voiceId of this._voices.keys()) {
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
