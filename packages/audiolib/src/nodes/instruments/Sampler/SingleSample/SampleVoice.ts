import { LibVoiceNode, VoiceType } from '@/LibNode';
import { getAudioContext } from '@/context';
import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';
import { VoiceState, ActiveNoteId } from './types';
import { DEFAULT_TRIGGER_OPTIONS } from './constants';

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

export class SampleVoice implements LibVoiceNode {
  readonly nodeId: NodeID;
  readonly nodeType: VoiceType = 'sample';

  #worklet: AudioWorkletNode;
  #messages: MessageBus<Message>;
  #state: VoiceState = VoiceState.IDLE;
  #currentNoteId: number | string | null = null;
  #startedTimestamp: number = -1;

  constructor(
    private context: AudioContext = getAudioContext(),
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

  private setupMessageHandling() {
    this.#worklet.port.onmessage = (event: MessageEvent) => {
      const { type, ...data } = event.data;

      this.#messages.sendMessage(type, data);

      // // Todo: only send messages if someone has subscribed to them?
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
    };
  }

  async loadBuffer(buffer: AudioBuffer): Promise<this> {
    if (buffer.sampleRate !== this.context.sampleRate) {
      console.warn(
        `Sample rate mismatch - buffer: ${buffer.sampleRate}, context: ${this.context.sampleRate}`
      );
    }

    const bufferData = Array.from({ length: buffer.numberOfChannels }, (_, i) =>
      buffer.getChannelData(i).slice()
    );

    this.sendToProcessor({
      type: 'voice:set_buffer',
      buffer: bufferData,
      duration: buffer.duration,
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

    const { midiNote, velocity, secondsFromNow, startOffset, attack_sec } = {
      ...DEFAULT_TRIGGER_OPTIONS,
      ...options,
    };

    const when = this.now + secondsFromNow;

    const normalizedVelocity = velocity ? velocity / 127 : 1;

    this.setParam('playbackRate', midiToPlaybackRate(midiNote));
    this.setParam('velocity', normalizedVelocity);

    const envGain = this.getParam('envGain')!;
    cancelScheduledParamValues(envGain, this.now);
    envGain.setValueAtTime(0, this.now);
    envGain.linearRampToValueAtTime(1, this.now + attack_sec);

    this.sendToProcessor({
      type: 'voice:start',
      when,
      startOffset,
    });

    this.#startedTimestamp = when;

    return this.#currentNoteId;
  }

  release({
    release_sec = 0.1,
    secondsFromNow = 0,
  }: {
    release_sec?: number;
    secondsFromNow?: number;
  }): this {
    if (this.#state === VoiceState.RELEASING) return this;
    this.#state = VoiceState.RELEASING;

    const when = this.now + secondsFromNow;
    const envGain = this.getParam('envGain')!;
    cancelScheduledParamValues(envGain, when);
    envGain.setValueAtTime(envGain.value, when);
    envGain.linearRampToValueAtTime(0, when + release_sec);

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

  sendToProcessor(data: any): this {
    this.#worklet.port.postMessage(data);
    return this;
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
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

  setLoopPoints(start: number, end: number): this {
    this.setParam('loopStart', start);
    this.setParam('loopEnd', end);
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
