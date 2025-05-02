declare const global: typeof globalThis;

export class MockAudioBuffer implements AudioBuffer {
  _channelData: Float32Array[]; // Made public for testing purposes
  private _length: number;
  private _sampleRate: number;
  private _numberOfChannels: number;

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this._length = length;
    this._sampleRate = sampleRate;
    this._numberOfChannels = numberOfChannels;

    // Initialize with silent channels by default
    this._channelData = Array(numberOfChannels)
      .fill(null)
      .map(() => new Float32Array(length));
  }

  get length() {
    return this._length;
  }

  get sampleRate() {
    return this._sampleRate;
  }

  get numberOfChannels() {
    return this._numberOfChannels;
  }

  get duration() {
    return this._length / this._sampleRate;
  }

  getChannelData(channel: number): Float32Array {
    if (channel >= this._numberOfChannels) {
      throw new Error(`Channel index ${channel} out of bounds`);
    }
    return this._channelData[channel];
  }

  copyFromChannel(
    destination: Float32Array,
    channelNumber: number,
    startInChannel?: number
  ): void {
    const source = this.getChannelData(channelNumber);
    const start = startInChannel || 0;
    destination.set(source.subarray(start, start + destination.length));
  }

  copyToChannel(
    source: Float32Array,
    channelNumber: number,
    startInChannel?: number
  ): void {
    const destination = this.getChannelData(channelNumber);
    const start = startInChannel || 0;
    destination.set(source, start);
  }
}

export class MockOfflineAudioContext implements OfflineAudioContext {
  private _length: number = 0;
  private _sampleRate: number = 44100;
  private _numberOfChannels: number = 2;

  // Required event handlers
  oncomplete:
    | ((this: BaseAudioContext, ev: OfflineAudioCompletionEvent) => any)
    | null = null;
  onstatechange: ((this: BaseAudioContext, ev: Event) => any) | null = null;

  constructor(options: OfflineAudioContextOptions);
  constructor(numberOfChannels: number, length: number, sampleRate: number);
  constructor(
    optionsOrChannels: OfflineAudioContextOptions | number,
    length?: number,
    sampleRate?: number
  ) {
    if (typeof optionsOrChannels === 'number') {
      // Handle constructor(numberOfChannels, length, sampleRate)
      this._numberOfChannels = Math.max(1, optionsOrChannels);
      this._length = Math.max(0, length || 0);
      this._sampleRate = Math.max(3000, sampleRate || 44100);
    } else {
      // Handle constructor(options)
      const defaultOptions: Required<OfflineAudioContextOptions> = {
        numberOfChannels: 2,
        length: 0,
        sampleRate: 44100,
      };
      const opts = { ...defaultOptions, ...optionsOrChannels };

      this._numberOfChannels = Math.max(1, opts.numberOfChannels);
      this._length = Math.max(0, opts.length);
      this._sampleRate = Math.max(3000, opts.sampleRate);
    }
  }

  get length(): number {
    return this._length;
  }

  get numberOfChannels(): number {
    return this._numberOfChannels;
  }

  get sampleRate(): number {
    return this._sampleRate;
  }

  // AudioContext properties
  baseLatency: number = 0;
  outputLatency: number = 0;
  audioWorklet: AudioWorklet = {} as AudioWorklet;
  currentTime: number = 0;
  destination: AudioDestinationNode = {} as AudioDestinationNode;
  listener: AudioListener = {} as AudioListener;
  state: AudioContextState = 'running';

