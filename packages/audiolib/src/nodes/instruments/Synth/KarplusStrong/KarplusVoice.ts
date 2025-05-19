import { createNodeId, deleteNodeId } from '@/nodes/node-store';
import { getAudioContext } from '@/context';
import { LibVoiceNode, VoiceType } from '@/LibNode';
import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';
import { assert, cancelScheduledParamValues } from '@/utils';

export class KarplusVoice implements LibVoiceNode {
  readonly nodeId: NodeID;
  readonly nodeType: VoiceType = 'karplus-strong';
  readonly processorNames: string[] = [
    'random-noise-processor',
    'feedback-delay-processor',
  ];

  #messages: MessageBus<Message>;

  paramMap: Map<string, AudioParam>;

  delayParam: AudioParam;
  holdMs: number = 10;

  fbParamMap: Map<string, AudioParam>;
  noiseParamMap: Map<string, AudioParam>;

  audioContext: AudioContext;
  noiseGenerator: AudioWorkletNode;
  feedbackDelay: AudioWorkletNode;
  noiseGain: GainNode;
  outputGain: GainNode;

  #volume: number = 0.3; // todo: standardize
  #startTime: number = 0;
  #noteId: number | null = null;
  #midiNote: number = 0;

  #isPlaying: boolean = false; // todo: remove

  constructor(context: AudioContext = getAudioContext()) {
    this.nodeId = createNodeId(this.nodeType);
    this.#messages = createMessageBus<Message>(this.nodeId);
    this.audioContext = context;
    this.noiseGenerator = new AudioWorkletNode(
      context,
      'random-noise-processor'
    );
    this.noiseGain = new GainNode(context, { gain: 0 });
    this.outputGain = new GainNode(context);
    this.feedbackDelay = new AudioWorkletNode(
      context,
      'feedback-delay-processor',
      {
        parameterData: {
          delayTime: 5, // Initial delay time
          gain: 0.8 * this.#volume, // Initial feedback gain (controls decay) // ? should be tied to (peak) volume?
        },
      }
    );

    this.fbParamMap = this.feedbackDelay.parameters as Map<string, AudioParam>;
    this.noiseParamMap = this.noiseGenerator.parameters as Map<
      string,
      AudioParam
    >;

    // Create a combined parameter map for all parameters
    this.paramMap = new Map([
      ['decay', this.fbParamMap.get('gain')!], // todo: clarify decayFactor vs decayTime vs noiseTime
      [
        'noiseTime',
        {
          value: this.holdMs,
          setValueAtTime: (value: number) => {
            this.holdMs = value;
            return value;
          },
        } as unknown as AudioParam,
      ],
    ]);

    this.delayParam = this.fbParamMap.get('delayTime')!;

    // Connect
    this.noiseGenerator.connect(this.noiseGain);
    this.noiseGain.connect(this.outputGain);
    this.noiseGain.connect(this.feedbackDelay);
    this.feedbackDelay.connect(this.outputGain);
  }

  getParam(name: string): AudioParam | null {
    return this.paramMap.get(name) || null;
  }

  setParam(name: string, value: number): this {
    const param = this.paramMap.get(name);
    if (param) {
      if (name === 'noiseTime') {
        this.holdMs = value;
      } else {
        param.setValueAtTime(value, this.now + 0.0001);
      }
    }
    return this;
  }

  onMessage(type: string, handler: (data: any) => void) {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
  }

  trigger(options: {
    midiNote: number;
    velocity: number;
    noteId?: number;
  }): this {
    if (this.#isPlaying) return this;

    this.#isPlaying = true;
    this.#startTime = this.now;

    const { midiNote, velocity, noteId } = options;
    this.#midiNote = midiNote;
    this.#noteId = noteId ?? null;

    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
    const delayMs = 1000 / frequency;
    // const bufferCompensation = (1000 * 128) / this.ctx.sampleRate;
    // const totalDelay = delayMs + bufferCompensation;
    const totalDelay = delayMs;

    this.delay = { ms: totalDelay };

    // Reset gain params
    cancelScheduledParamValues(this.outputGain.gain, this.now);
    this.outputGain.gain.cancelScheduledValues(this.now);
    this.outputGain.gain.setValueAtTime(this.#volume, this.now);

    cancelScheduledParamValues(this.noiseGain.gain, this.now);
    this.noiseGain.gain.setValueAtTime(0, this.now);

    // Schedule noise burst to excite the string using current holdMs value
    this.noiseGain.gain.linearRampToValueAtTime(
      this.#volume * velocity,
      this.now //+ this.#attackTime
    );

    this.noiseGain.gain.linearRampToValueAtTime(
      0,
      this.now + this.holdMs / 1000 // + this.#attackTime
    );

    this.sendMessage('voice:started', { ...options });
    return this;
  }

  release({
    release_sec = 0.3,
    secondsFromNow = 0,
  }: {
    release_sec?: number;
    secondsFromNow?: number;
  } = {}): this {
    if (!this.#isPlaying) return this;

    const now = this.now + secondsFromNow;
    cancelScheduledParamValues(this.outputGain.gain, now);
    this.outputGain.gain.linearRampToValueAtTime(0.00001, now + release_sec);

    setTimeout(
      () => {
        this.#isPlaying = false;
        this.sendMessage('voice:ended', {
          noteId: this.#noteId,
          midiNote: this.#midiNote,
        });
      },
      (release_sec + secondsFromNow) * 1000
    );

    return this;
  }

  stop() {
    if (!this.#isPlaying) return this;
    this.noiseGain.gain.cancelScheduledValues(this.now);
    this.outputGain.gain.cancelScheduledValues(this.now);
    this.outputGain.gain.setValueAtTime(0, this.now);
    this.noiseGain.gain.setValueAtTime(0, this.now);
    // this.feedbackDelay.port.postMessage({ type: 'stop' });
    this.#isPlaying = false;
    return this;
  }

  connect(
    destination: AudioNode,
    outputIndex?: number,
    inputIndex?: number
  ): this {
    this.outputGain.connect(destination); // , outputIndex, inputIndex);
    return this;
  }

  disconnect() {
    this.outputGain.disconnect();
  }

  dispose(): void {
    this.stop();
    this.disconnect();
    this.noiseGenerator.port.close();
    deleteNodeId(this.nodeId);
  }

  set volume(value: number) {
    this.#volume = value;
  }

  set delay({ ms, rampTime = 0.0 }: { ms: number; rampTime?: number }) {
    this.delayParam.linearRampToValueAtTime(ms, this.now + rampTime);
  }

  get ctx() {
    return this.audioContext;
  }

  get startTime(): number {
    return this.#startTime;
  }

  get now() {
    return this.audioContext.currentTime;
  }

  get isPlaying(): boolean {
    return this.#isPlaying;
  }

  sendToProcessor(data: any): void {
    // Forward messages to both processors
    this.noiseGenerator.port.postMessage(data);
    this.feedbackDelay.port.postMessage(data);
  }
}
