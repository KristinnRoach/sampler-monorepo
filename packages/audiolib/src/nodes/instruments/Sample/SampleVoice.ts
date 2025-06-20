import {
  LibVoiceNode,
  VoiceType,
  Messenger,
  Destination,
  Connectable,
} from '@/nodes/LibNode';
import { getAudioContext } from '@/context';
import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';
import { ActiveNoteId, MidiValue } from '../types';
import { VoiceState } from '../VoiceState';
import { DEFAULT_TRIGGER_OPTIONS } from '../constants';

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

import {
  assert,
  // cancelScheduledParamValues,
  midiToPlaybackRate,
} from '@/utils';
import { LibParamDescriptor } from '@/nodes/params/types';

import {
  createCustomEnvelope,
  CustomEnvelope,
  DEFAULT_PITCH_ENV,
  DEFAULT_AMP_ENV,
} from '@/nodes/params';

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
  startPoint: {
    nodeId: 'startPoint',
    name: 'startPoint',
    valueType: 'number',
    minValue: 0,
    defaultValue: 0,
    group: 'playback',
    automationRate: 'k-rate',
  },
  endPoint: {
    nodeId: 'endPoint',
    name: 'endPoint',
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

  #destination: Destination | null = null;
  #outputNode: AudioNode;
  #worklet: AudioWorkletNode;
  #messages: MessageBus<Message>;

  #state: VoiceState = VoiceState.NOT_READY;
  #isInitialized: boolean = false;
  #activeMidiNote: number | null = null;
  #startedTimestamp: number = -1;

  #sampleDuration = 0;
  #playbackDuration = 0;

  #ampEnvelope: CustomEnvelope;
  #pitchEnvelope: CustomEnvelope;

  #hpf: BiquadFilterNode | null = null;
  #lpf: BiquadFilterNode | null = null;

  #filtersEnabled = false;
  #loopEnabled = false;

  #attackSec: number = 0.1; // To be replaced with envelope
  #releaseSec: number = 0.1; // To be replaced with envelope

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

    this.#ampEnvelope = createCustomEnvelope({
      audioContext: context,
      defaultPoints: DEFAULT_AMP_ENV,
    });

    this.#pitchEnvelope = createCustomEnvelope({
      audioContext: context,
      defaultPoints: DEFAULT_PITCH_ENV,
    });

    this.#worklet = new AudioWorkletNode(context, 'sample-player-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      // ? Initialize with parameter data
      // parameterData: {
      //   envGain: SAMPLE_VOICE_PARAM_DESCRIPTORS.envGain.defaultValue,
      //   etc .. ?
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
      let { type, ...data } = event.data;

      switch (type) {
        case 'initialized':
          this.#isInitialized = true;
        case 'voice:loaded':
          this.#state = VoiceState.IDLE;
          this.#activeMidiNote = null;
          break;
        case 'voice:started':
          this.#state = VoiceState.PLAYING;
          data = { voice: this, midiNote: this.#activeMidiNote };
          break;
        case 'voice:stopped':
          this.#state = VoiceState.STOPPED;
          data = { voice: this, midiNote: this.#activeMidiNote };
          this.#activeMidiNote = null;
          break;
        case 'voice:releasing':
          this.#state = VoiceState.RELEASING;
          data = { voice: this, midiNote: this.#activeMidiNote };
          break;

        case 'loop:enabled':
          this.#loopEnabled = true;

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

      this.sendUpstreamMessage(type, data);
    };
  }

  async loadBuffer(
    buffer: AudioBuffer,
    zeroCrossings?: number[]
  ): Promise<boolean> {
    this.#state = VoiceState.NOT_READY;

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

    const timestamp = this.now;
    this.getParam('endPoint')
      ?.cancelScheduledValues(timestamp)
      .setValueAtTime(buffer.duration, timestamp);

    this.refreshPlaybackDuration();

    this.#sampleDuration = buffer.duration;

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

  refreshPlaybackDuration() {
    const startParam = this.getParam('startPoint');
    const endParam = this.getParam('endPoint');

    if (!startParam || !endParam) {
      throw new Error(`startPoint or endPoint not defined!`);
    }

    const updatedDuration = endParam.value - startParam.value;
    this.#playbackDuration = updatedDuration;

    this.setAmpEnvDuration(updatedDuration);

    return updatedDuration;
  }

  setAmpEnvDuration = (duration = this.#playbackDuration, divideBy = 1) => {
    this.#ampEnvelope.duration = duration / divideBy;
  };

  trigger(options: {
    midiNote: MidiValue;
    velocity: MidiValue;
    secondsFromNow?: number;
  }): number | string | null | undefined {
    const {
      midiNote = 60,
      velocity = 100,
      secondsFromNow = 0,
    } = {
      ...DEFAULT_TRIGGER_OPTIONS,
      ...options,
    };

    const timestamp = this.now + secondsFromNow;
    // Using the same audio context current time for all ops

    this.#startedTimestamp = timestamp;
    this.#activeMidiNote = options.midiNote;

    if (
      this.#state === VoiceState.PLAYING ||
      this.#state === VoiceState.RELEASING
    ) {
      console.log(`had to stop a playing voice, midinote: ${midiNote}`);
      // Clears automations to avoid overlapping scheduling
      // conflicts when re-triggered (setValueCurveAtTime)
      this.stop(timestamp);
      return null;
    }

    this.#state = VoiceState.PLAYING;

    const playbackRate = midiToPlaybackRate(midiNote);
    this.setAmpEnvDuration(undefined, playbackRate);

    // setParams ensures all params executed using exact same timestamp
    this.setParams(
      [
        { name: 'playbackRate', value: playbackRate },
        { name: 'velocity', value: velocity },
        // todo: set all other params (e.g. startPoint & endPoint) via param handlers (not in trigger method)
      ],
      timestamp
    );

    // Trigger envelopes
    if (this.#loopEnabled) {
      // use VoiceState.LOOPING
      console.log('LOOP: Starting envelope loop');
      const rescheduleEnvelope = () => {
        const envGain = this.getParam('envGain');
        if (!envGain) return;

        if (this.#state === VoiceState.PLAYING) {
          console.log('LOOP: Applying envelope cycle');
          // cancelScheduledParamValues(envGain, this.now, envGain.value);
          this.#ampEnvelope.applyToAudioParam(
            envGain,
            timestamp,
            this.sampleDuration,
            undefined,
            true
          );

          setTimeout(
            rescheduleEnvelope,
            this.#ampEnvelope.duration * 1000 // - 50
          );
        } else {
          console.log('LOOP: Stopping - not PLAYING or RELEASING');
        }
      };
      setTimeout(rescheduleEnvelope, this.#ampEnvelope.duration * 1000); //- 50);
    } else {
      const envGain = this.getParam('envGain');
      if (envGain) {
        this.#ampEnvelope.applyToAudioParam(
          envGain,
          timestamp,
          this.sampleDuration,
          undefined,
          false
        );
      }
    }

    // Start playback
    this.sendToProcessor({
      type: 'voice:start',
      when: timestamp,
    });

    return this.#activeMidiNote;
  }

  release({ release = this.#releaseSec, secondsFromNow = 0 }): this {
    if (this.#state === VoiceState.RELEASING) return this;

    const envGain = this.getParam('envGain');
    if (!envGain) throw new Error('Cannot release - envGain parameter is null');

    this.#state = VoiceState.RELEASING;
    const timestamp = this.now + secondsFromNow;

    // Immediate stop for zero release time
    if (release <= 0) return this.stop(timestamp);

    const currentGainValue = envGain.value;
    // cancelScheduledParamValues(envGain, timestamp, currentGainValue);
    // this.#ampEnvelope.stopLooping();

    this.#ampEnvelope.applyReleaseToAudioParam(
      envGain,
      timestamp,
      release,
      currentGainValue,
      0
    );
    this.sendToProcessor({ type: 'voice:release' });

    // After the release duration, the voice should stop
    setTimeout(
      () => {
        if (this.#state === VoiceState.RELEASING) this.stop();
      },
      release * 1000 + 50
    ); // 50ms buffer

    return this;
  }

  stop(timestamp = this.now): this {
    // Use timestamp if available, for cancelScheduledParamValues
    if (
      this.#state === VoiceState.STOPPED ||
      this.#state === VoiceState.STOPPING
    ) {
      return this;
    }
    this.#state = VoiceState.STOPPING;

    // Clear all scheduled values to prevent overlapping setValueCurveAtTime errors
    this.setParam('envGain', 0, timestamp, {
      cancelPrevious: true,
      glideTime: 0,
    });

    this.sendToProcessor({ type: 'voice:stop' });
    this.#state = VoiceState.STOPPED;
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
    // Guard against NaN, Infinity, and extreme values
    if (!isFinite(value) || isNaN(value)) {
      console.warn(`Invalid ${paramName} value: ${value}, using default`);
      return SAMPLE_VOICE_PARAM_DESCRIPTORS[paramName]?.defaultValue || 1;
    }
    return value;
  }

  setParam(
    name: string,
    targetValue: number,
    timestamp: number,
    options: {
      glideTime?: number;
      cancelPrevious?: boolean;
    } = {}
  ): this {
    const param = this.getParam(name);
    if (!param || param.value === targetValue) return this;

    const { glideTime = 0, cancelPrevious = true } = options;

    // Convert normalized (0-1) to actual units
    const actualValue = this.denormalizeParam(name, targetValue);
    const safeTarget = this.#sanitizeParamValue(name, actualValue);
    const currVal = this.#sanitizeParamValue(name, param.value);

    if (cancelPrevious) param.cancelScheduledValues(timestamp); // cancelScheduledParamValues(param, timestamp, currVal);

    if (glideTime <= 0) param.setValueAtTime(safeTarget, timestamp);
    else
      param.linearRampToValueAtTime(
        safeTarget,
        timestamp + Math.max(glideTime, 0.001)
      );

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

  /**  Convert from normalized values (0 to 1) to actual values,
   * based on the current sample duration
   */
  private denormalizeParam(paramName: string, normalizedValue: number): number {
    switch (paramName) {
      case 'startPoint':
      case 'endPoint':
      case 'loopStart':
      case 'loopEnd':
        return normalizedValue * this.#sampleDuration; // 0-1 → 0-sampleDuration seconds

      // Filters use Hz, velocity uses midi values (normalized by processor)
      // playbackRate & envGain are already normalized

      default:
        return normalizedValue;
    }
  }

  setAttack = (attack_sec: number) => {
    this.#attackSec = attack_sec;
    console.info(`setAttack called, to be replaced with envelope`);
  };

  setRelease = (release_sec: number) => {
    this.#releaseSec = release_sec;
    console.info(`setRelease called, to be replaced with envelope`);
  };

  setStartPoint = (point: number, timestamp = this.now) => {
    this.setParam('startPoint', point, timestamp);
    this.refreshPlaybackDuration();
  };

  setEndPoint = (point: number, timestamp = this.now) => {
    this.setParam('endPoint', point, timestamp);
    this.refreshPlaybackDuration();
  };
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

  getPlaybackDuration() {
    return this.#playbackDuration;
  }

  getAmpEnvelope(): CustomEnvelope {
    return this.#ampEnvelope;
  }

  getPitchEnvelope(): CustomEnvelope {
    return this.#pitchEnvelope;
  }

  get currMidiNote(): number | null {
    return this.#activeMidiNote;
  }

  get hpf() {
    return this.#hpf;
  }

  get lpf() {
    return this.#lpf;
  }

  get in() {
    return null;
  }

  get out() {
    return this.#outputNode;
  }

  get destination() {
    return this.#destination;
  }

  get state(): VoiceState {
    return this.#state;
  }

  get initialized() {
    return this.#isInitialized;
  }

  get now(): number {
    return this.context.currentTime;
  }

  get activeNoteId(): number | string | null {
    return this.#activeMidiNote;
  }

  get startTime(): number {
    return this.#startedTimestamp;
  }

  get sampleDuration() {
    return this.#sampleDuration;
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
      // this.loopEnabled is set via processor message //?? does not work?
      type: 'setLoopEnabled',
      value: enabled,
    });
    this.#loopEnabled = enabled;
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
    return null;
  }
}

// // normalizeParam is currently not used
// private normalizeParam(paramName: string, actualValue: number): number {
//   switch (paramName) {
//     case 'startPoint':
//     case 'endPoint':
//     case 'loopStart':
//     case 'loopEnd':
//       return actualValue / this.#sampleDuration; // seconds → 0-1

//     case 'velocity':
//       return actualValue / 127; // MIDI → 0-1

//     default:
//       return actualValue; // Already normalized
//   }
// }
