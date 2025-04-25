import { LibSourceNode } from '@/nodes';
import { getAudioContext } from '@/context';
import { createNodeId, deleteNodeId } from '@/store/state/IdStore';

function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 60) / 12);
}

function midiNoteToPlaybackRate(note: number, baseFrequency: number = 440) {
  const frequency = midiNoteToFrequency(note);
  return frequency / baseFrequency;
}

export class SourceNode extends AudioWorkletNode implements LibSourceNode {
  readonly nodeId: NodeID = createNodeId();
  readonly nodeType: string = 'source:default';
  readonly processorNames = ['source-processor'];

  private _isPlaying: boolean;
  private _duration: number;
  private _eventListeners: Record<string, Function[]>;

  paramMap: Map<string, AudioParam>; // Workaround for TypeScript issue with AudioParamMap

  readonly playbackRate: AudioParam;
  readonly loop: AudioParam;
  readonly loopStart: AudioParam;
  readonly loopEnd: AudioParam;
  readonly playbackPositionParam: AudioParam;

  constructor(
    context: AudioContext = getAudioContext(),
    options: { processorOptions?: any; duration?: number } = {
      processorOptions: {},
    }
  ) {
    super(context, 'source-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: options.processorOptions || {},
    });

    // The context property is already set by the parent class (super)
    this._isPlaying = false;
    this._duration = options.duration || 0;

    this.paramMap = this.parameters as Map<string, AudioParam>; // ts-error hax

    // Set up parameter properties
    this.playbackRate = this.paramMap.get('playbackRate')!;
    this.loop = this.paramMap.get('loop')!;
    this.loopStart = this.paramMap.get('loopStart')!;
    this.loopEnd = this.paramMap.get('loopEnd')!;
    this.playbackPositionParam = this.paramMap.get('playbackPosition')!;

    // Initialize loopEnd according to the samples duration
    this.loopEnd.setValueAtTime(this._duration, this.now);

    // Set up message handling
    this.port.onmessage = (event: MessageEvent) => {
      const data = event.data;

      if (data.type === 'voice:ended') {
        this._isPlaying = false;
        this.#dispatch('voice:ended', { nodeId: this.nodeId });

        // FEJWIO
      } else if (data.type === 'voice:looped') {
        this.#dispatch('voice:looped', { loopCount: data.loopCount });
      } else if (data.type === 'voice:position_and_amplitude') {
        this.playbackPositionParam.setValueAtTime(
          data.position,
          this.context.currentTime
        );
        this.#dispatch('voice:position_and_amplitude', {
          nodeId: this.nodeId,
          position: data.position,
          seconds: data.seconds,
          amplitude: data.amplitude,
        });
      }
    };

    // Set up event target
    this._eventListeners = {
      'voice:ended': [],
      'voice:started': [],
      'voice:looped': [],
      'voice:position_and_amplitude': [],
      // 'voice:amplitude': [],
    };

    this.sendToProcessor({ type: 'voice:init' });
  }

  sendToProcessor(data: any) {
    // todo: consistently type data for events // use this method to clean up others by including defaults like nodeId
    this.port.postMessage(data);
  }

  getParam(name: string): AudioParam | null {
    return this.paramMap.get(name) || null;
  }

  setParam(name: string, value: number, options: any): this {
    // TODO: optional linear, exponential ramp, setTargetAtTime etc.
    console.warn(`setParam implementation is no finished!!`);
    const param = this.paramMap.get(name);
    if (param) {
      param.setValueAtTime(value, this.now);
    }
    return this;
  }

  // Event handling
  addListener(type: string, callback: Function) {
    if (this._eventListeners[type]) {
      this._eventListeners[type].push(callback);
    }
    // this.addEventListener(event, listener); // ? check the inheritance
    return this;
  }

  removeListener(type: string, callback: Function) {
    if (this._eventListeners[type]) {
      this._eventListeners[type] = this._eventListeners[type].filter(
        (cb) => cb !== callback
      );
    }
    return this;
  }

  #dispatch(type: string, detail: Record<string, any> = {}) {
    if (this._eventListeners[type]) {
      const event = { type, detail, target: this };
      this._eventListeners[type].forEach((cb) => cb(event));
    }
    return this;
  }

  // API methods
  async loadBuffer(buffer: AudioBuffer): Promise<this> {
    if (buffer.sampleRate !== this.context.sampleRate) {
      console.warn(
        `sample rate mismatch, 
        buffer: ${buffer.sampleRate}, 
        context: ${this.context.sampleRate}`
      );
    }

    // Convert buffer if needed
    const bufferData: Float32Array[] = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      bufferData.push(buffer.getChannelData(i).slice());
    }

    this.sendToProcessor({
      type: 'voice:set_buffer',
      buffer: bufferData,
      duration: buffer.duration,
    });

    this._duration = buffer.duration;

    return this;
  }

  trigger(options: {
    midiNote: number;
    velocity?: number;
    time?: number;
    offset?: number;
    duration?: number;
  }): this {
    this._isPlaying = false; // Explicitly reset state

    // if (this._isPlaying) {
    //   console.warn(`src.play(): source already playing!`);
    //   return this;
    // }
    const {
      midiNote,
      velocity,
      time = this.now,
      offset = 0,
      duration,
    } = options;

    const noteAsRate = midiNoteToPlaybackRate(midiNote);
    this.playbackRate.setValueAtTime(noteAsRate, time);

    this.sendToProcessor({
      type: 'voice:start',
      time,
      velocity,
      offset,
      duration,
    });

    this._isPlaying = true;

    this.#dispatch('voice:started', {
      nodeId: this.nodeId,
      midiNote,
      time,
      duration,
    });

    return this;
  }

  release(options?: TODO): this {
    if (!this._isPlaying) return this;

    this.sendToProcessor({
      type: 'voice:release',
    });

    return this;
  }

  stop(): this {
    // todo: immediate stop
    if (!this._isPlaying) return this;

    this.sendToProcessor({
      type: 'voice:stop',
    });

    return this;
  }

  debugLoopParam(): void {
    const loopValue = this.loop.value;
    this.sendToProcessor({
      type: 'voice:debug-loop',
      value: loopValue,
    });
  }

  setLoopEnabled(enabled: boolean) {
    this.loop.setValueAtTime(enabled ? 1 : 0, this.now);
    return this;
  }

  setLoopStart(targetValue: number, rampTime: number = 0.1) {
    this.loopStart.linearRampToValueAtTime(targetValue, this.now + rampTime);

    return this;
  }

  setLoopEnd(targetValue: number, rampTime: number = 0.1) {
    this.loopEnd.linearRampToValueAtTime(targetValue, this.now + rampTime);

    return this;
  }

  setRate(rate: number): this {
    this.playbackRate.setValueAtTime(rate, this.now);
    return this;
  }

  // Properties
  get now() {
    return this.context.currentTime;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get duration(): number {
    return this._duration;
  }

  dispose() {
    this.stop();
    this.disconnect();
    this.port.close();
    deleteNodeId(this.nodeId);
  }
}
