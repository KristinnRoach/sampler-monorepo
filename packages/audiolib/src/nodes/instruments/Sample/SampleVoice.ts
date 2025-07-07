import {
  LibVoiceNode,
  VoiceType,
  Messenger,
  Destination,
  Connectable,
} from '@/nodes/LibNode';
import { getAudioContext } from '@/context';
import { createNodeId, NodeID, deleteNodeId } from '@/nodes/node-store';
import { VoiceState } from '../VoiceState';

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

import { midiToPlaybackRate } from '@/utils';

import {
  createEnvelope,
  type CustomEnvelope,
  type EnvelopeType,
} from '@/nodes/params/envelopes';

export class SampleVoice implements LibVoiceNode, Connectable, Messenger {
  readonly nodeId: NodeID;
  readonly nodeType: VoiceType = 'sample';

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

  #hpf: BiquadFilterNode | null = null;
  #lpf: BiquadFilterNode | null = null;

  #filtersEnabled: boolean;
  #loopEnabled = false;
  #holdEnabled = false;

  #attackSec: number = 0.1; // replaced with envelope (keep for non-env scenarios ?)
  #releaseSec: number = 0.1;

  #hpfHz: number = 100;
  #lpfHz: number = 18000; // updated in constructor
  #lpfQ: number = 1;
  #hpfQ: number = 1;

