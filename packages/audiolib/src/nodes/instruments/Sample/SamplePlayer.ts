// SamplePlayer.ts - Refactored with Composition Pattern

import { getAudioContext } from '@/context';
import { MidiController } from '@/io';
import { Message, MessageHandler } from '@/events';
import { detectSinglePitchAC } from '@/utils/audiodata/pitchDetection';
import { clamp, findClosestNote, mapToRange, NOTE_PERIODS } from '@/utils';
import { Debouncer } from '@/utils/Debouncer';

import {
  preProcessAudioBuffer,
  PreProcessOptions,
  PreProcessResults,
} from '@/nodes/preprocessor/Preprocessor';

import { assert, tryCatch, isValidAudioBuffer, isMidiValue } from '@/utils';

import {
  MacroParam,
  LibParamDescriptor,
  DEFAULT_PARAM_DESCRIPTORS,
  NormalizeOptions,
} from '@/nodes/params';

import { LFO } from '@/nodes/params/LFOs/LFO';
import {
  createInstrumentBus,
  type InstrumentBus,
} from '@/nodes/master/createInstrumentBus';
import { BusNodeName } from '@/nodes/master/InstrumentBus';
import { SampleVoicePool } from './SampleVoicePool';
import { CustomEnvelope } from '@/nodes/params';
import { EnvelopeType, EnvelopeData } from '@/nodes/params/envelopes';
import { localStore } from '@/storage/local';
import { ILibInstrumentNode, ILibAudioNode } from '@/nodes/LibAudioNode';
import { registerNode, unregisterNode, NodeID } from '@/nodes/node-store';
import { createMessageBus, MessageBus } from '@/events';
import {
  CustomLibWaveform,
  WaveformOptions,
} from '@/utils/audiodata/generate/generateWaveform';

export class SamplePlayer implements ILibInstrumentNode {
  public readonly nodeId: NodeID;
  readonly nodeType = 'sample-player' as const;
  readonly context: AudioContext;
  #messages: MessageBus<Message>;
  #debouncer = new Debouncer();
  #debounceMs = 100;

  #initialized = false;
  #initPromise: Promise<void> | null = null;
  #isLoaded = false;
  #polyphony: number;
  #initialAudioBuffer: AudioBuffer | null = null;
  #midiController: MidiController | null = null;

  #connections = new Set<NodeID>();
  #incoming = new Set<NodeID>();

  #audiobuffer: AudioBuffer | null = null;
  #bufferDuration: number = 0;

  #loopEnabled = false;
  #loopLocked = false;
  #holdEnabled = false;
  #holdLocked = false;

  #masterOut!: GainNode; // todo: fix use of '!'

  #macroLoopStart!: MacroParam; // todo: fix use of '!'
  #macroLoopEnd!: MacroParam; // todo: fix use of '!'
  #gainLFO: LFO | null = null;
  #pitchLFO: LFO | null = null;

  #syncGainLFOToMidiNote = false;
  #syncPitchLFOToMidiNote = false;

  #zeroCrossings: number[] = [];
  #useZeroCrossings = true;
  #preprocessAudio = true;
  randomizeVelocity = false;

  voicePool!: SampleVoicePool; // todo: fix use of '!'
  outBus!: InstrumentBus; // todo: fix use of '!'

  constructor(
    context: AudioContext,
    polyphony: number = 16,
    audioBuffer?: AudioBuffer,
    midiController?: MidiController
  ) {
    this.nodeId = registerNode('sample-player', this);
    this.context = context;

    // Synchronus setup
    this.#messages = createMessageBus<Message>(this.nodeId);
    this.#midiController = midiController || null;

    // Store configuration for async init
    this.#polyphony = polyphony;
    this.#initialAudioBuffer = audioBuffer || null;
  }

