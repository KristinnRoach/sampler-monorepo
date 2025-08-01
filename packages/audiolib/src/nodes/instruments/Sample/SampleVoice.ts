import { LibAudioNode, VoiceType, Destination, NodeType } from '@/nodes';
import { getAudioContext } from '@/context';
import { registerNode, NodeID, unregisterNode } from '@/nodes/node-store';
import { VoiceState } from '../VoiceState';

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

import { midiToPlaybackRate } from '@/utils';

import {
  CustomEnvelope,
  EnvelopeData,
  type EnvelopeType,
  createEnvelope,
} from '@/nodes/params/envelopes';

import { getMaxFilterFreq } from './param-defaults';
import { HarmonicFeedback } from '@/nodes/effects/HarmonicFeedback';

export class SampleVoice {
  readonly nodeId: NodeID;
  readonly nodeType: NodeType = 'sample-voice';

  #destination: Destination | null = null;
  #outputNode: AudioNode;
  #worklet: AudioWorkletNode;
  #messages: MessageBus<Message>;

  #state: VoiceState = VoiceState.NOT_READY;
  #isInitialized: boolean = false;

  #activeMidiNote: number | null = null;
  #startedTimestamp: number = -1;

  #sampleDurationSeconds = 0;

  #envelopes = new Map<EnvelopeType, CustomEnvelope>();

  feedback: HarmonicFeedback | null;

  #pitchGlideTime = 0; // in seconds

  #filtersEnabled: boolean;
  #hpf: BiquadFilterNode | null = null;
  #lpf: BiquadFilterNode | null = null;
  #hpfHz: number = 40;
  #hpfQ: number = 0.707;
  #lpfHz: number = 18000;
  #lpfQ: number = 0.707;

