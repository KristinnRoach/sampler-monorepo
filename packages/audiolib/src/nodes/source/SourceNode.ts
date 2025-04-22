import { getAudioContext } from '@/context';
import { createNodeId } from '@/store/IdStore';

function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 60) / 12);
}

function midiNoteToPlaybackRate(note: number, baseFrequency: number = 440) {
  const frequency = midiNoteToFrequency(note);
  return frequency / baseFrequency;
}

export class SourceNode extends AudioWorkletNode {
  readonly nodeId: NodeID = createNodeId();
  readonly nodeType: string = 'source:default';

  private _isPlaying: boolean;
  private _duration: number;
  private _eventListeners: Record<string, Function[]>;

  paramMap: Map<string, AudioParam>; // Workaround for TypeScript issue with AudioParamMap

  // Add type definitions for parameter properties
  readonly playbackRate: AudioParam;
  readonly loop: AudioParam;
  readonly loopStart: AudioParam;
  readonly loopEnd: AudioParam;

  constructor(
    context: AudioContext = getAudioContext(),
    options: { processorOptions?: any; duration?: number } = {
      processorOptions: {},
    }
  ) {
    // Pass the processor name and options to the parent constructor
    super(context, 'source-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: options.processorOptions || {},
    });

    // Don't set context property, it's already set by the parent class (super)
    this._isPlaying = false;
    this._duration = options.duration || 0;

    this.paramMap = this.parameters as Map<string, AudioParam>; // ts-error hax

    // Set up parameter properties
    this.playbackRate = this.paramMap.get('playbackRate')!;
    this.loop = this.paramMap.get('loop')!;
    this.loopStart = this.paramMap.get('loopStart')!;
    this.loopEnd = this.paramMap.get('loopEnd')!;

    this.loopEnd.setValueAtTime(this._duration, this.context.currentTime);

    // Set up message handling
    this.port.onmessage = this._handleMessage.bind(this);

    // Set up event target
    this._eventListeners = {
      ended: [],
      started: [],
      looped: [],
    };
  }

  // Event handling
  addListener(type: string, callback: Function): void {
    if (this._eventListeners[type]) {
      this._eventListeners[type].push(callback);
    }
  }

  removeListener(type: string, callback: Function): void {
    if (this._eventListeners[type]) {
      this._eventListeners[type] = this._eventListeners[type].filter(
        (cb) => cb !== callback
      );
    }
  }

  _dispatchEvent(type: string, detail: Record<string, any> = {}): void {
    if (this._eventListeners[type]) {
      const event = { type, detail, target: this };
      this._eventListeners[type].forEach((cb) => cb(event));
    }
  }

  // Handle messages from processor
  _handleMessage(event: MessageEvent): void {
    const data = event.data;

    if (data.type === 'ended') {
      this._isPlaying = false;
      this._dispatchEvent('ended');
    } else if (data.type === 'looped') {
      this._dispatchEvent('looped', { loopCount: data.loopCount });
    }
  }

  // API methods
  async loadBuffer(buffer: AudioBuffer, sampleRate?: number): Promise<this> {
    // Convert buffer if needed
    const bufferData: Float32Array[] = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      bufferData.push(buffer.getChannelData(i).slice());
    }

    this.port.postMessage({
      type: 'setBuffer',
      buffer: bufferData,
      sampleRate: sampleRate || this.context.sampleRate,
      duration: buffer.duration,
    });

    this._duration = buffer.duration;

    return this;
  }

  play(options: {
    midiNote: number;
    time?: number;
    offset?: number;
    duration?: number;
  }): this {
    const {
      midiNote,
      time = this.context.currentTime,
      offset = 0,
      duration,
    } = options;
    // First stop if already playing // Should not happen!
    if (this._isPlaying) {
      console.warn(`source already playing when play() called!`);
    }
    // this.stop(); //?! Necessary to prevent race condition? // ! causes active notes / sampler.stop() bug? !
    this._isPlaying = false; // Explicitly reset state

    const playbackRate = midiNoteToPlaybackRate(midiNote);
    this.playbackRate.setValueAtTime(playbackRate, time);

    // ? should just be handled by param ? // Get the current value of the loop parameter
    // const loopEnabled = this.loop.value > 0.5;

    this.port.postMessage({
      type: 'start',
      time,
      offset,
      duration,
      // loopEnabled,
    });

    this._isPlaying = true;
    this._dispatchEvent('started', { offset });

    return this;
  }

  stop(): this {
    if (!this._isPlaying) return this;

    this.port.postMessage({
      type: 'stop',
      time: this.context.currentTime,
    });

    this._isPlaying = false;
    return this;
  }

  debugLoopParam(): void {
    const loopValue = this.loop.value;
    this.port.postMessage({
      type: 'debug-loop',
      value: loopValue,
    });
  }

  setLoopEnabled(enabled: 1 | 0) {
    // boolean
    this.loop.setValueAtTime(enabled ? 1 : 0, this.context.currentTime);
    // this.loopEnd.setValueAtTime(1, 0); // ! temp fix until macros work
    return this;
  }

  setLoopStart(targetValue: number, rampTime: number = 0.1) {
    this.loopStart.linearRampToValueAtTime(
      targetValue,
      this.context.currentTime + rampTime
    );

    return this;
  }

  setLoopEnd(targetValue: number, rampTime: number = 0.1) {
    console.log(`loopEnd before value: ${this.loopEnd.value}`);

    this.loopEnd.linearRampToValueAtTime(
      targetValue,
      this.context.currentTime + rampTime
    );

    console.log(
      `setting loopEnd to target ${targetValue} at ${this.context.currentTime + rampTime}`
    );
    // log actual value
    setTimeout(() => {
      console.log(`loopEnd after setting value: ${this.loopEnd.value}`);
    }, 50);

    return this;
  }

  setRate(rate: number): this {
    this.playbackRate.setValueAtTime(rate, this.context.currentTime);
    return this;
  }

  // Properties
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get duration(): number {
    return this._duration;
  }
}
