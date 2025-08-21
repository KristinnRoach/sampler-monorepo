import { LibAudioNode, Destination, NodeType } from '@/nodes';
import { getAudioContext } from '@/context';
import { registerNode, NodeID, unregisterNode } from '@/nodes/node-store';
import { VoiceState } from '../VoiceState';

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

import {
  assert,
  clamp,
  interpolateLinearToExp,
  midiToPlaybackRate,
} from '@/utils';

import {
  CustomEnvelope,
  type EnvelopeType,
  createEnvelope,
} from '@/nodes/params/envelopes';

import { getMaxFilterFreq } from './param-defaults';
import { HarmonicFeedback } from '@/nodes/effects/HarmonicFeedback';

import { LFO } from '@/nodes/params/LFOs/LFO';
import {
  CustomLibWaveform,
  WaveformOptions,
} from '@/utils/audiodata/generate/generateWaveform';

export class SampleVoice {
  // TODO: implements ILibAudioNode
  readonly nodeId: NodeID;
  readonly nodeType: NodeType = 'sample-voice';
  #messages: MessageBus<Message>;
  #initPromise: Promise<void> | null = null;

  #outputNode: GainNode;
  #worklet: AudioWorkletNode;

  #am_lfo: LFO | null = null;
  #am_gain: GainNode | null = null;
  #feedback: HarmonicFeedback | null = null;

  #envelopes = new Map<EnvelopeType, CustomEnvelope>();

  #state: VoiceState = VoiceState.NOT_READY;
  #isInitialized = false;

  #activeMidiNote: number | null = null;
  #startedTimestamp: number = -1;

  #sampleDurationSeconds = 0;

  #pitchGlideTime = 0; // in seconds

  #filtersEnabled: boolean;
  #pitchDisabled = false;

  #hpf: BiquadFilterNode | null = null;
  #lpf: BiquadFilterNode | null = null;
  #hpfHz: number = 40;
  #hpfQ: number = 0.5;
  #lpfHz: number = 18000;
  #lpfQ: number = 0.707;

