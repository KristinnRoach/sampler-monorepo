import {
  LibVoiceNode,
  VoiceType,
  Messenger,
  Destination,
  Connectable,
} from '@/nodes/LibNode';
import { getAudioContext } from '@/context';
import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';
import { VoiceState, ActiveNoteId, MidiValue } from '../types';
import { DEFAULT_TRIGGER_OPTIONS } from '../constants';

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

import {
  assert,
  cancelScheduledParamValues,
  midiToPlaybackRate,
} from '@/utils';
import { LibParamDescriptor } from '@/nodes/params/types';
// import { toAudioParamDescriptor } from '@/nodes/params/param-utils';

// TODO: UNITE PARAM DESCRIPTORS FOR VOICES AND INSTRUMENTS

// Define descriptors for voice parameters
export const SAMPLE_VOICE_PARAM_DESCRIPTORS: Record<
  string,
  LibParamDescriptor
> = {
  playbackRate: {
    nodeId: 'playbackRate',
    name: 'playbackRate',
    valueType: 'number',
    minValue: 0.1,
    maxValue: 10,
    defaultValue: 0,
    group: 'playback',
    automationRate: 'k-rate', // Ensure consistency with actual AudioParamDescriptor in processor
  },
  envGain: {
    nodeId: 'envGain',
    name: 'envGain',
    valueType: 'number',
    minValue: 0,
    maxValue: 1,
    defaultValue: 1,
    group: 'envelope',
    automationRate: 'k-rate',
  },
  startOffset: {
    nodeId: 'startOffset',
    name: 'startOffset',
    valueType: 'number',
    minValue: 0,
    defaultValue: 0,
    group: 'playback',
    automationRate: 'k-rate',
  },
  endOffset: {
    nodeId: 'endOffset',
    name: 'endOffset',
    valueType: 'number',
    minValue: 0,
    defaultValue: 1,
    group: 'playback',
    automationRate: 'k-rate',
  },
  loopStart: {
    nodeId: 'loopStart',
    name: 'loopStart',
    valueType: 'number',
    minValue: 0,
    defaultValue: 0,
    group: 'loop',
    automationRate: 'k-rate',
  },
  loopEnd: {
    nodeId: 'loopEnd',
    name: 'loopEnd',
    valueType: 'number',
    minValue: 0,
    defaultValue: 1,
    group: 'loop',
    automationRate: 'k-rate',
  },
  velocity: {
    nodeId: 'velocity',
    name: 'velocity',
    valueType: 'number',
    minValue: 0,
    maxValue: 127,
    defaultValue: 64,
    group: 'voice',
    automationRate: 'k-rate',
  },
};

export class SampleVoice implements LibVoiceNode, Connectable, Messenger {
  readonly nodeId: NodeID;
  readonly nodeType: VoiceType = 'sample';

  #outputNode: AudioNode;

  #worklet: AudioWorkletNode;
  #messages: MessageBus<Message>;
  #state: VoiceState = VoiceState.IDLE;
  #isReady: boolean = false;
  #currentNoteId: number | string | null = null;
  #startedTimestamp: number = -1;
  #destination: Destination | null = null;

  #hpf: BiquadFilterNode | null = null;
  #lpf: BiquadFilterNode | null = null;
  #filtersEnabled: boolean;

  #attackSec: number = 0.001; // Default attack time
  #releaseSec: number = 0.1; // Default release time

  #hpfHz: number = 100; // High-pass filter frequency
  #lpfHz: number; // Low-pass filter frequency needs to be set using audio context sample rate
  #lpfQ: number = 1; // Low-pass filter Q factor
  #hpfQ: number = 1; // High-pass filter Q factor

  // static readonly paramDescriptors = SAMPLE_VOICE_PARAM_DESCRIPTORS;
  // // Converts descriptors to AudioWorkletNode format
  // static getAudioParamDescriptors(): AudioParamDescriptor[] {
  //   return Object.values(SAMPLE_VOICE_PARAM_DESCRIPTORS).map(
  //     toAudioParamDescriptor
  //   );
  // }

