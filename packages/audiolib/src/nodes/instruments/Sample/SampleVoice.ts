import { LibVoiceNode, VoiceType, Messenger } from '@/LibNode';
import { getAudioContext } from '@/context';
import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';
import { VoiceState, ActiveNoteId } from '../types';
import { DEFAULT_TRIGGER_OPTIONS } from '../constants';

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

import { cancelScheduledParamValues, midiToPlaybackRate } from '@/utils';

interface ParamConstraint {
  min: number;
  max: number;
}

interface ParamConstraints {
  startOffset?: ParamConstraint;
  endOffset?: ParamConstraint;
  loopStart?: ParamConstraint;
  loopEnd?: ParamConstraint;
  [key: string]: ParamConstraint | undefined;
}

export class SampleVoice implements LibVoiceNode, Messenger {
  readonly nodeId: NodeID;
  readonly nodeType: VoiceType = 'sample';

  #worklet: AudioWorkletNode;
  #messages: MessageBus<Message>;
  #state: VoiceState = VoiceState.IDLE;
  #currentNoteId: number | string | null = null;
  #startedTimestamp: number = -1;

  #paramConstraints: ParamConstraints = {};

  constructor(
    private context: AudioContext = getAudioContext(), // remove getAudioContext
    options: { processorOptions?: any } = {}
  ) {
    this.nodeId = createNodeId(this.nodeType);
    this.#messages = createMessageBus<Message>(this.nodeId);

    this.#worklet = new AudioWorkletNode(context, 'sample-player-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: options.processorOptions || {},
    });

    this.setupMessageHandling();
    this.sendToProcessor({ type: 'voice:init' });
  }

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
    midiNote: ActiveNoteId;
    velocity: ActiveNoteId;
    noteId: number | string;

    secondsFromNow?: number;
    startOffset?: number;

    attack_sec?: number;
  }): number | string | null {
    if (this.#state === VoiceState.PLAYING) return null;
    this.#state = VoiceState.PLAYING;
    this.#currentNoteId = options.noteId;
    // this.#startedTimestamp = -1;

    const {
      midiNote,
      velocity,
      secondsFromNow = 0,
      startOffset = 0, // saving for later use
      attack_sec = 0.001,
    } = {
      ...DEFAULT_TRIGGER_OPTIONS,
      ...options,
    };

    const when = this.now + secondsFromNow;

    this.setParam('playbackRate', midiToPlaybackRate(midiNote));
    this.setParam('velocity', velocity);

    const envGain = this.getParam('envGain')!;
    cancelScheduledParamValues(envGain, this.now);

    envGain.setValueAtTime(0, this.now);
    envGain.linearRampToValueAtTime(1, this.now + attack_sec);

    this.sendToProcessor({
      type: 'voice:start',
      when,
    });

    this.#startedTimestamp = when;

    return this.#currentNoteId;
  }

  // Move to constants when decided to use:
  TARGET_AT_TIME_SCALAR = 0.3;
  TARGET_AT_MIN_VALUE = 0.00001;
  SCHEDULE_NOW_ADDER = 0.00001;

  release({
    release = 0.1, // clarify unit with regards to setTargetAtTime
    secondsFromNow = this.SCHEDULE_NOW_ADDER,
  }: {
    release?: number;
    secondsFromNow?: number;
  }): this {
    if (this.#state === VoiceState.RELEASING) return this;
    this.#state = VoiceState.RELEASING;

    const envGain = this.getParam('envGain')!;

    const releaseStart = this.now + secondsFromNow;
    // const releaseEnd = releaseStart + release;
    const releaseTimeConstant = release * this.TARGET_AT_TIME_SCALAR;

    cancelScheduledParamValues(envGain, this.now);
    envGain.setValueAtTime(envGain.value, this.now);

    envGain.setTargetAtTime(
      this.TARGET_AT_MIN_VALUE,
      releaseStart,
      releaseTimeConstant
    );

    this.sendToProcessor({ type: 'voice:release' });
    return this;
  }

  stop(): this {
    if (this.#state === VoiceState.STOPPED) return this;
    this.#state = VoiceState.STOPPED;
    this.#currentNoteId = null;

    this.setParam('envGain', 0);
    this.sendToProcessor({ type: 'voice:stop' });
    return this;
  }

  connect(
    destination: AudioNode | AudioParam,
    output?: number,
    input?: number
  ): this {
    if (destination instanceof AudioParam) {
      this.#worklet.connect(destination, output);
    } else {
      this.#worklet.connect(destination, output, input);
    }
    return this;
  }

  disconnect(): this {
    this.#worklet.disconnect();
    return this;
  }

  getParam(name: string): AudioParam | null {
    const param = (this.#worklet.parameters as Map<string, AudioParam>).get(
      name
    );
    if (!(param && param instanceof AudioParam)) {
      console.warn(`Parameter ${name} not found`);
      return null;
    }

    return param;
  }

  setParam(
    name: string,
    value: number,
    options: { cancelPrevSchedules?: boolean; secondsFromNow?: number } = {}
  ): this {
    const param = this.getParam(name);
    if (!param) return this;

    if (options.cancelPrevSchedules) {
      cancelScheduledParamValues(param, this.now);
    }

    param.setValueAtTime(value, this.now);
    return this;
  }

  setOffsetParams(startOffset?: number, endOffset?: number): this {
    if (startOffset !== undefined) this.setStartOffset(startOffset);
    if (endOffset !== undefined) this.setEndOffset(endOffset);
    return this;
  }

  setStartOffset = (offset: number) => this.setParam('startOffset', offset);
  setEndOffset = (offset: number) => this.setParam('endOffset', offset);

  setLoopPoints(start?: number, end?: number): this {
    if (start !== undefined) {
      this.setParam('loopStart', start);
    }

    if (end !== undefined) {
      this.setParam('loopEnd', end);
    }

    return this;
  }

  sendToProcessor(data: any): this {
    this.#worklet.port.postMessage(data);
    return this;
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  setParamConstraints(
    paramName: string,
    min: number,
    max: number,
    fixToConstant?: number
  ): this {
    // Initialize the constraint object for this parameter if it doesn't exist
    if (!this.#paramConstraints[paramName]) {
      this.#paramConstraints[paramName] = { min: 0, max: 1 }; // Default values
    }

    // If a value is provided, set both min and max to that value
    if (fixToConstant !== undefined) {
      this.#paramConstraints[paramName] = {
        min: fixToConstant,
        max: fixToConstant,
      };
    }
    // Otherwise update min/max if provided
    else {
      if (min !== undefined) this.#paramConstraints[paramName]!.min = min;
      if (max !== undefined) this.#paramConstraints[paramName]!.max = max;
    }

    return this;
  }

  // Getters

  get state(): VoiceState {
    return this.#state;
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

  get paramConstraints(): ParamConstraints {
    return this.#paramConstraints;
  }

  // Setters

  set enablePositionTracking(enabled: boolean) {
    this.sendToProcessor({
      type: 'voice:usePlaybackPosition',
      value: enabled,
    });
  }

  setLoopEnabled(enabled: boolean): this {
    this.sendToProcessor({
      type: 'setLoopEnabled',
      value: enabled,
    });
    return this;
  }

  setPlaybackRate(rate: number): this {
    return this.setParam('playbackRate', rate);
  }

  setEnvelopeGain(value: number): this {
    return this.setParam('envGain', value);
  }

  dispose(): void {
    this.stop();
    this.disconnect();
    this.#worklet.port.close();
    deleteNodeId(this.nodeId);
  }
}

// todo: messaging overhaul
// // ? only send messages if someone has subscribed to them?
// switch (type) {
//   case 'voice:started':
//     this.messages.sendMessage('voice:started', {});
//     break;
//   case 'voice:ended':
//     this.messages.sendMessage('voice:ended', {});
//     break;
//   case 'voice:releasing':
//     this.messages.sendMessage('voice:releasing', {});
//     break;
//   case 'voice:looped':
//     this.messages.sendMessage('voice:looped', {
//       loopCount: data.loopCount,
//     });
//     break;
//   case 'voice:position':
//     this.getParam('playbackPosition')?.setValueAtTime(
//       data.position,
//       this.context.currentTime
//     );
//     this.messages.sendMessage('voice:position', {
//       position: data.position,
//     });
//     break;
// }

// // General function to set any constrained parameter
// setConstrainedParam(paramName: string, value: number): this {
//   // Skip if value is undefined
//   if (value === undefined) return this;

//   // Apply constraints if they exist
//   let safeValue = value;
//   if (this.#paramConstraints[paramName]) {
//     const { min, max } = this.#paramConstraints[paramName]!;
//     safeValue = Math.max(min, Math.min(max, value));
//   }

//   // Get the parameter and set its value
//   const param = this.getParam(paramName);
//   if (param) {
//     cancelScheduledParamValues(param, this.now);
//     param.setValueAtTime(safeValue, this.now);
//   }

//   return this;
// }
