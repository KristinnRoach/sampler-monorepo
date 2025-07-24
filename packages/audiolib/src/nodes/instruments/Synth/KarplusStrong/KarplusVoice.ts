import { createNodeId, deleteNodeId } from '@/nodes/node-store';
import { getAudioContext } from '@/context';
import {
  Destination,
  LibVoiceNode,
  VoiceType,
  Connectable,
} from '@/nodes/LibNode';
import { Message, createMessageBus, MessageBus } from '@/events';
import { mapToRange, clamp, assert, cancelScheduledParamValues } from '@/utils';
import { KARPLUS_DEFAULTS } from './defaults';

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

  fbParamMap: Map<string, AudioParam>;
  noiseParamMap: Map<string, AudioParam>;

  audioContext: AudioContext;
  noiseGenerator: AudioWorkletNode;
  feedbackDelay: AudioWorkletNode;
  noiseGain: GainNode;
  outputGain: GainNode;

  #VOICE_VOLUME: number = 0.1; // Default (volume changes handled in synth) // Todo: manage reasonable range

  #constantGain: number = 0;

  #attackTime: number = KARPLUS_DEFAULTS.attack;
  #noiseTime: number = KARPLUS_DEFAULTS.noiseTime; // time params are in seconds
  #startTime: number = 0;
  #noteId: number | null = null;
  #midiNote: number = 0;

  #isPlaying: boolean = false; // todo: remove
  #isReady: boolean = false;

  #hpf: BiquadFilterNode | null = null;
  #lpf: BiquadFilterNode | null = null;
  #maxLpfhz: number = 18000;
  #filtersEnabled = true;

  #hpfHz: number = 80; // default
  #lpfHz: number = 18000; // set later using audio context sample rate
  #lpfQ: number = 0.5;
  #hpfQ: number = 0.5;

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
          delayTime: 0.005,
          gain: 0.95,
        },
      }
    );

    this.configureProcessor();

    this.fbParamMap = this.feedbackDelay.parameters as Map<string, AudioParam>;
    this.noiseParamMap = this.noiseGenerator.parameters as Map<
      string,
      AudioParam
    >;

    // Create a combined parameter map for all parameters
    this.paramMap = new Map([
      ['decay', this.fbParamMap.get('feedbackAmount')!],
      [
        'noiseTime',
        {
          value: this.#noiseTime,
          setValueAtTime: (value: number) => {
            this.#noiseTime = value;
            return value;
          },
        } as unknown as AudioParam,
      ],
    ]);

    this.delayParam = this.fbParamMap.get('delayTime')!;

    if (options.enableFilters !== undefined) {
      this.#filtersEnabled = options.enableFilters;
    }

    this.setupAudioGraph();

    this.#isReady = true;
  }

  // ==== CONFIG ====

  private configureProcessor(): void {
    this.setMaxOutput(0.3);
    this.setAutoGain(true, 0.13);
    this.setLimiting('hard-clipping');
  }

  private setupAudioGraph(): void {
    // Set low-pass filter frequency based on context sample rate
    this.#maxLpfhz = this.audioContext.sampleRate / 2 - 1000;
    this.#lpfHz = this.#maxLpfhz;

    if (this.#filtersEnabled) {
      this.#hpf = new BiquadFilterNode(this.audioContext, {
        type: 'highpass',
        frequency: this.#hpfHz,
        Q: this.#hpfQ,
      });
      this.#lpf = new BiquadFilterNode(this.audioContext, {
        type: 'lowpass',
        frequency: this.#maxLpfhz,
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
  }

  // ==== CONNECT ====

  connectFromTo(
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

  disconnectFromTo(): this {
    this.outputGain.disconnect();
    return this;
  }

  // ==== PLAYBACK ====

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

    const frequency = (440 * Math.pow(2, (midiNote - 69) / 12)) / 2; // ! TEMP
    const delaySec = 1 / frequency;
    // const bufferCompensation = 128 / this.ctx.sampleRate;
    // const totalDelay = delaySec + bufferCompensation;

    this.setDelay(delaySec);

    if (this.#constantGain === 0) {
      console.debug('this.#constantGain === 0', this.#constantGain === 0);
      // Reset gain params
      cancelScheduledParamValues(this.outputGain.gain, this.now);
      this.outputGain.gain.cancelScheduledValues(this.now);
      this.outputGain.gain.setValueAtTime(this.#VOICE_VOLUME, this.now);

      const currentNoiseGain = this.noiseGain.gain.value;

      cancelScheduledParamValues(this.noiseGain.gain, this.now);
      this.noiseGain.gain.cancelScheduledValues(this.now);
      this.noiseGain.gain.setValueAtTime(currentNoiseGain, this.now);

      // Schedule noise burst to excite the string using current holdMs value
      this.noiseGain.gain.linearRampToValueAtTime(
        this.#VOICE_VOLUME * velocity,
        this.now + this.#attackTime
      );

      this.noiseGain.gain.linearRampToValueAtTime(
        0,
        this.now + this.#noiseTime + this.#attackTime
      );
    }

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

    cancelScheduledParamValues(this.noiseGain.gain, this.now);
    this.noiseGain.gain.linearRampToValueAtTime(0, now + release_sec);

    cancelScheduledParamValues(this.outputGain.gain, now);
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

  // === SETTERS ===

  set volume(value: number) {
    this.#VOICE_VOLUME = value;
  }

  set attack(seconds: number) {
    const clamped = clamp(seconds, 0.001, 2);
    this.#attackTime = clamped;
  }

  setDelay(seconds: number, timestamp = this.now, rampDuration = 0): this {
    const clampedRamp = clamp(rampDuration, 0, 4);
    const clampedSeconds = clamp(seconds, 0, 4);

    if (clampedRamp === 0) {
      this.delayParam.setValueAtTime(seconds, timestamp);
    } else {
      this.delayParam.linearRampToValueAtTime(
        clampedSeconds,
        this.now + clampedRamp
      );
    }
    return this;
  }

  setDecay(normGain: number, timestamp = this.now): this {
    const mappedGain = mapToRange(normGain, 0, 1, 1.1, 1.2); // todo: fix ranges (probably best to create separate fb-dly processors for ks voice and ks effect)
    this.fbParamMap
      .get('feedbackAmount')!
      .setValueAtTime(mappedGain, timestamp);
    return this;
  }

  setNoiseHpfHz(frequency: number): this {
    this.noiseGenerator.port.postMessage({
      type: 'setHpfHz',
      value: frequency,
    });
    return this;
  }

  setNoiseTime(seconds: number): this {
    // todo: fix non responiveness at low values
    const clamped = clamp(seconds, 0.003, 1);
    this.#noiseTime = clamped;
    return this;
  }

  setNoiseGain(gain: number) {
    const safeGain = mapToRange(gain, 0, 1, 0.01, this.#VOICE_VOLUME + 0.01);
    this.noiseGain.gain.cancelScheduledValues(this.now);
    this.noiseGain.gain.setValueAtTime(safeGain, this.now); // ? Check time constant

    this.#constantGain = safeGain;
  }

  setLimiting(mode: 'soft-clipping' | 'hard-clipping' | 'none'): this {
    this.feedbackDelay.port.postMessage({
      type: 'setLimiting',
      mode: mode,
    });
    return this;
  }

  setAutoGain(enabled: boolean, amount = 0.1): this {
    this.feedbackDelay.port.postMessage({
      type: 'setAutoGain',
      enabled: enabled,
      amount,
    });
    return this;
  }

  setMaxOutput(level: number): this {
    this.feedbackDelay.port.postMessage({
      type: 'setMaxOutput',
      level: level,
    });
    return this;
  }

  setParam(name: string, value: number): this {
    const param = this.paramMap.get(name);
    if (param) {
      if (name === 'noiseTime') {
        console.debug(value);
        this.#noiseTime = value;
      } else if (name === 'decay') {
        this.setDecay(value);
      } else {
        param.setValueAtTime(value, this.now + 0.0001);
      }
    } else if (this.#filtersEnabled) {
      switch (name) {
        case 'noiseHpfHz':
          this.setNoiseHpfHz(value);
          break;
        case 'highpass':
        case 'hpf':
          if (this.#hpf)
            this.#hpf.frequency.setValueAtTime(value, this.now + 0.0001);
          break;
        case 'lowpass':
        case 'lpf':
          if (this.#lpf)
            assert(
              value > 10 && value < this.#maxLpfhz,
              `Invalid lpf cutoff! Value: ${value}`
            );
          this.#lpf?.frequency.setValueAtTime(value, this.now + 0.0001);
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

  // ==== GETTERS ====

  get in() {
    return this.noiseGain;
  }

  get initialized() {
    return this.#isReady;
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

  get startTime(): number {
    return this.#startTime;
  }

  get hpf() {
    return this.#hpf;
  }

  get lpf() {
    return this.#lpf;
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

  // ==== MESSAGES ====

  onMessage(type: string, handler: (data: any) => void) {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
  }

  sendToProcessor(data: any): void {
    // Forward messages to both processors
    this.noiseGenerator.port.postMessage(data);
    this.feedbackDelay.port.postMessage(data);
  }

  dispose(): void {
    this.stop();
    this.disconnectFromTo();
    this.noiseGenerator.port.close();
    deleteNodeId(this.nodeId);
  }
}
