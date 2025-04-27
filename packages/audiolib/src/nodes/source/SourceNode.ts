import { LibSourceNode } from '@/nodes';
import { getAudioContext } from '@/context';
import { createNodeId, NodeID, deleteNodeId } from '@/store/state/IdStore';
import { Message, MessageHandler, createMessageBus } from '@/events';
import {
  assert,
  cancelScheduledParamValues,
  midiToPlaybackRate,
} from '@/utils';

export class SourceNode extends AudioWorkletNode implements LibSourceNode {
  readonly nodeId: NodeID;
  readonly nodeType: string = 'source:default';
  readonly processorNames = ['source-processor'];

  #isPlaying: boolean;
  #duration: number;
  #messages;

  readonly paramMap: Map<string, AudioParam>; // Workaround for TypeScript issue with AudioParamMap

  constructor(
    context: AudioContext = getAudioContext(),
    options: { processorOptions?: any; duration?: number } = {
      processorOptions: {},
    }
  ) {
    const nodeId = createNodeId('source:default');

    super(context, 'source-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: options.processorOptions || {},
    });

    this.nodeId = nodeId;
    this.#messages = createMessageBus<Message>(this.nodeId);
    this.#isPlaying = false;
    this.#duration = options.duration || 0;

    // Set up parameter properties
    this.paramMap = this.parameters as Map<string, AudioParam>; // ts-error hax
    this.resetParams();

    // Set up message handling
    this.port.onmessage = (event: MessageEvent) => {
      const data = event.data;

      if (data.type === 'voice:ended') {
        this.#isPlaying = false;
        this.#messages.sendMessage('voice:ended', {});
      } else if (data.type === 'voice:looped') {
        this.#messages.sendMessage('voice:looped', {
          loopCount: data.loopCount,
        });
      } else if (data.type === 'voice:position') {
        this.getParam('playbackPosition')!.setValueAtTime(
          data.position,
          this.context.currentTime
        );
        this.#messages.sendMessage('voice:position', {
          position: data.position,
          // amplitude: data.amplitude,
        });
      }
    };

    this.sendToProcessor({ type: 'voice:init' });
  }

  sendToProcessor(data: any) {
    // todo: consistently type data for events // use this method to clean up others by including defaults like nodeId
    this.port.postMessage(data);
  }

  getParam(name: string): AudioParam {
    assert(this.paramMap.has(name), 'param not found', name);
    const param = this.paramMap.get(name);
    assert(param instanceof AudioParam, 'param is not AudioParam', param);

    return param!;
  }

  setParam(
    name: string,
    value: number,
    options: any = { cancelPrevSchedules: true }
  ): this {
    // TODO: optional linear, exponential ramp, setTargetAtTime etc.
    const param = this.getParam(name);
    if (options.cancelPrevSchedules) {
      cancelScheduledParamValues(param, this.now);
    }
    param.setValueAtTime(value, this.now);
    return this;
  }

  resetParams() {
    this.paramMap.forEach((param) => {
      assert(param instanceof AudioParam, 'param is not AudioParam', param);
      cancelScheduledParamValues(param, this.now);
      if (param.defaultValue) {
        param.setValueAtTime(param.defaultValue, this.now);
      }
    });
    return this;
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
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

    this.#duration = buffer.duration;

    return this;
  }

  trigger(options: {
    midiNote: number;
    attackTime?: number;
    velocity?: number;
    time?: number;
    offset?: number;
    duration?: number;
  }): this {
    if (this.#isPlaying) {
      console.error(`src.play(): source already playing!`);
      return this;
    }

    const {
      midiNote,
      velocity = 100,
      attackTime = 0.01,
      time = this.now,
      offset = 0,
      duration,
    } = options;

    const noteAsRate = midiToPlaybackRate(midiNote);
    this.getParam('playbackRate')!.setValueAtTime(noteAsRate, time);
    this.getParam('velocity')!.setValueAtTime(velocity, time);

    const envGain = this.getParam('envGain')!;
    cancelScheduledParamValues(envGain, this.now);
    envGain.setValueAtTime(0, this.now);
    envGain.linearRampToValueAtTime(1, this.now + attackTime);

    this.sendToProcessor({
      type: 'voice:start',
      time,
      offset,
      duration,
    });

    this.#isPlaying = true;

    this.#messages.sendMessage('voice:started', {
      midiNote,
      time,
      duration,
    });

    return this;
  }

  release(options: { releaseTime?: number }): this {
    if (!this.#isPlaying) return this;
    const { releaseTime = 0.3 } = options;

    const envGain = this.getParam('envGain')!;
    cancelScheduledParamValues(envGain, this.now);
    envGain.setValueAtTime(envGain.value, this.now);
    envGain.linearRampToValueAtTime(0, this.now + releaseTime);

    this.sendToProcessor({
      type: 'voice:release',
    });

    return this;
  }

  stop(): this {
    // ! just for immediate, force stop
    if (!this.#isPlaying) return this;

    this.setParam('envGain', 0, {});

    this.sendToProcessor({
      type: 'voice:stop',
    });

    return this;
  }

  setLoopEnabled(enabled: boolean) {
    console.log('SOURCE ENABLED: ', enabled);
    this.getParam('loop')!.setValueAtTime(enabled ? 1 : 0, this.now);
    return this;
  }

  setLoopStart(targetValue: number, rampTime: number = 0.1) {
    this.getParam('loopStart')!.linearRampToValueAtTime(
      targetValue,
      this.now + rampTime
    );

    return this;
  }

  setLoopEnd(targetValue: number, rampTime: number = 0.1) {
    this.getParam('loopEnd')!.linearRampToValueAtTime(
      targetValue,
      this.now + rampTime
    );

    return this;
  }

  setRate(rate: number): this {
    this.getParam('playbackRate')!.setValueAtTime(rate, this.now);
    return this;
  }

  set enablePositionTracking(enabled: boolean) {
    this.sendToProcessor({
      type: 'voice:usePlaybackPosition',
      value: enabled,
    });
  }

  // Properties
  get now() {
    return this.context.currentTime;
  }

  get isPlaying(): boolean {
    return this.#isPlaying;
  }

  get duration(): number {
    return this.#duration;
  }

  dispose() {
    this.stop();
    this.disconnect();
    this.port.close();
    deleteNodeId(this.nodeId);
  }
}