  constructor(
    private context: AudioContext = getAudioContext(),
    destination: AudioNode,
    options: { processorOptions?: any; enableFilters?: boolean } = {}
  ) {
    this.nodeId = registerNode(this.nodeType, this);
    this.#messages = createMessageBus<Message>(this.nodeId);

    this.#worklet = new AudioWorkletNode(context, 'sample-player-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: options.processorOptions || {},
    });

    this.feedback = new HarmonicFeedback(this.context);
    this.feedback.input.gain.setValueAtTime(1.5, this.now);

    this.#filtersEnabled = options.enableFilters ?? true;

    // Create filters if enabled
    if (this.#filtersEnabled) {
      this.#hpfHz = 50;
      this.#lpfHz = this.context.sampleRate / 2 - 1000;

      if (!this.#hpf) {
        this.#hpf = new BiquadFilterNode(context, {
          type: 'highpass',
          frequency: this.#hpfHz,
          Q: this.#hpfQ,
        });
      }

      if (!this.#lpf) {
        this.#lpf = new BiquadFilterNode(context, {
          type: 'lowpass',
          frequency: this.#lpfHz,
          Q: this.#lpfQ,
        });
      }

      // Connect chain: worklet → hpf → lpf -> destination
      this.#worklet.connect(this.feedback.input);
      this.#worklet.connect(this.#hpf);

      this.feedback.output.connect(this.#hpf);

      this.#hpf.connect(this.#lpf);
      this.#lpf.connect(destination);

      this.#outputNode = this.#lpf;
      this.#destination = destination;
    } else {
      // No filters, worklet is the output node
      this.#worklet.connect(destination);
      this.#outputNode = this.#worklet;
      this.#destination = destination;
    }

    this.#setupWorkletMessageHandling();
    this.sendToProcessor({ type: 'voice:init' });

    this.#worklet.port.start();
  }

  #createEnvelopes() {
    this.#envelopes.forEach((env) => env.dispose());
    this.#envelopes.clear();

    const durationSeconds = this.#sampleDurationSeconds || undefined;
    const ampEnv = createEnvelope(this.context, 'amp-env', { durationSeconds });
    this.#envelopes.set('amp-env', ampEnv);

    const pitchEnv = createEnvelope(this.context, 'pitch-env', {
      durationSeconds,
    });

    this.#envelopes.set('pitch-env', pitchEnv);

    if (this.#filtersEnabled) {
      const MIN_HZ = 20;
      const MAX_HZ = this.context.sampleRate / 2 - 1000;

      const filterEnv = createEnvelope(this.context, 'filter-env', {
        durationSeconds,
        paramValueRange: [MIN_HZ, MAX_HZ],
        initEnable: false,
      });

      this.#envelopes.set('filter-env', filterEnv);
    }

    this.#setupEnvelopeMessageHandling();
  }

  logAvailableParams = () => {
    console.table(
      'Available worklet params:',
      Array.from(this.#worklet.parameters.keys())
    );
  };

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
      durationSeconds: buffer.duration,
    });

    if (zeroCrossings?.length) {
      this.#setZeroCrossings(zeroCrossings);

      this.sendToProcessor({
        type: 'voice:set_zero_crossings',
        zeroCrossings,
      });
    }

    return true;
  }

  #setZeroCrossings(zeroCrossings: number[]): this {
    this.sendToProcessor({
      type: 'voice:set_zero_crossings',
      zeroCrossings,
    });
    return this;
  }

  set transposeSemitones(semitones: number) {
    this.sendToProcessor({ type: 'transpose', semitones });
  }

  setGlideTime(seconds: number) {
    this.#pitchGlideTime = seconds;
  }

  trigger(options: {
    midiNote: MidiValue;
    velocity: MidiValue;
    secondsFromNow?: number;
    currentLoopEnd?: number;
    glide?: { fromPlaybackRate: number; glideTime?: number };
  }): MidiValue | null {
    const {
      midiNote = 60,
      velocity = 100,
      secondsFromNow = 0,
    } = {
      ...options,
    };

    // Using the same audio context current time for all ops
    const timestamp = this.now + secondsFromNow;
    const glideTime = options.glide?.glideTime ?? this.#pitchGlideTime;

    this.feedback?.trigger(midiNote, {
      velocity,
      secondsFromNow,
      glideTime,
      triggerDecay: true,
    });

    this.#startedTimestamp = timestamp;
    this.#activeMidiNote = midiNote;

    if (
      this.#state === VoiceState.PLAYING ||
      this.#state === VoiceState.RELEASING
    ) {
      console.log(`had to stop a playing voice, midinote: ${midiNote}`);
      this.stop(timestamp);
      return null;
    }

    this.#state = VoiceState.PLAYING;

    this.setParam('velocity', velocity, timestamp);

    const playbackRate = midiToPlaybackRate(midiNote);

    if (options.glide && glideTime > 0) {
      this.getParam('playbackRate')!.linearRampToValueAtTime(
        playbackRate,
        timestamp + glideTime
      );
    } else {
      this.setParam('playbackRate', playbackRate, timestamp);
    }

    // Start playback
    this.sendToProcessor({
      type: 'voice:start',
      timestamp,
    });

    // Apply amp, filter and pitch envelopes if enabled
    this.applyEnvelopes(timestamp, playbackRate, midiNote);

    return this.#activeMidiNote;
  }

  applyEnvelopes(
    timestamp: number,
    playbackRate: number,
    velocity?: number,
    midiNote?: number
  ) {
    this.#envelopes.forEach((env, envType) => {
      if (!env.isEnabled) return;
      const param = this.getParam(env.param);
      if (!param) return;
      if (envType === 'pitch-env' && !env.hasVariation()) return;

      const baseValue = (() => {
        switch (envType) {
          case 'amp-env':
            return velocity ? velocity / 127 : 1;
          case 'pitch-env':
            return playbackRate;
          case 'filter-env':
            return 1;
          default:
            return 1;
        }
      })();

      env.triggerEnvelope(param, timestamp, {
        baseValue,
        playbackRate,
        voiceId: this.nodeId,
        midiNote: midiNote ?? 60,
      });
    });

    const ampEnv = this.#envelopes.get('amp-env')!;
    const pitchEnv = this.#envelopes.get('pitch-env')!;
    const filterEnv = this.#envelopes.get('filter-env')!;

    this.sendUpstreamMessage('sample-envelopes:trigger', {
      voiceId: this.nodeId,
      midiNote: this.#activeMidiNote,
      envDurations: {
        'amp-env': ampEnv.syncedToPlaybackRate
          ? ampEnv.fullDuration / playbackRate / ampEnv.timeScale
          : ampEnv.fullDuration / ampEnv.timeScale,
        'pitch-env': pitchEnv.syncedToPlaybackRate
          ? pitchEnv.fullDuration / playbackRate / pitchEnv.timeScale
          : pitchEnv.fullDuration / pitchEnv.timeScale,
        'filter-env': filterEnv.syncedToPlaybackRate
          ? filterEnv.fullDuration / playbackRate / filterEnv.timeScale
          : filterEnv.fullDuration / filterEnv.timeScale,
      },
      loopEnabled: {
        'amp-env': ampEnv.loopEnabled,
        'pitch-env': pitchEnv.loopEnabled,
        'filter-env': filterEnv.loopEnabled,
      },
    });
  }

  #releaseTimeout: number | null = null;

  release({ releaseTime = this.releaseTime, secondsFromNow = 0 }): this {
    if (this.#state === VoiceState.RELEASING) return this;

    const envGain = this.getParam('envGain');
    if (!envGain) throw new Error('Cannot release - envGain parameter is null');

    this.#state = VoiceState.RELEASING;
    const timestamp = this.now + secondsFromNow;
    const playbackRate = this.getParam('playbackRate')?.value ?? 1;

    // Release all enabled envelopes
    this.#envelopes.forEach((env) => {
      if (!env.isEnabled) return;
      const param = this.getParam(env.param);
      if (!param) return;

      env.releaseEnvelope(param, timestamp, {
        playbackRate,
        voiceId: this.nodeId,
        midiNote: this.#activeMidiNote ?? 60, // not used
      });
    });

    // Immediate stop for zero release time
    if (releaseTime <= 0) return this.stop(timestamp);

    this.sendToProcessor({ type: 'voice:release', timestamp });

    // Get longest release time of enabled envelopes
    const enabledEnvelopes = Array.from(this.#envelopes.values()).filter(
      (env) => env.isEnabled
    );

    const effectiveReleaseTime =
      enabledEnvelopes.length > 0
        ? Math.max(...enabledEnvelopes.map((env) => env.releaseTime))
        : releaseTime; // Fallback passed in release time

    // Stop after release duration // todo: check for redundancy
    if (this.#releaseTimeout) clearTimeout(this.#releaseTimeout);
    this.#releaseTimeout = setTimeout(
      () => {
        try {
          if (this.#state === VoiceState.RELEASING) this.stop();
        } finally {
          this.#releaseTimeout = null;
        }
      },
      effectiveReleaseTime * 1000 + 50
    ); // 50ms buffer

    return this;
  }

  stop(timestamp = this.now): this {
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

    this.sendToProcessor({ type: 'voice:stop', timestamp });
    this.#state = VoiceState.STOPPED;
    return this;
  }

  // === ENVELOPES ===

  enableEnvelope = (envType: EnvelopeType) => {
    this.#envelopes.get(envType)?.enable();
  };

  disableEnvelope = (envType: EnvelopeType) => {
    this.#envelopes.get(envType)?.disable();

    if (envType === 'filter-env' && this.#filtersEnabled) {
      const lpf = this.getParam('lpf');
      lpf?.cancelScheduledValues(this.now);
      // will ramp to cutoff knob value when implemented
      lpf?.exponentialRampToValueAtTime(
        getMaxFilterFreq(this.context.sampleRate),
        this.now + 0.1
      );
    }
  };

  setEnvelopeTimeScale = (envType: EnvelopeType, timeScale: number) => {
    this.#envelopes.get(envType)?.setTimeScale(timeScale);
  };

  setEnvelopeSustainPoint = (envType: EnvelopeType, index: number | null) => {
    const env = this.#envelopes.get(envType);
    if (env?.isEnabled) env.setSustainPoint(index);
  };

  setEnvelopeReleasePoint = (envType: EnvelopeType, index: number) => {
    const env = this.#envelopes.get(envType);
    if (env?.isEnabled) env.setReleasePoint(index);
  };

  addEnvelopePoint(envType: EnvelopeType, time: number, value: number) {
    const env = this.#envelopes.get(envType);
    if (env?.isEnabled) env.addPoint(time, value);
  }

  updateEnvelopePoint(
    envType: EnvelopeType,
    index: number,
    time?: number,
    value?: number
  ) {
    const env = this.#envelopes.get(envType);
    if (env?.isEnabled) env.updatePoint(index, time, value);
  }

  deleteEnvelopePoint(envType: EnvelopeType, index: number) {
    const env = this.#envelopes.get(envType);
    if (env?.isEnabled) env.deletePoint(index);
  }

  getEnvelope = (envType: EnvelopeType): CustomEnvelope | undefined => {
    return this.#envelopes.get(envType);
  };

  get envelopes() {
    return this.#envelopes;
  }

  setStartPoint = (time: number, timestamp = this.now) => {
    this.setParam('startPoint', time, timestamp);

    // this.#ampEnv.updateStartPoint(time);
    // this.#pitchEnv.updateStartPoint(time); // filterenv
    // Todo: figure out this system
  };

  setEndPoint = (time: number, timestamp = this.now) => {
    this.setParam('endPoint', time, timestamp);

    // this.#ampEnv.updateEndPoint(time);
    // Todo: figure out this system
  };

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

    if (cancelPrevious) param.cancelScheduledValues(timestamp); // cancelScheduledParamValues(param, timestamp, currVal);

    if (glideTime <= 0)
      param.setValueAtTime(targetValue, Math.max(timestamp, this.now + 0.001));
    else
      param.linearRampToValueAtTime(
        targetValue,
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

  setLoopPoints(
    start: number,
    end: number,
    timestamp = this.now,
    rampTime = 0
  ): this {
    if (start >= end) return this;

    if (start !== undefined) {
      this.setParam('loopStart', start, timestamp, {
        glideTime: rampTime,
        cancelPrevious: true,
      });
    }
    if (end !== undefined) {
      this.setParam('loopEnd', end, timestamp, {
        glideTime: rampTime,
        cancelPrevious: true,
      });
    }

    return this;
  }

  setAllowedPeriods(periods: number[]): this {
    this.sendToProcessor({
      type: 'setAllowedPeriods',
      allowedPeriods: periods,
    });

    return this;
  }

  /** CONNECTIONS */

  connect(
    destination: Destination,
    output?: number,
    input?: number
  ): Destination {
    if (destination === this.#destination) return this.#destination;

    if (destination instanceof LibAudioNode) {
      this.out.connect(destination.input, output);
    } else if (destination instanceof AudioParam) {
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

  /** MESSAGES */

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  sendToProcessor(data: any): this {
    this.#worklet.port.postMessage(data);
    return this;
  }

  sendUpstreamMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
    return this;
  }

  #setupEnvelopeMessageHandling() {
    this.#envelopes.forEach((env, envType) => {
      this.#messages.forwardFrom(
        env,
        [`${envType}:trigger`, `${envType}:release`, `${envType}:trigger:loop`],
        (msg) => ({
          ...msg,
          voiceId: this.nodeId,
          midiNote: this.#activeMidiNote,
        })
      );
    });
  }

  #setupWorkletMessageHandling() {
    this.#worklet.port.onmessage = (event: MessageEvent) => {
      let { type, ...data } = event.data;

      switch (type) {
        case 'initialized':
          this.#isInitialized = true;
          this.#state = VoiceState.NOT_READY; // not loaded
          // this.logAvailableParams(); // as needed for debugging
          break;

        case 'voice:loaded':
          this.#activeMidiNote = null;
          this.#state = VoiceState.LOADED;

          if (data.durationSeconds) {
            this.#activeMidiNote = null;
            this.#sampleDurationSeconds = data.durationSeconds;

            this.#createEnvelopes();

            this.setStartPoint(0);
            this.setEndPoint(data.durationSeconds);

            // ? Why is this necessary ?
            // Initialize loopEnd to 0 to force the macro parameter to update
            // This ensures the macro's value (1) will be applied when connected
            this.setParam('loopEnd', 0, this.now);
          }
          break;

        case 'voice:transposed':
          break;

        case 'voice:started':
          this.#state = VoiceState.PLAYING;
          data = {
            voice: this,
            midiNote: this.#activeMidiNote,
          };
          break;

        case 'voice:stopped':
          this.#state = VoiceState.STOPPED;
          data = {
            voiceId: this.nodeId,
            voice: this,
            midiNote: this.#activeMidiNote,
          };
          this.#activeMidiNote = null;
          break;

        case 'voice:releasing':
          this.#state = VoiceState.RELEASING;
          data = {
            voiceId: this.nodeId,
            voice: this,
            midiNote: this.#activeMidiNote,
          };
          break;

        case 'loop:enabled':
          // this.#loopEnabled = true;
          break;

        case 'voice:looped':
          break;

        case 'voice:position':
          this.getParam('playbackPosition')?.setValueAtTime(
            data.position,
            this.context.currentTime
          );
          break;

        case 'debug:params':
          console.debug(
            'Debug params: ',
            { loopStart: data.loopStart },
            { loopStartSamples: data.loopStartSamples },
            { loopEnd: data.loopEnd },
            { loopEndSamples: data.loopEndSamples }
          );
          break;

        case 'debug:loop':
          console.log('Loop debug:', data);
          break;

        default:
          console.warn(`Unhandled message type: ${type}`);
          break;
      }

      this.sendUpstreamMessage(type, data);
    };
  }

  // Getters

  getPlaybackDuration() {
    const startPoint = this.getParam('startPoint')!.value;
    const endPoint = this.getParam('endPoint')!.value;
    return endPoint - startPoint;
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

  get triggerTimestamp(): number {
    return this.#startedTimestamp;
  }

  get sampleDurationSeconds() {
    return this.#sampleDurationSeconds;
  }

  get startPoint() {
    return this.getParam('startPoint')!.value;
  }

  get endPoint() {
    return this.getParam('endPoint')!.value;
  }

  get releaseTime() {
    return this.#envelopes.get('amp-env')!.releaseTime;
  }

  // Setters

  setMasterGain(gain: number) {
    const param = this.#worklet.parameters.get('masterGain')!;
    param.cancelScheduledValues(this.context.currentTime);
    param.setTargetAtTime(gain, this.context.currentTime, 0.006);
  }

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

    if (!enabled && this.#activeMidiNote) this.release({});
    return this;
  }

  setEnvelopeLoop = (
    envType: EnvelopeType,
    loop: boolean,
    mode: 'normal' | 'ping-pong' | 'reverse' = 'normal'
  ) => {
    const env = this.#envelopes.get(envType);
    env?.setLoopEnabled(loop, mode);
    return this;
  };

  syncEnvelopeToPlaybackRate = (envType: EnvelopeType, sync: boolean) => {
    const env = this.#envelopes.get(envType);
    env?.syncToPlaybackRate(sync);
    return this;
  };

  setPlaybackRate(
    rate: number,
    atTime = this.now,
    options?: {
      glideTime?: number;
      cancelPrevious?: boolean;
    }
  ): this {
    this.setParam('playbackRate', rate, atTime, options);
    return this;
  }

  debugDuration() {
    console.info(`
      sample duration: ${this.sampleDurationSeconds}, 
      startPoint: ${this.getParam('startPoint')!.value}, 
      endPoint: ${this.getParam('endPoint')!.value}, 
      playback duration: ${this.getPlaybackDuration()}
      `);
  }

  dispose(): void {
    this.stop();
    this.disconnect();
    this.#envelopes.forEach((env) => env.dispose());
    this.#worklet.port.close();
    if (this.#releaseTimeout) clearTimeout(this.#releaseTimeout);
    unregisterNode(this.nodeId);
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
