import { LibVoiceNode, VoiceType } from '@/LibNode';
import { getAudioContext } from '@/context';
import { createNodeId, NodeID, deleteNodeId } from '@/registry/NodeIDs';
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

import { checkGlobalLoopState } from '@/input';

export class SampleVoice implements LibVoiceNode {
  readonly nodeId: NodeID;
  readonly nodeType: VoiceType = 'sample';
  readonly processorNames = ['source-processor'];

  private worklet: AudioWorkletNode;
  private messages: MessageBus<Message>;
  private bufferDuration: number | null;

  // Playback Flags
  // ! Keeping as comments for now,
  // ! until I can verify whether these are needed
  // private isPlaying = false;
  // private isReleasing = false;

  constructor(
    private context: AudioContext = getAudioContext(),
    options: { processorOptions?: any } = {}
  ) {
    this.nodeId = createNodeId(this.nodeType);
    this.messages = createMessageBus<Message>(this.nodeId);
    this.bufferDuration = null;

    this.worklet = new AudioWorkletNode(context, 'sample-player-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: options.processorOptions || {},
    });

    this.setupMessageHandling();
    this.sendToProcessor({ type: 'voice:init' });
  }

  private setupMessageHandling() {
    this.worklet.port.onmessage = (event: MessageEvent) => {
      const { type, ...data } = event.data;

      // Todo: only send messages if someone has subscribed to them?
      switch (type) {
        case 'voice:started':
          // this.isPlaying = true;
          // this.isReleasing = false;
          this.messages.sendMessage('voice:started', {});
          break;
        case 'voice:ended':
          // this.isPlaying = false;
          // this.isReleasing = false;
          this.messages.sendMessage('voice:ended', {});
          break;
        case 'voice:looped':
          this.messages.sendMessage('voice:looped', {
            loopCount: data.loopCount,
          });
          break;
        case 'voice:position':
          this.getParam('playbackPosition')?.setValueAtTime(
            data.position,
            this.context.currentTime
          );
          this.messages.sendMessage('voice:position', {
            position: data.position,
          });
          break;
      }
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

    this.bufferDuration = buffer.duration;
    return this;
  }

  trigger(options: {
    midiNote: number;
    velocity?: number;
    when?: number;
    startOffset?: number;
    endOffset?: number;
    attack_sec?: number;
  }): this {
    // if (this.isPlaying) {
    //   // console.warn('Voice already playing');
    //   // todo: return this; // when isPlaying is proven robust
    // }

    const defaults = {
      midiNote: 60,
      velocity: 100,
      when: this.now,
      startOffset: 0,
      endOffset: 0,
      attack_sec: 0.02,
    };

    const { midiNote, velocity, when, startOffset, endOffset, attack_sec } = {
      ...defaults,
      ...options,
    };

    // Add validation for velocity
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
    // this.isPlaying = true;

    // todo: cleanup after testing
    const loop = checkGlobalLoopState();
    this.setLoopEnabled(loop);

    return this;
  }

  release(options: { release_sec?: number } = {}): this {
    // if (this.isReleasing) return this;

    // console.warn(this.isPlaying);

    // this.isReleasing = true; // flag

    const release_sec = options.release_sec ?? 0.1;
    const envGain = this.getParam('envGain')!;
    cancelScheduledParamValues(envGain, this.now);
    envGain.setValueAtTime(envGain.value, this.now);
    envGain.linearRampToValueAtTime(0, this.now + release_sec);

    // todo: cleanup after testing
    const loop = checkGlobalLoopState();
    this.setLoopEnabled(loop);

    this.sendToProcessor({ type: 'voice:release' });
    return this;
  }

  stop(): this {
    // if (!this.isPlaying) return this;
    this.setParam('envGain', 0);
    this.sendToProcessor({ type: 'voice:stop' });
    return this;
  }

  // Core LibVoiceNode interface methods
  connect(
    destination: AudioNode | AudioParam,
    output?: number,
    input?: number
  ): this {
    if (destination instanceof AudioParam) {
      this.worklet.connect(destination, output);
    } else {
      this.worklet.connect(destination, output, input);
    }
    return this;
  }

  disconnect(): this {
    this.worklet.disconnect();
    return this;
  }

  getParam(name: string): AudioParam {
    const param = (this.worklet.parameters as Map<string, AudioParam>).get(
      name
    );
    // ? Does the following check hurt performance significantly ? (if so revert to paramMap)
    assert(
      param instanceof AudioParam,
      `sampleVoice.getParam received a non-AudioParam arg: ${param}`
    );
    return param;
  }

  setParam(
    name: string,
    value: number,
    options: { cancelPrevSchedules?: boolean } = {}
  ): this {
    const param = this.getParam(name);
    if (!param) return this;

    // Validate value
    if (!Number.isFinite(value)) {
      console.error(`Invalid value for param ${name}:`, value);
      return this;
    }

    if (options.cancelPrevSchedules) {
      cancelScheduledParamValues(param, this.now);
    }
    param.setValueAtTime(value, this.now);
    return this;
  }

  sendToProcessor(data: any): void {
    this.worklet.port.postMessage(data);
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.messages.onMessage(type, handler);
  }

  // Utility methods
  get now(): number {
    return this.context.currentTime;
  }

  set enablePositionTracking(enabled: boolean) {
    this.sendToProcessor({
      type: 'voice:usePlaybackPosition',
      value: enabled,
    });
  }

  setLoopEnabled(enabled: boolean): this {
    // Simple direct message to processor with no side effects
    this.sendToProcessor({
      type: 'setLoopEnabled',
      value: enabled,
    });
    return this;
  }

  dispose(): void {
    this.stop();
    this.disconnect();
    this.worklet.port.close();
    deleteNodeId(this.nodeId);
  }
}
