import { createNodeId, deleteNodeId } from '@/nodes/node-store';
import { getAudioContext } from '@/context';
import {
  Destination,
  LibVoiceNode,
  VoiceType,
  Connectable,
} from '@/nodes/LibNode';
import { Message, createMessageBus, MessageBus } from '@/events';
import { cancelScheduledParamValues } from '@/utils';

export class KarplusVoice implements LibVoiceNode, Connectable {
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
  #attackTime: number = 0;
  #startTime: number = 0;
  #noteId: number | null = null;
  #midiNote: number = 0;

  #isPlaying: boolean = false; // todo: remove

  #isReady: boolean = false;

  #hpf: BiquadFilterNode | null = null;
  #lpf: BiquadFilterNode | null = null;
  #filtersEnabled: boolean;

  #hpfHz: number = 100; // High-pass filter frequency
  #lpfHz: number; // Low-pass filter frequency needs to be set using audio context sample rate
  #lpfQ: number = 1; // Low-pass filter Q factor
  #hpfQ: number = 1; // High-pass filter Q factor

  constructor(
    context: AudioContext = getAudioContext(),
    options: { enableFilters?: boolean } = {}
  ) {
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
          gain: 0.8, // ? research init value for this * this.#volume, // Initial feedback gain (controls decay) // ? should be tied to (peak) volume?
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
      ['decay', this.fbParamMap.get('gain')!], // todo: clarify
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

    // Set low-pass filter frequency based on context sample rate
    this.#lpfHz = this.audioContext.sampleRate / 2 - 100;
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

      // Connect with filters
      this.noiseGenerator.connect(this.noiseGain);
      this.noiseGain.connect(this.feedbackDelay);
      this.noiseGain.connect(this.#hpf);
      this.feedbackDelay.connect(this.#hpf);
      this.#hpf.connect(this.#lpf);
      this.#lpf.connect(this.outputGain);
    } else {
      // Connect without filters
      this.noiseGenerator.connect(this.noiseGain);
      this.noiseGain.connect(this.outputGain);
      this.noiseGain.connect(this.feedbackDelay);
      this.feedbackDelay.connect(this.outputGain);
    }

    this.#isReady = true;
  }

  get in() {
    return this.noiseGain;
  }

  get isReady() {
    return this.#isReady;
  }

  getParam(name: string): AudioParam | null {
    const param = this.paramMap.get(name);
    if (param) return param;

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

  // TODO: Standardize
  setParam(name: string, value: number): this {
    const param = this.paramMap.get(name);
    if (param) {
      if (name === 'noiseTime') {
        this.holdMs = value;
      } else {
        param.setValueAtTime(value, this.now + 0.0001);
      }
    } else if (this.#filtersEnabled) {
      // Handle filter parameters
      switch (name) {
        case 'highpass':
        case 'hpf':
          if (this.#hpf)
            this.#hpf.frequency.setValueAtTime(value, this.now + 0.0001);
          break;
        case 'lowpass':
        case 'lpf':
          if (this.#lpf)
            this.#lpf.frequency.setValueAtTime(value, this.now + 0.0001);
          break;
        case 'hpfQ':
          if (this.#hpf) this.#hpf.Q.setValueAtTime(value, this.now + 0.0001);
          break;
        case 'lpfQ':
          if (this.#lpf) this.#lpf.Q.setValueAtTime(value, this.now + 0.0001);
          break;
      }
    }
    return this;
  }

  set attack(value: number) {
    this.#attackTime = value;
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
      this.now + this.#attackTime
    );

    this.noiseGain.gain.linearRampToValueAtTime(
      0,
      this.now + this.holdMs / 1000 + this.#attackTime
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
    this.noiseGain.gain.linearRampToValueAtTime(0, now + release_sec);

    cancelScheduledParamValues(this.noiseGain.gain, this.now);
    this.outputGain.gain.linearRampToValueAtTime(0, now + release_sec);

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
    destination: Destination,
    output?: number,
    input?: number
  ): Destination {
    if (destination instanceof AudioParam) {
      this.outputGain.connect(destination, output);
    } else if (destination instanceof AudioNode) {
      this.outputGain.connect(destination, output, input);
    } else {
      console.warn(`SampleVoice: Unsupported destination: ${destination}`);
    }
    return destination;
  }

  disconnect(): this {
    this.outputGain.disconnect();
    return this;
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

  get hpf() {
    return this.#hpf;
  }

  get lpf() {
    return this.#lpf;
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
