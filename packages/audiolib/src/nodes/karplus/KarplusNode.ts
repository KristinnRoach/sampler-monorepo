import { createNodeId, deleteNodeId } from '@/store/state/IdStore';
import { getAudioContext } from '@/context';
import { LibSourceNode } from '@/nodes';
import { Message, MessageHandler, createMessageBus } from '@/events';

export class KarplusNode implements LibSourceNode {
  readonly nodeId: NodeID;
  readonly nodeType: string = 'karplus-strong';
  readonly processorNames: string[] = [
    'random-noise-processor',
    'feedback-delay-processor',
  ];

  #messages;

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
  #volume: number = 0.5;

  #isPlaying: boolean = false;

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
          gain: 0.9, // Initial feedback gain (controls decay) // ? should be tied to (peak) volume?
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

  trigger(options: { midiNote: number; velocity: number }): this {
    if (this.#isPlaying) return this;

    this.#isPlaying = true;
    const { midiNote, velocity } = options;

    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
    const delayMs = 1000 / frequency;
    // const bufferCompensation = (1000 * 128) / this.ctx.sampleRate;
    // const totalDelay = delayMs + bufferCompensation;
    const totalDelay = delayMs;

    this.delay = { ms: totalDelay };
    // Reset gain params
    this.outputGain.gain.cancelScheduledValues(this.now);
    this.outputGain.gain.setValueAtTime(this.#volume, this.now);
    this.noiseGain.gain.cancelScheduledValues(this.now);
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

  release(releaseTime: number): this {
    if (!this.#isPlaying) return this;

    const now = this.now;
    this.outputGain.gain.cancelAndHoldAtTime(this.now);
    // this.outputGain.gain.setValueAtTime(this.outputGain.gain.value, now);
    this.outputGain.gain.linearRampToValueAtTime(0.00001, now + releaseTime);

    // timeout just for now, should be onEnded notification message
    setTimeout(
      () => {
        this.#isPlaying = false;
        this.stop();
      },
      releaseTime + 0.1 * 1000
    );

    this.sendMessage('voice:ended', {});
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