  constructor(
    private context: AudioContext = getAudioContext(),
    options: { processorOptions?: any; enableFilters?: boolean } = {}
  ) {
    this.nodeId = registerNode(this.nodeType, this);
    this.#messages = createMessageBus<Message>(this.nodeId);
    this.#filtersEnabled = options.enableFilters ?? true;

    this.#outputNode = new GainNode(context, { gain: 1 });

    this.#worklet = new AudioWorkletNode(context, 'sample-player-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2], // Force stereo output
      processorOptions: options.processorOptions || {},
    });
  }

  async init(): Promise<void> {
    if (this.#initPromise) return this.#initPromise;
    this.#initPromise = (async () => {
      try {
        // Create nodes
        if (this.#filtersEnabled) this.#initFilters();

        this.#feedback = new HarmonicFeedback(this.context);
        this.#feedback.input.gain.setValueAtTime(1.5, this.now);

        this.#am_gain = new GainNode(this.context, { gain: 1 });
        this.#setupAmpModLFO();

        // Connect nodes
        this.#connectAudioChain();

        // Create Envelopes // Todo: follow async pattern to the end
        this.#createEnvelopes();

        // Setup message handling
        this.#setupWorkletMessageHandling();
        this.sendToProcessor({ type: 'voice:init' });
        this.#worklet.port.start();
      } catch (error) {
        this.dispose();
        this.#initPromise = null;
        throw error;
      }
    })();
    return this.#initPromise;
  }

  #connectAudioChain() {
    assert(this.#feedback, 'SampleVoice: Feedback not initialized!');
    assert(this.#am_gain, 'SampleVoice: AM mod not initialized!');

    if (this.#filtersEnabled) {
      assert(this.#hpf && this.#lpf, 'SampleVoice: Filters not initialized!');

      // Connect: worklet -> feedback -> hpf -> lpf
      this.#worklet.connect(this.#feedback.input);
      this.#worklet.connect(this.#am_gain);
      this.#feedback.output.connect(this.#am_gain);
      this.#am_gain.connect(this.#hpf);
      this.#hpf.connect(this.#lpf);
      this.#lpf.connect(this.#outputNode);
    } else {
      // Without filters
      this.#worklet.connect(this.#feedback.input);
      this.#feedback.output.connect(this.#am_gain);
      this.#am_gain.connect(this.#outputNode);
    }
  }

  #initFilters() {
    this.#hpfHz = 50;
    this.#lpfHz = this.context.sampleRate / 2 - 1000;

    if (!this.#hpf) {
      this.#hpf = new BiquadFilterNode(this.context, {
        type: 'highpass',
        frequency: this.#hpfHz,
        Q: this.#hpfQ,
      });
    }

    if (!this.#lpf) {
      this.#lpf = new BiquadFilterNode(this.context, {
        type: 'lowpass',
        frequency: this.#lpfHz,
        Q: this.#lpfQ,
      });
    }
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
      type: 'voice:setBuffer',
      buffer: bufferData,
      durationSeconds: buffer.duration,
    });

    if (zeroCrossings?.length) {
      this.#setZeroCrossings(zeroCrossings);

      this.sendToProcessor({
        type: 'voice:setZeroCrossings',
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
    glide?: { prevMidiNote: number; glideTime?: number };
  }): MidiValue | null {
    const {
      midiNote = 60,
      velocity = 100,
      secondsFromNow = 0,
    } = {
      ...options,
    };

    const timestamp = this.now + secondsFromNow;

    if (
      this.#state === VoiceState.PLAYING ||
      this.#state === VoiceState.RELEASING
    ) {
      console.log(`had to stop a playing voice, midinote: ${midiNote}`);
      this.stop(timestamp);
      return null;
    }

    this.#state = VoiceState.PLAYING;
    this.#startedTimestamp = timestamp;
    this.#activeMidiNote = midiNote;

    const GLIDE_TEMP_SCALAR = 8; // for easy fine-tuning while prototyping the glide feature
    const glideTime = options.glide?.glideTime ?? this.#pitchGlideTime;
    const scaledGlideTime = glideTime / GLIDE_TEMP_SCALAR;

    let playbackRate = 1;
    let prevRate = 1;

    if (!this.#pitchDisabled) {
      playbackRate = midiToPlaybackRate(midiNote);
      if (options.glide) {
        prevRate = midiToPlaybackRate(options.glide.prevMidiNote);
      }
    }

    // Only apply glide if pitch is enabled and glide is requested
    if (!this.#pitchDisabled && options.glide && scaledGlideTime > 0) {
      const rateParam = this.getParam('playbackRate')!;
      prevRate > 0 && rateParam.setValueAtTime(prevRate, timestamp);

      this.getParam('playbackRate')!.setTargetAtTime(
        playbackRate,
        timestamp,
        scaledGlideTime
      );
    } else {
      this.setParam('playbackRate', playbackRate, timestamp);
    }

    this.setParam('velocity', velocity, timestamp);

    // Start playback
    this.sendToProcessor({
      type: 'voice:start',
      timestamp,
    });

    // Apply amp, filter and pitch envelopes if enabled
    this.applyEnvelopes(timestamp, playbackRate, midiNote);

    // Trigger effects
    this.#feedback?.trigger(midiNote, {
      velocity,
      secondsFromNow,
      glideTime: scaledGlideTime,
      triggerDecay: true,
    });

    this.#am_lfo?.setMusicalNote(midiNote, {
      divisor: 1,
      glideTime: scaledGlideTime,
      glideFromMidiNote: options?.glide?.prevMidiNote,
      timestamp,
    });

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

  // === LFOs ===

  /** Setup amplitude modulation LFO (if not already setup) */
  #setupAmpModLFO(
    depth = 0,
    waveform: CustomLibWaveform | OscillatorType | PeriodicWave = 'square',
    customWaveOptions: WaveformOptions = {}
  ) {
    if (this.#am_lfo === null) {
      this.#am_lfo = new LFO(this.context);
      this.#am_lfo.setWaveform(waveform, customWaveOptions);
      this.#am_lfo.setDepth(depth);
      this.#am_lfo.setMusicalNote(this.#activeMidiNote ?? 60);

      if (this.#am_gain) {
        this.#am_lfo.connect(this.#am_gain.gain);
      } else {
        console.error('Missing gain node for AM-LFO in SampleVoice');
        throw new Error('Missing gain node for AM-LFO in SampleVoice');
      }
    } else {
      console.debug('setupAmpModLFO: LFO already setup: ', this.#am_lfo);
    }
    return this;
  }

  /** Cleanup amplitude modulation LFO */
  #cleanupAmpModLFO() {
    if (!this.#am_lfo) return;
    this.#am_lfo.dispose();
    this.#am_lfo = null;
    return this;
  }

  setModulationAmount(modType: 'AM' | 'FM', amount: number) {
    const safeAmount = clamp(amount, 0, 1, {
      warn: true,
      name: 'sampleVoice.setModulationAmount',
    });

    if (modType === 'AM') {
      if (!this.#am_lfo) this.#setupAmpModLFO(safeAmount);
      this.#am_lfo?.setDepth(safeAmount);
    } else if (modType === 'FM') {
      console.info('SampleVoice: FM modulation not implemented yet');
    }
    return this;
  }

  setModulationWaveform(
    modType: 'AM' | 'FM' = 'AM',
    waveform: CustomLibWaveform | OscillatorType | PeriodicWave = 'triangle',
    customWaveOptions: WaveformOptions = {}
  ) {
    if (modType === 'AM') {
      if (!this.#am_lfo) this.#setupAmpModLFO();
      this.#am_lfo?.setWaveform(waveform, customWaveOptions);
    } else if (modType === 'FM') {
      console.info('SampleVoice: FM modulation not implemented yet');
    }
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

  disablePitch = () => {
    this.#pitchDisabled = true;

    // if (this.isPlaying()) {
    this.getParam('playbackRate')?.linearRampToValueAtTime(
      1,
      this.context.currentTime + 0.01
    );
  };
  enablePitch = () => {
    this.#pitchDisabled = false;

    if (this.#activeMidiNote) {
      const rate = midiToPlaybackRate(this.#activeMidiNote);
      this.getParam('playbackRate')?.linearRampToValueAtTime(
        rate,
        this.context.currentTime + 0.01
      );
    }
  };

  /** CONNECTIONS */

  connect(
    destination: Destination,
    output?: number,
    input?: number
  ): Destination {
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
        [
          `${envType}:trigger`,
          `${envType}:release`,
          `${envType}:trigger:loop`,
          `${envType}:created`,
        ],
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

          this.sendUpstreamMessage('voice:initialized', {
            voice: this,
            voiceId: this.nodeId,
          });
          break;

        case 'voice:loaded':
          this.#activeMidiNote = null;

          if (data.durationSeconds) {
            this.#sampleDurationSeconds = data.durationSeconds;

            this.#createEnvelopes();

            this.setStartPoint(0);
            this.setEndPoint(data.durationSeconds);

            // ? Why is this necessary ?
            // Initialize loopEnd to 0 to force the macro parameter to update
            // This ensures the macro's value will be applied when connected
            this.setParam('loopStart', 0, this.now);
            this.setParam('loopEnd', 0, this.now);
          }
          this.#state = VoiceState.LOADED;

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
          break;

        case 'voice:looped':
          break;

        case 'voice:playbackDirectionChange':
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

  get isActive() {
    return this.#activeMidiNote !== null;
  }

  get feedback() {
    return this.#feedback;
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

  setPlaybackDirection(direction: 'forward' | 'reverse'): this {
    this.sendToProcessor({
      type: 'voice:setPlaybackDirection',
      playbackDirection: direction,
    });

    return this;
  }

  setLoopDurationDriftAmount(amount: number): this {
    if (amount === 0) {
      this.setParam('loopDurationDriftAmount', 0, this.now);
      return this;
    }

    const NEAR_ZERO_FOR_LOG = 0.0001;
    const MAX_LOOP_DRIFT = 1; // todo: use audio param's maxValue

    const interpolated = interpolateLinearToExp(amount, {
      inputRange: { min: 0, max: 1 },
      outputRange: {
        min: NEAR_ZERO_FOR_LOG,
        max: MAX_LOOP_DRIFT,
      },
      blend: 1, // blend: 0.5 = 50% exponential, 50% linear
      logBase: 'dB',
      curve: 'linear',
    });
    this.setParam('loopDurationDriftAmount', interpolated, this.now);
    return this;
  }

  setPanDriftEnabled = (enabled: boolean) =>
    this.sendToProcessor({ type: 'setPanDriftEnabled', value: enabled });

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
    this.#cleanupAmpModLFO();
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