  // OfflineAudioContext methods
  startRendering(): Promise<AudioBuffer> {
    throw new Error('Method not implemented.');
  }
  suspend(suspendTime: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  resume(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  close(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // AudioContext methods
  createAnalyser(): AnalyserNode {
    throw new Error('Method not implemented.');
  }
  createBiquadFilter(): BiquadFilterNode {
    throw new Error('Method not implemented.');
  }
  createBuffer(
    numberOfChannels: number,
    length: number,
    sampleRate: number
  ): AudioBuffer {
    // Create a truly silent buffer when called directly
    const buffer = new MockAudioBuffer(numberOfChannels, length, sampleRate);

    // Clear all channel data to ensure silence
    for (let i = 0; i < numberOfChannels; i++) {
      const channel = new Float32Array(length);
      channel.fill(0);
      (buffer as any)._channelData[i] = channel;
    }

    return buffer;
  }
  createBufferSource(): AudioBufferSourceNode {
    throw new Error('Method not implemented.');
  }
  createChannelMerger(numberOfInputs: number = 6): ChannelMergerNode {
    throw new Error('Method not implemented.');
  }
  createChannelSplitter(numberOfOutputs: number = 6): ChannelSplitterNode {
    throw new Error('Method not implemented.');
  }
  createConstantSource(): ConstantSourceNode {
    throw new Error('Method not implemented.');
  }
  createConvolver(): ConvolverNode {
    throw new Error('Method not implemented.');
  }
  createDelay(maxDelayTime: number = 1): DelayNode {
    throw new Error('Method not implemented.');
  }
  createDynamicsCompressor(): DynamicsCompressorNode {
    throw new Error('Method not implemented.');
  }
  createGain(): GainNode {
    throw new Error('Method not implemented.');
  }
  createIIRFilter(feedforward: number[], feedback: number[]): IIRFilterNode {
    throw new Error('Method not implemented.');
  }
  createOscillator(): OscillatorNode {
    throw new Error('Method not implemented.');
  }
  createPanner(): PannerNode {
    throw new Error('Method not implemented.');
  }
  createPeriodicWave(
    real: number[] | Float32Array,
    imag: number[] | Float32Array,
    constraints?: PeriodicWaveConstraints
  ): PeriodicWave {
    throw new Error('Method not implemented.');
  }
  createScriptProcessor(
    bufferSize: number = 0,
    numberOfInputChannels: number = 2,
    numberOfOutputChannels: number = 2
  ): ScriptProcessorNode {
    throw new Error('Method not implemented.');
  }
  createStereoPanner(): StereoPannerNode {
    throw new Error('Method not implemented.');
  }
  createWaveShaper(): WaveShaperNode {
    throw new Error('Method not implemented.');
  }
  decodeAudioData(
    audioData: ArrayBuffer,
    successCallback?: DecodeSuccessCallback | null,
    errorCallback?: DecodeErrorCallback | null
  ): Promise<AudioBuffer> {
    throw new Error('Method not implemented.');
  }

  addEventListener<K extends keyof OfflineAudioContextEventMap>(
    type: K,
    listener: (
      this: OfflineAudioContext,
      ev: OfflineAudioContextEventMap[K]
    ) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    // No-op implementation
  }

  removeEventListener<K extends keyof OfflineAudioContextEventMap>(
    type: K,
    listener: (
      this: OfflineAudioContext,
      ev: OfflineAudioContextEventMap[K]
    ) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    // No-op implementation
  }

  dispatchEvent(event: Event): boolean {
    return false;
  }
}

declare global {
  // These types need to match the real interfaces exactly
  var AudioBuffer: {
    prototype: AudioBuffer;
    new (options: AudioBufferOptions): AudioBuffer;
  };
  var OfflineAudioContext: {
    prototype: OfflineAudioContext;
    new (contextOptions: OfflineAudioContextOptions): OfflineAudioContext;
    new (
      numberOfChannels: number,
      length: number,
      sampleRate: number
    ): OfflineAudioContext;
  };
}

// Add mocks to global scope with correct type assertions
if (typeof global !== 'undefined') {
  // We're in Node/test environment
  global.AudioBuffer = MockAudioBuffer as unknown as typeof AudioBuffer;
  global.OfflineAudioContext =
    MockOfflineAudioContext as unknown as typeof OfflineAudioContext;
} else {
  // We're in browser environment
  (window as any).AudioBuffer =
    MockAudioBuffer as unknown as typeof AudioBuffer;
  (window as any).OfflineAudioContext =
    MockOfflineAudioContext as unknown as typeof OfflineAudioContext;
}