  async init(): Promise<void> {
    if (this.#initialized) return; // todo: remove #initialized flag if redundant (since now using initPromise)
    if (this.#initPromise) return this.#initPromise;

    this.#initPromise = (async () => {
      try {
        // Initialize child components first
        this.#masterOut = new GainNode(this.context, { gain: 0.5 });

        this.outBus = await createInstrumentBus(this.context); // WIP

        // Initialize voice pool
        this.voicePool = new SampleVoicePool(this.context, this.#polyphony);
        await this.voicePool.init();

        // Setup macro parameters
        this.#macroLoopStart = new MacroParam(
          this.context,
          DEFAULT_PARAM_DESCRIPTORS.LOOP_START
        );
        // todo: await this.#macroLoopStart.init();

        this.#macroLoopEnd = new MacroParam(
          this.context,
          DEFAULT_PARAM_DESCRIPTORS.LOOP_END
        );
        // todo: await this.#macroLoopEnd.init();

        this.#resetMacros();

        // Connect audio chain
        this.#connectAudioChain();
        this.#connectVoicesToMacros();
        this.#setupLFOs();
        this.#setupMessageHandling();

        // Load initial sample if provided
        if (this.#initialAudioBuffer) {
          await this.loadSample(this.#initialAudioBuffer);
        }

        this.#initialized = true;
      } catch (error) {
        // Cleanup any partial initialization
        this.voicePool?.dispose();
        this.#macroLoopStart?.dispose();
        this.#macroLoopEnd?.dispose();

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to initialize SamplePlayer: ${errorMessage}`);
      }
    })();
    return this.#initPromise;
  }

  #connectAudioChain() {
    this.voicePool.connect(this.outBus.input);
    this.outBus.connect(this.#masterOut);
    this.#masterOut.connect(this.context.destination);
  }

  // === MESSAGING ===

  public onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  public sendUpstreamMessage(type: string, data: any): this {
    this.#messages.sendMessage(type, data);
    return this;
  }

  // === CONNECTIONS ===

  public connect(destination: ILibInstrumentNode | AudioNode): void {
    const target =
      'input' in destination && destination.input
        ? destination.input
        : destination;

    this.#masterOut.connect(target as AudioNode);

    // Track the connection by NodeID if possible
    if ('nodeId' in destination) {
      this.#connections.add(destination.nodeId);
      (destination as any).addIncoming?.(this.nodeId);
    }
  }

  public disconnect(destination?: ILibInstrumentNode | AudioNode): void {
    if (destination) {
      const target = 'input' in destination ? destination.input : destination;
      this.#masterOut.disconnect(target as AudioNode);
      if ('nodeId' in destination) {
        this.#connections.delete(destination.nodeId);
        (destination as any).removeIncoming?.(this.nodeId);
      }
    } else {
      // Disconnect all
      this.#masterOut.disconnect();
      this.#connections.clear();
    }
  }

  addIncoming(source: ILibInstrumentNode): void {
    this.#incoming.add(source.nodeId);
  }

  removeIncoming(source: ILibInstrumentNode): void {
    this.#incoming.delete(source.nodeId);
  }

  get connections() {
    return {
      outgoing: Array.from(this.#connections),
      incoming: Array.from(this.#incoming),
    };
  }

  // === PARAMS ===

  setParam(name: string, value: number, timestamp = this.now): void {
    // Delegate to existing parameter methods
    this.setParameterValue(name, value);
  }

  getParam(name: string): AudioParam | null {
    switch (name) {
      case 'loopStart':
        return this.#macroLoopStart.audioParam;
      case 'loopEnd':
        return this.#macroLoopEnd.audioParam;
      default:
        console.warn(`Parameter '${name}' not found on SamplePlayer`);
        return null;
    }
  }

  // === CONVENIENCE GETTERS ===

  get audioNode() {
    return this.#masterOut;
  }

  get input() {
    return this.outBus.input;
  }

  get output() {
    return this.#masterOut;
  }

  get now(): number {
    return this.context.currentTime;
  }

  get initialized() {
    return this.#initialized;
  }

  /**
   * Helper method to store parameter values in local storage
   */
  protected storeParamValue(
    paramId: string,
    value: any,
    delay = this.#debounceMs
  ): void {
    this.#debouncer.debounce(
      () => localStore.saveValue(this.getLocalStorageKey(paramId), value),
      delay,
      paramId
    )();
  }

  /**
   * Helper method to retrieve parameter values from local storage
   */
  getStoredParamValue<T extends number | string>(
    paramId: string,
    defaultValue: T
  ): T {
    const key = this.getLocalStorageKey(paramId);
    return localStore.getValue(key, defaultValue);
  }

  /**
   * Creates a consistent local storage key for parameters
   */
  protected getLocalStorageKey(paramName: string): string {
    return `${paramName}-${this.nodeId}`;
  }

  /* === MESSAGES === */

  #setupMessageHandling(): this {
    this.voicePool.onMessage('sample:loaded', (msg: Message) => {
      this.#isLoaded = true;
    });

    this.voicePool.onMessage('voice-pool:initialized', () => {
      this.sendUpstreamMessage('sample-player:initialized', {});
    });

    // Forward voice pool messages upstream
    this.#messages.forwardFrom(this.voicePool, [
      'voice-pool:initialized',
      'voice:started',
      'voice:stopped',
      'voice:releasing',
      'sample:loaded',

      'amp-env:created',
      'amp-env:trigger',
      'amp-env:trigger:loop',
      'amp-env:release',

      'pitch-env:created',
      'pitch-env:trigger',
      'pitch-env:trigger:loop',
      'pitch-env:release',

      'filter-env:created',
      'filter-env:trigger',
      'filter-env:trigger:loop',
      'filter-env:release',
    ]);
    return this;
  }

  /* === MACROS === */

  getMacrosAudioParam(paramName: 'loopStart' | 'loopEnd') {
    switch (paramName) {
      case 'loopStart':
        return this.#macroLoopStart.audioParam;
      case 'loopEnd':
        return this.#macroLoopEnd.audioParam;
      default:
        const unreachable: never = paramName;
        throw new Error(`Unknown macro parameter: ${unreachable}`);
    }
  }

  getMacro(paramName: 'loopStart' | 'loopEnd') {
    switch (paramName) {
      case 'loopStart':
        return this.#macroLoopStart;
      case 'loopEnd':
        return this.#macroLoopEnd;
      default:
        const unreachable: never = paramName;
        throw new Error(`Unknown macro parameter: ${unreachable}`);
    }
  }

  #connectVoicesToMacros(): this {
    const voices = this.voicePool.allVoices;

    voices.forEach((voice, index) => {
      const loopStartParam = voice.getParam('loopStart');
      const loopEndParam = voice.getParam('loopEnd');

      if (loopStartParam) {
        this.#macroLoopStart.addTarget(loopStartParam, 'loopStart');
      } else {
        console.error('loopStart param is null!');
      }

      if (loopEndParam) {
        this.#macroLoopEnd.addTarget(loopEndParam, 'loopEnd');
      } else {
        console.error('loopEnd param is null!');
      }
    });

    return this;
  }

  #resetMacros() {
    this.#macroLoopStart.setValue(0);
    this.storeParamValue('loopStart', 0);

    this.#macroLoopEnd.setValue(this.#bufferDuration);
    this.storeParamValue('loopEnd', this.#bufferDuration);

    return this;
  }

  /* === LFOs === */

  setModulationAmount = (modType: 'AM' | 'FM', amount: number) =>
    this.voicePool.applyToAllVoices((v) =>
      v.setModulationAmount(modType, amount)
    );

  setModulationWaveform(
    modType: 'AM' | 'FM' = 'AM',
    waveform: CustomLibWaveform | OscillatorType | PeriodicWave = 'triangle',
    customWaveOptions: WaveformOptions = {}
  ) {
    this.voicePool.applyToAllVoices((v) =>
      v.setModulationWaveform(modType, waveform, customWaveOptions)
    );
  }

  syncLFOsToNoteFreq(lfoId: 'gain-lfo' | 'pitch-lfo', enabled: boolean) {
    if (lfoId === 'gain-lfo') {
      if (enabled === true) {
        this.#gainLFO?.storeCurrentValues();
      } else {
        const storedVals = this.#gainLFO?.getStoredValues();
        storedVals && this.#gainLFO?.setFrequency(storedVals.rate);
      }

      this.#syncGainLFOToMidiNote = enabled;
    }
    if (lfoId === 'pitch-lfo') {
      if (enabled === true) {
        this.#pitchLFO?.storeCurrentValues();
      } else {
        const storedVals = this.#pitchLFO?.getStoredValues();
        storedVals && this.#pitchLFO?.setFrequency(storedVals.rate);
      }

      this.#syncPitchLFOToMidiNote = enabled;
    }
  }

  #setupLFOs() {
    this.#gainLFO = new LFO(this.context);
    this.#gainLFO.setWaveform('sine');

    this.#pitchLFO = new LFO(this.context);
    const wobbleWave = this.#pitchLFO.getPitchWobbleWaveform();
    this.#pitchLFO.setWaveform(wobbleWave);

    // Connections
    this.#connectLFOToAllVoices(this.#pitchLFO, 'playbackRate');
    this.#gainLFO.connect(this.outBus.input.gain);
    // this.#connectLFOToAllVoices(this.#gainLFO, 'playbackPosition');
  }

  #connectLFOToAllVoices(lfo: LFO, paramName: string) {
    this.voicePool.applyToAllVoices((voice) => {
      const param = voice.getParam(paramName);
      if (param) lfo.connect(param);
    });
  }

  /* === LOAD / RESET === */

  async loadSample(
    buffer: AudioBuffer | ArrayBuffer,
    modSampleRate?: number,
    preprocessOptions?: Partial<PreProcessOptions>
  ): Promise<AudioBuffer | null> {
    if (buffer instanceof ArrayBuffer) {
      const ctx = getAudioContext();
      buffer = await ctx.decodeAudioData(buffer);
    }

    if (!isValidAudioBuffer(buffer)) {
      return null;
    }

    if (
      buffer.sampleRate !== this.context.sampleRate ||
      (modSampleRate && this.context.sampleRate !== modSampleRate)
    ) {
      console.warn(
        `sample rate mismatch, 
        buffer rate: ${buffer.sampleRate}, 
        context rate: ${this.context.sampleRate}
        requested rate: ${modSampleRate}`
      );
    }

    this.releaseAll(0);
    this.voicePool.transposeSemitones = 0;
    this.#isLoaded = false;
    this.#audiobuffer = null;

    let processed: PreProcessResults | undefined;

    if (this.#preprocessAudio) {
      processed = await preProcessAudioBuffer(
        this.context,
        buffer,
        preprocessOptions
      );
      buffer = processed.audiobuffer;

      if (this.#useZeroCrossings && processed.zeroCrossings) {
        this.#zeroCrossings = processed.zeroCrossings;
      }
    }

    this.#audiobuffer = buffer;
    this.#bufferDuration = buffer.duration;

    this.voicePool.setBuffer(buffer, this.#zeroCrossings);
    this.#resetMacros();

    const defaultScaleOptions = {
      rootNote: 'C',
      scale: [0],
      lowestOctave: 0,
      highestOctave: 5,
      tuningOffset: 0,
      normalize: false as NormalizeOptions | false,
    };

    this.setScale(defaultScaleOptions);

    return buffer;
  }

  setTransposition = (semitones: number) => {
    this.voicePool.transposeSemitones = semitones;
    console.info(`transposing by ${semitones} semitones`);
    this.sendUpstreamMessage('sample:auto-transpose:success', {
      transposedBy: semitones,
    });
  };

  async detectPitch(buffer: AudioBuffer) {
    const pitchSource = await detectSinglePitchAC(buffer);
    const targetNoteInfo = findClosestNote(pitchSource.frequency);
    const midiFloat = 69 + 12 * Math.log2(pitchSource.frequency / 440);
    const playbackRateMultiplier =
      targetNoteInfo.frequency / pitchSource.frequency;

    console.table({
      pitchSource,
      targetNoteInfo,
      playbackRateMultiplier,
      midiFloat,
    });

    this.sendUpstreamMessage('sample:pitch-detected', {
      pitchResults: pitchSource,
      closestNoteInfo: targetNoteInfo,
    });

    return {
      frequency: pitchSource.frequency,
      confidence: pitchSource.confidence,
      midiFloat,
      targetNoteInfo,
    };
  }

  detectedPitchToTransposition(
    detectedMidiFloat: number,
    targetMidiNote: number
  ) {
    let transposeSemitones = targetMidiNote - detectedMidiFloat;
    // Wrap to nearest octave (-6 to +6 semitones)
    while (transposeSemitones > 6) transposeSemitones -= 12;
    while (transposeSemitones < -6) transposeSemitones += 12;
    return transposeSemitones;
  }

  /* === PLAYBACK === */

  play(
    midiNote: MidiValue,
    velocity: MidiValue = 100,
    glideTime = this.getGlideTime()
  ): MidiValue | null {
    const safeVelocity = isMidiValue(velocity) ? velocity : 100;

    this.#syncGainLFOToMidiNote && this.#gainLFO?.setMusicalNote(midiNote);
    this.#syncPitchLFOToMidiNote &&
      this.#pitchLFO?.setMusicalNote(midiNote, { divisor: 4 });

    this.outBus.noteOn(midiNote, safeVelocity, 0, glideTime);

    return this.voicePool.noteOn(
      midiNote,
      safeVelocity,
      0, // zero delay
      glideTime,
      this.#macroLoopEnd.getValue()
    );
  }

  release(midiNote: MidiValue): this {
    if (this.holdEnabled || this.#holdLocked) return this;

    this.voicePool.noteOff(midiNote);
    this.sendUpstreamMessage('note:off', { midiNote });
    return this;
  }

  releaseAll(releaseTime?: number): this {
    this.voicePool.allNotesOff(releaseTime);
    return this;
  }

  // Common functionality for all instruments
  panic = (releaseTime?: number) => this.releaseAll(releaseTime);

  /* === SCALE SETTINGS === */

  setScale(options: {
    rootNote: string;
    scale: number[];
    tuningOffset: number;
    highestOctave: number;
    lowestOctave: number;
    normalize: NormalizeOptions | false;
  }) {
    this.#macroLoopStart.setScale({
      snapToZeroCrossings: this.#zeroCrossings,
      ...options,
    });
    this.#macroLoopEnd.setScale({
      snapToZeroCrossings: this.#zeroCrossings,
      ...options,
    });
    return this;
  }

  /** PARAM SETTERS  */

  setSampleStartPoint(seconds: number): this {
    this.voicePool.applyToAllVoices((voice) => voice.setStartPoint(seconds));

    this.storeParamValue('startPoint', seconds);

    this.sendUpstreamMessage('start-point:updated', {
      startPoint: seconds,
    });
    return this;
  }

  setSampleEndPoint(seconds: number): this {
    this.voicePool.applyToAllVoices((voice) => voice.setEndPoint(seconds));

    this.storeParamValue('endPoint', seconds);

    this.sendUpstreamMessage('end-point:updated', {
      endPoint: seconds,
    });
    return this;
  }

  setLoopRampDuration(seconds: number): this {
    this.storeParamValue('loopRampDuration', seconds);
    return this;
  }

  setGlideTime(seconds: number): this {
    this.storeParamValue('glideTime', seconds);

    return this;
  }

  setLoopEnabled(enabled: boolean): this {
    if (this.#loopEnabled === enabled) return this;

    // if loop is locked (ON), turning it off is disabled but turning it on should work
    if (this.#loopLocked && !enabled) return this;

    const voices = this.voicePool.allVoices;
    voices.forEach((v) => v.setLoopEnabled(enabled));
    this.#loopEnabled = enabled;

    this.sendUpstreamMessage('loop:enabled', { enabled });
    return this;
  }

  setLoopLocked(locked: boolean): this {
    if (this.#loopLocked === locked) return this;

    this.#loopLocked = locked;
    this.setLoopEnabled(locked);

    this.storeParamValue('loopLocked', locked);
    this.sendUpstreamMessage('loop:locked', { locked });
    return this;
  }

  setHoldEnabled(enabled: boolean) {
    if (this.#holdEnabled === enabled) return this;
    if (this.#holdLocked && !enabled) return this;

    this.#holdEnabled = enabled;
    if (!enabled) this.releaseAll(this.getReleaseTime());
    this.sendUpstreamMessage('hold:enabled', { enabled });
    return this;
  }

  setHoldLocked(locked: boolean): this {
    if (this.#holdLocked === locked) return this;

    this.#holdLocked = locked;
    if (locked === false) this.releaseAll();

    this.storeParamValue('holdLocked', locked);
    this.sendUpstreamMessage('hold:locked', { locked });
    return this;
  }

  setPlaybackDirection(direction: 'forward' | 'reverse'): this {
    this.voicePool.applyToAllVoices((voice) =>
      voice.setPlaybackDirection(direction)
    );

    this.storeParamValue('playbackDirection', direction);
    return this;
  }

  setLoopDurationDriftAmount(amount: number): this {
    this.voicePool.applyToAllVoices((voice) =>
      voice.setLoopDurationDriftAmount(amount)
    );

    this.storeParamValue('loopDurationDrift', amount);
    return this;
  }

  setPanDriftEnabled = (enabled: boolean) => {
    this.voicePool.applyToAllVoices((voice) =>
      voice.setPanDriftEnabled(enabled)
    );

    this.storeParamValue('panDriftEnabled', enabled);
    return this;
  };

  isNormalized = (value: number, range = [0, 1]) =>
    value >= range[0] && value <= range[1];

  readonly MIN_LOOP_DURATION_SECONDS = 1 / 523.25; // C5 = 523.25 Hz, C6 = 1046.502

  setLoopStart = (
    seconds: number,
    rampTime: number = this.getLoopRampDuration()
  ) => {
    return this.setLoopPoint('start', seconds, this.loopEnd, rampTime);
  };

  setLoopEnd = (
    seconds: number,
    rampTime: number = this.getLoopRampDuration()
  ) => {
    return this.setLoopPoint('end', this.loopStart, seconds, rampTime);
  };

  setLoopDuration = (
    seconds: number,
    rampTime: number = this.getLoopRampDuration()
  ) =>
    this.setLoopPoint(
      'end',
      this.loopStart,
      this.loopStart + seconds,
      rampTime
    );

  debugcounter = 0;

  setLoopPoint(
    loopPoint: 'start' | 'end',
    loopStartSeconds: number,
    loopEndSeconds: number,
    rampDuration: number = this.getLoopRampDuration()
  ) {
    let loopStart = clamp(
      loopStartSeconds,
      0 + this.MIN_LOOP_DURATION_SECONDS / 2,
      loopEndSeconds
    );

    if (loopPoint === 'start' && loopStart === this.loopStart) return this;

    let loopEnd = clamp(
      loopEndSeconds,
      loopStart,
      this.#bufferDuration - this.MIN_LOOP_DURATION_SECONDS / 2
    );

    if (loopPoint === 'end' && loopEnd === this.loopEnd) return this;

    const targetLoopDuration = loopEnd - loopStart;
    const RAMP_SENSITIVITY = 1;
    const scaledRampTime = rampDuration * RAMP_SENSITIVITY;

    if (loopPoint === 'start' && loopStart !== this.loopStart) {
      const storeLoopStart = () => this.storeParamValue('loopStart', loopStart);

      if (targetLoopDuration < this.MIN_LOOP_DURATION_SECONDS) {
        loopStart = loopEnd - this.MIN_LOOP_DURATION_SECONDS;
      }

      this.#macroLoopStart.ramp(loopStart, scaledRampTime, loopEnd, {
        onComplete: () => {
          storeLoopStart();
        },
      });
    } else if (loopPoint === 'end' && loopEnd !== this.loopEnd) {
      const storeLoopEnd = () => this.storeParamValue('loopEnd', loopEnd);

      if (targetLoopDuration < this.MIN_LOOP_DURATION_SECONDS) {
        loopEnd = loopStart + this.MIN_LOOP_DURATION_SECONDS;
      }

      this.#macroLoopEnd.ramp(loopEnd, scaledRampTime, loopStart, {
        onComplete: () => {
          storeLoopEnd();
        },
      });
    }

    this.sendUpstreamMessage('loop-points:updated', { loopStart, loopEnd });

    return this;
  }

  scrollLoopPoints(loopStart: number, loopEnd: number) {
    const timestamp = this.context.currentTime;
    this.#macroLoopStart.setValue(loopStart, timestamp);
    this.#macroLoopEnd.setValue(loopEnd, timestamp);

    this.storeParamValue('loopStart', loopStart);
    this.storeParamValue('loopEnd', loopEnd);

    return this;
  }

  setParameterValue(name: string, value: number): this {
    switch (name) {
      case 'startPoint':
        this.setSampleStartPoint(value);
        break;
      case 'endPoint':
        this.setSampleEndPoint(value);
        break;
      case 'glideTime':
        this.setGlideTime(value);
        break;
      case 'loopStart':
        this.setLoopStart(value);
        break;
      case 'loopEnd':
        this.setLoopEnd(value);
        break;
      case 'loopRampDuration':
        this.setLoopRampDuration(value);
        break;
      default:
        console.warn(`Unknown parameter: ${name}`);
    }
    return this;
  }

  /** PARAM GETTERS  */

  getAttackTime(): number {
    return this.getStoredParamValue(
      'attack',
      DEFAULT_PARAM_DESCRIPTORS.ATTACK.defaultValue
    );
  }

  getReleaseTime(): number {
    return this.getStoredParamValue(
      'release',
      DEFAULT_PARAM_DESCRIPTORS.RELEASE.defaultValue
    );
  }

  getStartPoint(): number {
    return this.getStoredParamValue(
      'startPoint',
      DEFAULT_PARAM_DESCRIPTORS.START_POINT.defaultValue
    );
  }

  getEndPoint(): number {
    return this.getStoredParamValue(
      'endPoint',
      DEFAULT_PARAM_DESCRIPTORS.END_POINT.defaultValue
    );
  }

  getLoopRampDuration(): number {
    return this.getStoredParamValue(
      'loopRampDuration',
      DEFAULT_PARAM_DESCRIPTORS.LOOP_RAMP_DURATION.defaultValue
    );
  }

  getGlideTime(): number {
    return this.getStoredParamValue('glideTime', 0);
  }

  getHpfCutoff = () => this.getStoredParamValue('hpfCutoff', NaN);
  getLpfCutoff = () => this.getStoredParamValue('lpfCutoff', NaN);

  // for UI integration
  getParameterDescriptors(): Record<string, LibParamDescriptor> {
    return {
      attack: DEFAULT_PARAM_DESCRIPTORS.ATTACK,
      release: DEFAULT_PARAM_DESCRIPTORS.RELEASE,
      startPoint: DEFAULT_PARAM_DESCRIPTORS.START_POINT,
      endPoint: DEFAULT_PARAM_DESCRIPTORS.END_POINT,
      playbackRate: DEFAULT_PARAM_DESCRIPTORS.PLAYBACK_RATE,
      loopStart: this.#macroLoopStart.descriptor,
      loopEnd: this.#macroLoopEnd.descriptor,
      loopRampDuration: DEFAULT_PARAM_DESCRIPTORS.LOOP_RAMP_DURATION,
      hpfCutoff: DEFAULT_PARAM_DESCRIPTORS.HIGHPASS_CUTOFF,
      lpfCutoff: DEFAULT_PARAM_DESCRIPTORS.LOWPASS_CUTOFF,
    };
  }

  getParameterValue(name: string): number | undefined {
    switch (name) {
      case 'loopStart':
        return this.loopStart;
      case 'loopEnd':
        return this.loopEnd;
      case 'loopRampDuration':
        return this.getLoopRampDuration();
      case 'attack':
        return this.getAttackTime();
      case 'release':
        return this.getReleaseTime();
      case 'startPoint':
        return this.getStartPoint();
      case 'endPoint':
        return this.getEndPoint();
      case 'glideTime':
        return this.getGlideTime();
      case 'hpfCutoff':
        return this.getHpfCutoff();
      case 'lpfCutoff':
        return this.getLpfCutoff();
      default:
        console.warn(`Unknown parameter: ${name}`);
        return undefined;
    }
  }

  /* === PITCH === */

  enablePitch = () => this.voicePool.allVoices.forEach((v) => v.enablePitch());
  disablePitch = () =>
    this.voicePool.allVoices.forEach((v) => v.disablePitch());

  /* === ENVELOPES === */

  enableEnvelope = (envType: EnvelopeType) => {
    this.voicePool.applyToAllVoices((voice) => voice.enableEnvelope(envType));
  };

  disableEnvelope = (envType: EnvelopeType) => {
    this.voicePool.applyToAllVoices((voice) => voice.disableEnvelope(envType));
  };

  getEnvelope(envType: EnvelopeType): CustomEnvelope {
    const firstVoice = this.voicePool.allVoices[0];
    if (!firstVoice) throw new Error('No voices available in voice pool');

    const envelope = firstVoice.getEnvelope(envType);
    if (!envelope) throw new Error(`Envelope type '${envType}' not found`);

    return envelope;
  }

  setEnvelopeLoop = (
    envType: EnvelopeType,
    loop: boolean,
    mode: 'normal' | 'ping-pong' | 'reverse' = 'normal'
  ) => {
    this.voicePool.applyToAllVoices((v) =>
      v.setEnvelopeLoop(envType, loop, mode)
    );
  };

  setEnvelopeSync = (envType: EnvelopeType, sync: boolean) => {
    this.voicePool.applyToAllVoices((v) =>
      v.syncEnvelopeToPlaybackRate(envType, sync)
    );
  };

  setEnvelopeTimeScale = (envType: EnvelopeType, timeScale: number) => {
    this.voicePool.applyToAllVoices((v) =>
      v.setEnvelopeTimeScale(envType, timeScale)
    );
  };

  setEnvelopeSustainPoint(envType: EnvelopeType, index: number | null) {
    this.voicePool.applyToAllVoices((v) =>
      v.setEnvelopeSustainPoint(envType, index)
    );
  }

  setEnvelopeReleasePoint(envType: EnvelopeType, index: number) {
    this.voicePool.applyToAllVoices((v) =>
      v.setEnvelopeReleasePoint(envType, index)
    );
  }

  updateEnvelopePoint(
    envType: EnvelopeType,
    index: number,
    time: number,
    value: number
  ): void {
    this.voicePool.applyToAllVoices((v) =>
      v.updateEnvelopePoint(envType, index, time, value)
    );
  }

  addEnvelopePoint(envType: EnvelopeType, time: number, value: number): void {
    this.voicePool.applyToAllVoices((v) =>
      v.addEnvelopePoint(envType, time, value)
    );
  }

  deleteEnvelopePoint(envType: EnvelopeType, index: number): void {
    this.voicePool.applyToAllVoices((v) =>
      v.deleteEnvelopePoint(envType, index)
    );
  }

  startLevelMonitoring(intervalMs?: number) {
    this.outBus.startLevelMonitoring(intervalMs);
  }

  /* === FX === */

  setDryWetMix = (mix: { dry: number; wet: number }) => {
    this.outBus.setDryWetMix(mix);
  };

  sendToFx = (effect: BusNodeName, amount: number) => {
    this.outBus.setSendAmount(effect, amount);
  };

  setLpfCutoff = (hz: number) => this.outBus.setLpfCutoff(hz);
  setHpfCutoff = (hz: number) => this.outBus.setHpfCutoff(hz);

  setReverbAmount = (amount: number) => {
    this.outBus.setReverbAmount(amount);
  };

  setFeedbackDecay(value: number) {
    this.outBus.setFeedbackDecay(value);

    // Useable range for polyphonic feedback is smaller, mapping:
    const reducedForPoly = mapToRange(value, 0, 1, 0, 0.75);
    this.voicePool.applyToAllVoices((voice) => {
      voice.feedback?.setDecay(reducedForPoly);
    });
  }

  // === FEEDBACK ===

  setFeedbackAmount = (amount: number) => {
    if (
      this.#feedbackMode === 'monophonic' ||
      this.#feedbackMode === 'double-trouble'
    ) {
      this.outBus.setFeedbackAmount(amount);
    }

    if (
      this.#feedbackMode === 'polyphonic' ||
      this.#feedbackMode === 'double-trouble'
    ) {
      this.voicePool.applyToAllVoices((voice) => {
        voice.feedback?.setAmountMacro(amount);
      });
    }
  };

  #feedbackMode: 'monophonic' | 'polyphonic' | 'double-trouble' = 'monophonic';

  setFeedbackMode(mode: 'monophonic' | 'polyphonic' | 'double-trouble') {
    this.#feedbackMode = mode;

    if (mode === 'monophonic') {
      let currAmount = this.voicePool.allVoices[0].feedback?.currentAmount ?? 0;
      this.voicePool.applyToAllVoices((voice) => {
        voice.feedback?.setAmountMacro(0);
      });
      this.outBus.setFeedbackAmount(currAmount);
    } else if (mode === 'polyphonic') {
      const monoFx = this.outBus.getFeedback();
      const currAmount = monoFx.currentAmount;

      this.outBus.setFeedbackAmount(0);

      this.voicePool.applyToAllVoices((voice) => {
        voice.feedback?.setAmountMacro(currAmount);
      });
    } else {
      console.info('Feedback mode set to double-trouble, radical!');
    }
  }

  setFeedbackPitchScale(value: number) {
    this.outBus.setFeedbackPitchScale(value);

    this.voicePool.applyToAllVoices((voice) => {
      voice.feedback?.setDelayMultiplier(value);
    });
  }

  /* === I/O === */

  async initMidiController(): Promise<boolean> {
    if (this.#midiController?.isInitialized) {
      return true;
    }

    if (!this.#midiController) {
      this.#midiController = new MidiController();
    }

    assert(
      this.#midiController,
      `SamplePlayer: Failed to create MIDI controller`
    );

    const result = await tryCatch(() => this.#midiController!.initialize());
    assert(!result.error, `SamplePlayer: Failed to initialize MIDI`);
    return result.data;
  }

  setMidiController(midiController: MidiController): this {
    this.#midiController = midiController;
    return this;
  }

  // MIDI input
  async enableMIDI(
    midiController?: MidiController,
    channel: number = 0
  ): Promise<this> {
    if (!midiController) {
      midiController = new MidiController();
      await midiController.initialize();
    }

    if (midiController.isInitialized) {
      this.#midiController = midiController;
      midiController.connectInstrument(this, channel);
    }
    return this;
  }

  disableMIDI(midiController?: MidiController, channel: number = 0): this {
    const controller = midiController || this.#midiController;
    controller?.disconnectInstrument(channel);
    if (controller === this.#midiController) {
      this.#midiController = null;
    }
    return this;
  }

  /* === PUBLIC GETTERS === */

  get mainOut() {
    return this.#masterOut;
  }

  get outputBus() {
    return this.outBus;
  }

  get sampleDuration(): number {
    return this.#bufferDuration;
  }

  get volume(): number {
    return this.#masterOut.gain.value;
  }

  set volume(value: number) {
    this.#masterOut.gain.setValueAtTime(value, this.context.currentTime);
  }

  get loopEnabled(): boolean {
    return this.#loopEnabled;
  }

  get holdEnabled(): boolean {
    return this.#holdEnabled;
  }

  get gainLFO() {
    return this.#gainLFO;
  }

  get pitchLFO() {
    return this.#pitchLFO;
  }

  get loopStart(): number {
    return this.#macroLoopStart.getValue();
  }

  get loopEnd(): number {
    return this.#macroLoopEnd.getValue();
  }

  get isLoaded() {
    return this.#isLoaded;
  }

  get audiobuffer() {
    return this.#audiobuffer;
  }

  /* === CLEANUP === */

  dispose(): void {
    try {
      this.releaseAll();

      if (this.voicePool) {
        this.voicePool.dispose();
        this.voicePool = null as unknown as SampleVoicePool;
      }

      if (this.outBus) {
        this.outBus.dispose();
        this.outBus = null as unknown as InstrumentBus;
      }

      this.#macroLoopStart?.dispose();
      this.#macroLoopEnd?.dispose();
      this.#macroLoopStart = null as unknown as MacroParam;
      this.#macroLoopEnd = null as unknown as MacroParam;

      this.#gainLFO?.dispose();
      this.#pitchLFO?.dispose();

      this.disconnect();
      this.disableMIDI();

      // Reset state variables
      this.#bufferDuration = 0;
      this.#initialized = false;
      this.#isLoaded = false;
      this.#zeroCrossings = [];
      this.#useZeroCrossings = false;
      this.#loopEnabled = false;

      unregisterNode(this.nodeId);
    } catch (error) {
      console.error(`Error disposing Sampler ${this.nodeId}:`, error);
    }
  }
}