  constructor(
    private context: AudioContext = getAudioContext(),
    destination: AudioNode,
    options: { processorOptions?: any; enableFilters?: boolean } = {}
  ) {
    this.nodeId = createNodeId(this.nodeType);
    this.#messages = createMessageBus<Message>(this.nodeId);

    this.#worklet = new AudioWorkletNode(context, 'sample-player-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: options.processorOptions || {},
    });

    const ampEnv = createEnvelope(context, 'amp-env');
    this.#envelopes.set('amp-env', ampEnv);

    const pitchEnv = createEnvelope(context, 'pitch-env');
    this.#envelopes.set('pitch-env', pitchEnv);

    this.#filtersEnabled = options.enableFilters ?? true;

    // Create filters if enabled
    if (this.#filtersEnabled) {
      // Set low-pass filter frequency based on context sample rate
      this.#lpfHz = this.context.sampleRate / 2 - 1000;

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

      const filterEnv = createEnvelope(context, 'filter-env', {
        valueRange: [10, this.#lpfHz],
        initEnable: false,
      });
      this.#envelopes.set('filter-env', filterEnv);

      // Connect chain: worklet → hpf → lpf -> destination
      this.#worklet.connect(this.#hpf);
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

    this.#setupMessageHandling();
    this.sendToProcessor({ type: 'voice:init' });

    this.#worklet.port.start();
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

  trigger(options: {
    midiNote: MidiValue;
    velocity: MidiValue;
    secondsFromNow?: number;
    currentLoopEnd?: number;
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

    const playbackRate = midiToPlaybackRate(midiNote);

    // setParams ensures all params executed using exact same timestamp
    this.setParams(
      [
        { name: 'playbackRate', value: playbackRate },
        { name: 'velocity', value: velocity },
        // todo: set all other params (e.g. startPoint & endPoint) via param handlers (not in trigger method)
      ],
      timestamp
    );

    // Apply amp, filter and pitch envelopes if enabled
    this.applyEnvelopes(timestamp, this.#sampleDurationSeconds, playbackRate);

    // Start playback
    this.sendToProcessor({
      type: 'voice:start',
      timestamp,
    });

    // !!! TESTING direct ramping from 1 to current value

    if (this.#loopEnabled && options.currentLoopEnd) {
      const loopEndParam = this.getParam('loopEnd')!;
      const currLoopEnd = loopEndParam.value;
      console.log('currLoopEnd', currLoopEnd); // !! WRONG.. passing currentLoopEnd from SamplePlayer for testing, but still need to figure this out
      console.log('macroLoopEnd: ', options.currentLoopEnd);

      const startVal = Math.min(1, 1 - options.currentLoopEnd * 2);

      console.log('startVal', startVal);
      loopEndParam.cancelScheduledValues(timestamp + 0.001);
      loopEndParam.setValueAtTime(startVal, timestamp + 0.003);
      loopEndParam.exponentialRampToValueAtTime(
        options.currentLoopEnd,
        timestamp + 0.3
      );
    }

    this.sendUpstreamMessage('sample-envelopes:trigger', {
      voiceId: this.nodeId,
      midiNote: this.#activeMidiNote,
      envDurations: {
        'amp-env': this.#envelopes.get('amp-env')?.durationSeconds,
        'pitch-env': this.#envelopes.get('pitch-env')?.durationSeconds,
        'filter-env': this.#envelopes.get('filter-env')?.durationSeconds,
      },
      loopEnabled: {
        'amp-env': this.#envelopes.get('amp-env')?.loopEnabled,
        'pitch-env': this.#envelopes.get('pitch-env')?.loopEnabled,
        'filter-env': this.#envelopes.get('filter-env')?.loopEnabled,
      },
    });

    return this.#activeMidiNote;
  }

  applyEnvelopes(
    timestamp: number,
    durationSeconds: number,
    playbackRate: number
  ) {
    this.#envelopes.forEach((env, envType) => {
      if (!env.isEnabled) return; // ?

      const scaledDuration = this.#sampleDurationSeconds / playbackRate;
      if (envType !== 'filter-env') env.setSampleDuration(durationSeconds);
      else env.setSampleDuration(scaledDuration);

      const param = this.getParam(env.param);
      if (!param) return;

      if (env.hasVariation()) {
        const baseValue = envType === 'pitch-env' ? playbackRate : 1;
        env.applyToAudioParam(param, timestamp, {
          baseValue,
        });
      }
    });
  }

  debugDuration() {
    console.info(`
      sample duration: ${this.sampleDurationSeconds}, 
      startPoint: ${this.getParam('startPoint')!.value}, 
      endPoint: ${this.getParam('endPoint')!.value}, 
      playback duration: ${this.getPlaybackDuration()}
      `);
  }

  #releaseTimeout: number | null = null;

  release({ release = this.#releaseSec, secondsFromNow = 0 }): this {
    if (this.#state === VoiceState.RELEASING) return this;

    const envGain = this.getParam('envGain');
    if (!envGain) throw new Error('Cannot release - envGain parameter is null');

    this.#state = VoiceState.RELEASING;
    const timestamp = this.now + secondsFromNow;

    // Immediate stop for zero release time
    if (release <= 0) return this.stop(timestamp);

    const envGainParam = this.#worklet.parameters.get('envGain');
    if (envGainParam) {
      const currentValue = envGainParam.value;

      this.#envelopes
        .get('amp-env')
        ?.applyReleaseToAudioParam(
          envGainParam,
          timestamp,
          release,
          currentValue
        );
    }
    // todo: release filter-env and pitch-env ?

    this.sendToProcessor({ type: 'voice:release', timestamp });

    // After the release duration, the voice should stop
    if (this.#releaseTimeout) clearTimeout(this.#releaseTimeout);
    this.#releaseTimeout = setTimeout(
      () => {
        try {
          if (this.#state === VoiceState.RELEASING) this.stop();
        } finally {
          this.#releaseTimeout = null;
        }
      },
      release * 1000 + 50
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

  // todo: handle enabled / disabled while looping

  enableEnvelope = (envType: EnvelopeType) => {
    this.#envelopes.get(envType)?.enable();
  };

  disableEnvelope = (envType: EnvelopeType) => {
    this.#envelopes.get(envType)?.disable();
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

  getEnvelope = (envType: EnvelopeType) => {
    return this.#envelopes.get(envType);
  };

  connect(
    destination: Destination,
    output?: number,
    input?: number
  ): Destination {
    if (destination === this.#destination) return this.#destination;

    if (destination instanceof AudioParam) {
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

  setAttack = (attack_sec: number) => {
    this.#attackSec = attack_sec;
    console.info(`setAttack called, to be replaced with envelope`);
  };

  setRelease = (release_sec: number) => {
    this.#releaseSec = release_sec;
    console.info(`setRelease called, to be replaced with envelope`);
  };

  setStartPoint = (time: number, timestamp = this.now) => {
    this.setParam('startPoint', time, timestamp);

    // const playDuration = this.endPoint - time;
    // this.#ampEnv.updateStartPoint(time);
    // this.#pitchEnv.updateStartPoint(time); // filterenv
    // Todo: figure out this system
  };

  setEndPoint = (time: number, timestamp = this.now) => {
    this.setParam('endPoint', time, timestamp);

    // this.#ampEnv.updateEndPoint(time);
    // Todo: figure out this system
  };

  // debugCounter = 0;

  setLoopPoints(
    start: number,
    end: number,
    timestamp = this.now,
    rampTime = 0
  ): this {
    if (start >= end) return this;
    // if (this.loopPointsTimeout) clearTimeout(this.loopPointsTimeout);
    // this.loopPointsTimeout = setTimeout(() => { ... }, 16); // ~60fps debouncing

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

    // if (this.debugCounter % 10 === 0) console.debug('sampleVoice.setLoopPoints, start:', start, 'end:', end);
    // this.debugCounter++;

    return this;
  }

  setAllowedPeriods(periods: number[]): this {
    this.sendToProcessor({
      type: 'setAllowedPeriods',
      allowedPeriods: periods,
    });

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

  #setupMessageHandling() {
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

            this.#envelopes.forEach((env) =>
              env.setSampleDuration(data.durationSeconds)
            );

            this.setStartPoint(0);
            this.setEndPoint(1); // normalized !

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
          this.#loopEnabled = true;
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

  #normalizedToAbsolute(normalizedTime: number): number {
    return normalizedTime * this.#sampleDurationSeconds;
  }

  #absoluteToNormalized(absoluteTime: number): number {
    return absoluteTime / this.#sampleDurationSeconds;
  }
  #clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

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

  // Setters

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

    this.#loopEnabled = enabled;
    this.#envelopes.forEach((env) =>
      this.setEnvelopeLoop(env.envelopeType, enabled, 'normal')
    );

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

  dispose(): void {
    this.stop();
    this.disconnect();
    this.#envelopes.forEach((env) => env.dispose());
    this.#worklet.port.close();
    if (this.#releaseTimeout) clearTimeout(this.#releaseTimeout);
    deleteNodeId(this.nodeId);
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

// addEnvelopePoint(envType: EnvelopeType, time: number, value: number) {
//   this.envelopes.addEnvelopePoint(envType, time, value);
// }

// updateEnvelopePoint(
//   envType: EnvelopeType,
//   index: number,
//   time?: number,
//   value?: number
// ) {
//   this.envelopes.updateEnvelopePoint(envType, index, time, value);
// }

// deleteEnvelopePoint(envType: EnvelopeType, index: number) {
//   this.envelopes.deleteEnvelopePoint(envType, index);
// }

// getEnvelope(envType: EnvelopeType) {
//   return this.envelopes.getEnvelope(envType);
// }

// addEnvelopePoint(envType: EnvelopeType, time: number, value: number) {
//   this.#envelopes.get(envType)?.addPoint(time, value);
// }

// updateEnvelopePoint(
//   envType: EnvelopeType,
//   index: number,
//   time?: number,
//   value?: number
// ) {
//   this.#envelopes.get(envType)?.updatePoint(index, time, value);
// }

// deleteEnvelopePoint(envType: EnvelopeType, index: number) {
//   this.#envelopes.get(envType)?.deletePoint(index);
// }

// getEnvelope(envType: EnvelopeType) {
//   return this.#envelopes.get(envType);
// }

// setEnvelopeLoop = (
//   envType: EnvelopeType,
//   loop: boolean,
//   mode: 'normal' | 'ping-pong' | 'reverse' = 'normal'
// ) => this.getEnvelope(envType)?.setLoopEnabled(loop, mode);

// this.#messages.forwardFrom(
//   this.envelopes,
//   ['sample-envelopes:trigger', 'sample-envelopes:duration'],
//   (msg) => ({
//     ...msg,
//     voiceId: this.nodeId,
//     midiNote: this.#activeMidiNote,
//   })
// );

// #envelopes: Map<EnvelopeType, CustomEnvelope>;

// this.#envelopes = createDefaultEnvelopes(context, ['amp-env', 'pitch-env']);

// this.envelopes.triggerEnvelopes(timestamp, playbackRate);
// this.envelopes.releaseEnvelopes(timestamp, release);