  constructor(
    private context: AudioContext = getAudioContext(),
    options: { processorOptions?: any; enableFilters?: boolean } = {}
  ) {
    this.nodeId = createNodeId(this.nodeType);
    this.#messages = createMessageBus<Message>(this.nodeId);

    // Update AudioWorkletNode initialization with parameter data
    this.#worklet = new AudioWorkletNode(context, 'sample-player-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      // Initialize with parameter data
      // parameterData: {
      //   envGain: SAMPLE_VOICE_PARAM_DESCRIPTORS.envGain.defaultValue,
      //   playbackRate: SAMPLE_VOICE_PARAM_DESCRIPTORS.playbackRate.defaultValue,
      //   startOffset: SAMPLE_VOICE_PARAM_DESCRIPTORS.startOffset.defaultValue,
      //   endOffset: SAMPLE_VOICE_PARAM_DESCRIPTORS.endOffset.defaultValue,
      //   loopStart: SAMPLE_VOICE_PARAM_DESCRIPTORS.loopStart.defaultValue,
      //   loopEnd: SAMPLE_VOICE_PARAM_DESCRIPTORS.loopEnd.defaultValue,
      //   velocity: SAMPLE_VOICE_PARAM_DESCRIPTORS.velocity.defaultValue,
      //   playbackPosition: 0, // Also defined in the processor
      // },
      processorOptions: options.processorOptions || {},
    });

    // Set low-pass filter frequency based on context sample rate
    this.#lpfHz = this.context.sampleRate / 2 - 100;
    this.#filtersEnabled = options.enableFilters ?? true;

    // Create filters if enabled
    if (this.#filtersEnabled) {
      this.#hpf = new BiquadFilterNode(context, {
        type: 'highpass',
        frequency: this.#hpfHz,
        Q: this.#hpfQ,
      });
      this.#lpf = new BiquadFilterNode(context, {
        type: 'lowpass',
        frequency: this.#lpfHz,
        Q: this.#lpfQ,
      });

      // Connect chain: worklet → hpf → lpf
      this.#worklet.connect(this.#hpf);
      this.#hpf.connect(this.#lpf);
      // todo: set destination here also ?
      this.#outputNode = this.#lpf;
    } else {
      // No filters, worklet is the output node
      this.#outputNode = this.#worklet;
    }

    this.setupMessageHandling();
    this.sendToProcessor({ type: 'voice:init' });
  }

  logAvailableParams = () => {
    console.table(
      'Available parameters:',
      Array.from(this.#worklet.parameters.keys())
    );
  };

  protected sendUpstreamMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
    return this;
  }

  private setupMessageHandling() {
    this.#worklet.port.onmessage = (event: MessageEvent) => {
      const { type, ...data } = event.data;

      this.sendUpstreamMessage(type, data);

      switch (type) {
        case 'voice:started':
          this.#state = VoiceState.PLAYING;
          break;
        case 'voice:ended':
          this.#state = VoiceState.IDLE;
          this.#currentNoteId = null;
          break;
        case 'voice:releasing':
          this.#state = VoiceState.RELEASING;
          break;
        case 'voice:looped':
          // this.#state = VoiceState.LOOPED;
          break;
        case 'voice:position':
          this.getParam('playbackPosition')?.setValueAtTime(
            data.position,
            this.context.currentTime
          );
          break;
        default:
          console.warn(`Unhandled message type: ${type}`);
          break;
      }
    };
  }

  async loadBuffer(
    buffer: AudioBuffer,
    zeroCrossings?: number[]
  ): Promise<boolean> {
    if (buffer.sampleRate !== this.context.sampleRate) {
      console.warn(
        `Sample rate mismatch - buffer: ${buffer.sampleRate}, context: ${this.context.sampleRate}`
      );
      return false;
    }

    const bufferData = Array.from({ length: buffer.numberOfChannels }, (_, i) =>
      buffer.getChannelData(i).slice()
    );

    this.sendToProcessor({
      type: 'voice:set_buffer',
      buffer: bufferData,
      duration: buffer.duration,
    });

    if (zeroCrossings?.length) this.#setZeroCrossings(zeroCrossings);

    return true;
  }

  #setZeroCrossings(zeroCrossings: number[]): this {
    this.sendToProcessor({
      type: 'voice:set_zero_crossings',
      zeroCrossings,
    });
    return this;
  }

  trigger(options: {
    midiNote: MidiValue;
    velocity: MidiValue;
    noteId: ActiveNoteId;
    secondsFromNow?: number;
    // startOffset?: number;
  }): number | string | null | undefined {
    if (this.#state === VoiceState.PLAYING) return null;
    this.#state = VoiceState.PLAYING;

    const {
      midiNote = 60,
      velocity = 100,
      secondsFromNow = 0,
      // startOffset = 0,
    } = {
      ...DEFAULT_TRIGGER_OPTIONS,
      ...options,
    }; // console.table({ ...DEFAULT_TRIGGER_OPTIONS, ...options });

    const timestamp = this.now + secondsFromNow;

    // Use setParams with to ensure all params executed using the exact same timestamp
    this.setParams(
      [
        { name: 'playbackRate', value: midiToPlaybackRate(midiNote) },
        { name: 'velocity', value: velocity },
        { name: 'envGain', value: 0 },

        // todo: set all other params (e.g. startOffset & endOffset) via param handlers (not in trigger method)
      ],
      timestamp
    );

    // Trigger attack envelope
    const envGain = this.getParam('envGain');
    if (!envGain) throw new Error('Cannot trigger - envGain parameter is null');
    envGain?.linearRampToValueAtTime(1, timestamp + this.#attackSec);

    this.sendToProcessor({
      type: 'voice:start',
      when: timestamp,
    });

    this.#startedTimestamp = timestamp;
    this.#currentNoteId = options.noteId;
    return this.#currentNoteId;
  }

  release({ release = this.#releaseSec, secondsFromNow = 0 }): this {
    if (this.#state === VoiceState.RELEASING) return this;
    const envGain = this.getParam('envGain');
    if (!envGain) throw new Error('Cannot release - envGain parameter is null');

    this.#state = VoiceState.RELEASING;
    const timestamp = this.now + secondsFromNow;

    // trigger release envelope
    cancelScheduledParamValues(envGain, timestamp);
    envGain.setValueAtTime(envGain.value, timestamp);
    envGain.exponentialRampToValueAtTime(0.0001, timestamp + release);

    this.sendToProcessor({ type: 'voice:release' });

    return this;
  }

  stop(): this {
    if (this.#state === VoiceState.STOPPED) return this;
    this.#state = VoiceState.STOPPED;
    this.#currentNoteId = null;

    this.setParam('envGain', 0, this.now);
    this.sendToProcessor({ type: 'voice:stop' });
    return this;
  }

  connect(
    destination: Destination,
    output?: number,
    input?: number
  ): Destination {
    if (destination instanceof AudioParam) {
      this.out.connect(destination, output);
    } else if (destination instanceof AudioNode) {
      this.out.connect(destination, output, input);
    } else {
      console.warn(`SampleVoice: Unsupported destination: ${destination}`);
    }
    return destination;
  }

  disconnect(output = 'main', destination?: Destination): this {
    if (output === 'alt') {
      console.warn(`SampleVoice has no "alt" output to disconnect`);
      return this;
    }
    if (!destination) {
      this.out.disconnect();
    } else if (destination instanceof AudioNode) {
      this.out.disconnect(destination);
    } else if (destination instanceof AudioParam) {
      this.out.disconnect(destination);
    }
    return this;
  }

  #sanitizeParamValue(paramName: string, value: number): number {
    // Guard against NaN, Infinity, and extreme values // todo: remove if not useful
    if (!isFinite(value) || isNaN(value)) {
      console.warn(`Invalid ${paramName} value: ${value}, using default`);
      return SAMPLE_VOICE_PARAM_DESCRIPTORS[paramName]?.defaultValue || 1;
    }
    return value;
  }

  setParam(
    name: string,
    value: number,
    atTime: number, // Direct timestamp (in audio contexts time)
    options: {
      glideTime?: number;
      cancelPrevious?: boolean;
    } = {}
  ): this {
    const param = this.getParam(name);
    if (!param || param.value === value) return this;

    const opts = {
      glideTime: 0,
      cancelPrevious: true,
      ...options,
    };

    const safeValue = this.#sanitizeParamValue(name, value);

    if (opts.cancelPrevious) {
      cancelScheduledParamValues(param, atTime);
    }

    if (opts.glideTime <= 0) {
      param.setValueAtTime(safeValue, atTime);
    } else {
      param.setTargetAtTime(safeValue, atTime, Math.max(opts.glideTime, 0.001));
    }
    return this;
  }

  protected setParams(
    paramsAndValues: Array<{ name: string; value: number }>,
    atTime: number,
    options: {
      glideTime?: number;
      cancelPrevious?: boolean;
    } = {}
  ): this {
    const validParams = paramsAndValues.filter(
      (pv) => this.getParam(pv.name) !== null
    );
    if (validParams.length === 0) return this;

    validParams.forEach(({ name, value }) => {
      // Pass the absolute timestamp to ensure all parameters use the same timestamp
      this.setParam(name, value, atTime, { ...options });
    });
    return this;
  }

  setAttack = (attack_sec: number) => (this.#attackSec = attack_sec);
  setRelease = (release_sec: number) => (this.#releaseSec = release_sec);

  setStartOffset = (offset: number, timestamp = this.now) =>
    this.setParam('startOffset', offset, timestamp);

  setEndOffset = (offset: number, timestamp = this.now) =>
    this.setParam('endOffset', offset, timestamp);

  setLoopPoints(start?: number, end?: number, timestamp = this.now): this {
    if (start !== undefined) {
      this.setParam('loopStart', start, timestamp);
    }
    if (end !== undefined) {
      this.setParam('loopEnd', end, timestamp);
    }
    return this;
  }

  /** MESSAGES */
  sendToProcessor(data: any): this {
    this.#worklet.port.postMessage(data);
    return this;
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  // Getters

  get hpf() {
    return this.#hpf;
  }

  get lpf() {
    return this.#lpf;
  }

  get in() {
    return null; // possibly add support for connecting to "in": this.#worklet;
  }

  get out() {
    return this.#outputNode;
  }

  get destination() {
    return this.#destination;
  }

  // get firstChildren() { return this.#worklet; }

  get state(): VoiceState {
    return this.#state;
  }

  get isReady() {
    return this.#isReady;
  }

  get now(): number {
    return this.context.currentTime;
  }

  get activeNoteId(): number | string | null {
    return this.#currentNoteId;
  }

  get startTime(): number {
    return this.#startedTimestamp;
  }

  // Setters

  enablePositionTracking(enabled: boolean) {
    this.sendToProcessor({
      type: 'voice:usePlaybackPosition',
      value: enabled,
    });

    return this;
  }

  setLoopEnabled(enabled: boolean): this {
    this.sendToProcessor({
      type: 'setLoopEnabled',
      value: enabled,
    });
    return this;
  }

  setPlaybackRate(
    rate: number,
    atTime = this.now,
    options?: {
      glideTime?: number;
      cancelPrevious?: boolean;
    }
  ): this {
    return this.setParam('playbackRate', rate, atTime, options);
  }

  dispose(): void {
    this.stop();
    this.disconnect();
    this.#worklet.port.close();
    deleteNodeId(this.nodeId);
  }

  getParamDescriptors(): Record<string, LibParamDescriptor> {
    return SAMPLE_VOICE_PARAM_DESCRIPTORS;
  }

  getParam(name: string): AudioParam | null {
    // Just while debugging:
    const param = this.#worklet.parameters.get(name);
    if (!param && name === 'envGain') {
      console.log(
        'Available parameters:',
        Array.from(this.#worklet.parameters.keys()),
        'Looking for:',
        name
      );
    }

    if (this.#worklet && this.#worklet.parameters.has(name)) {
      return this.#worklet.parameters.get(name) ?? null;
    }

    // Special case for filter parameters if they exist
    if (this.#filtersEnabled) {
      switch (name) {
        case 'highpass':
        case 'hpf':
          return this.#hpf?.frequency || null;
        case 'lowpass':
        case 'lpf':
          return this.#lpf?.frequency || null;
        case 'hpfQ':
          return this.#hpf?.Q || null;
        case 'lpfQ':
          return this.#lpf?.Q || null;
      }
    }

    // Parameter not found
    return null;
  }
}
