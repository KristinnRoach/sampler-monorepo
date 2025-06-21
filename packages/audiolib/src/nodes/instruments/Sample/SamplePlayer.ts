import type { MidiValue, ActiveNoteId } from '../types';
import { getAudioContext } from '@/context';
import { MidiController, globalKeyboardInput, PressedModifiers } from '@/io';
import { Message, MessageHandler, MessageBus } from '@/events';
import { detectPitch } from '@/nodes/offlineDSP/simplePitchDetect';
import { findClosestNote } from '@/utils';

import {
  assert,
  tryCatch,
  isValidAudioBuffer,
  isMidiValue,
  findZeroCrossings,
  cancelScheduledParamValues,
} from '@/utils';

import {
  MacroParam,
  LibParamDescriptor,
  DEFAULT_PARAM_DESCRIPTORS,
  createCustomEnvelope,
} from '@/nodes/params';

import { LibInstrument } from '@/nodes/instruments/LibInstrument';
import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';
import { SampleVoicePool } from './SampleVoicePool';
import { CustomEnvelope } from '@/nodes/params';

export class SamplePlayer extends LibInstrument {
  // SamplePlayer-specific fields private with #
  #midiNoteToId: Map<MidiValue, ActiveNoteId> = new Map();
  #bufferDuration: number = 0;
  #loopEnabled = false;
  #loopLocked = false;
  #holdEnabled = false;
  #holdLocked = false;

  #macroLoopStart: MacroParam;
  #macroLoopEnd: MacroParam;
  #loopEndFineTune: number = 0;
  #isReady = false;
  #isLoaded = false;
  #zeroCrossings: number[] = [];
  #useZeroCrossings = true;
  #trackPlaybackPosition = false;
  randomizeVelocity = false;

  voicePool: SampleVoicePool;

  connectAltOut: InstrumentMasterBus['connectAltOut'];
  setAltOutVolume: InstrumentMasterBus['setAltOutVolume'];
  mute: InstrumentMasterBus['mute'];

  constructor(
    context: AudioContext,
    polyphony: number = 16,
    audioBuffer?: AudioBuffer,
    midiController?: MidiController
  ) {
    super('sample-player', context, polyphony, audioBuffer, midiController);

    // ? Load stored values ?

    // Initialize voice pool
    this.voicePool = new SampleVoicePool(
      context,
      polyphony,
      this.outBus.input, // todo: explicit connect (first create generic pool interface)
      true // enable voice filters (lpf and hpf)
    );

    // Setup params
    this.#macroLoopStart = new MacroParam(
      context,
      DEFAULT_PARAM_DESCRIPTORS.LOOP_START
    );
    this.#macroLoopEnd = new MacroParam(
      context,
      DEFAULT_PARAM_DESCRIPTORS.LOOP_END
    );

    this.#connectVoicesToMacros();
    // this.syncEnvelopesToAllVoices();

    // Connect audiochain -- todo after generalizing voice pool

    // Initialize the output bus methods
    this.setAltOutVolume = (...args) => this.outBus.setAltOutVolume(...args);
    this.connectAltOut = (...args) => this.outBus.connectAltOut(...args);
    this.mute = (...args) => this.outBus.mute(...args);

    this.#isReady = true;

    if (audioBuffer?.duration) {
      this.loadSample(audioBuffer, audioBuffer.sampleRate);
    } else {
      this.#isLoaded = false;
    }
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.messages.onMessage(type, handler);
  }

  protected sendUpstreamMessage(type: string, data: any) {
    this.messages.sendMessage(type, data);
    return this;
  }

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

    voices.forEach((voice) => {
      const loopStartParam = voice.getParam('loopStart');
      const loopEndParam = voice.getParam('loopEnd');

      if (loopEndParam) {
        this.#macroLoopEnd.addTarget(loopEndParam, 'loopEnd');
      }
      if (loopStartParam) {
        this.#macroLoopStart.addTarget(loopStartParam, 'loopStart');
      }
    });

    return this;
  }

  #resetMacros(bufferDuration: number = this.#bufferDuration) {
    const lastZero =
      this.#zeroCrossings[this.#zeroCrossings.length - 1] ?? bufferDuration;
    const firstZero = this.#zeroCrossings[0] ?? 0;

    this.#macroLoopEnd.audioParam.setValueAtTime(lastZero, this.now);
    this.#macroLoopStart.audioParam.setValueAtTime(firstZero, this.now);
    // ( consider whether startPoint and endPoint should be macros )

    if (this.#useZeroCrossings && this.#zeroCrossings.length > 0) {
      this.#macroLoopStart.setAllowedParamValues(this.#zeroCrossings);
      this.#macroLoopEnd.setAllowedParamValues(this.#zeroCrossings);
    }

    // todo: pre-compute gaddem allowed periods with optimized zero snapping!! (þegar é nenni)
    this.#macroLoopStart.setScale('C', [0], {
      lowestOctave: 0,
      highestOctave: 5,
    });
    this.#macroLoopEnd.setScale('C', [0], {
      lowestOctave: 0,
      highestOctave: 5,
    });

    return this;
  }

  async loadSample(
    buffer: AudioBuffer | ArrayBuffer,
    modSampleRate?: number,
    shoulDetectPitch = true,
    autoTranspose = false // todo: separate param for base tuning
  ): Promise<number> {
    if (buffer instanceof ArrayBuffer) {
      const ctx = getAudioContext();
      buffer = await ctx.decodeAudioData(buffer);
    }

    assert(isValidAudioBuffer(buffer));

    this.releaseAll(0);
    this.voicePool.transposeSemitones = 0; // for now
    this.#isLoaded = false;

    if (
      buffer.sampleRate !== this.audioContext.sampleRate ||
      (modSampleRate && this.audioContext.sampleRate !== modSampleRate)
    ) {
      console.warn(
        `sample rate mismatch, 
        buffer rate: ${buffer.sampleRate}, 
        context rate: ${this.audioContext.sampleRate}
        requested rate: ${modSampleRate}
        `
      );
    }

    if (shoulDetectPitch) {
      const pitch = await detectPitch(buffer);

      const closestNoteInfo = findClosestNote(pitch);
      // console.table(closestNoteInfo);

      this.sendUpstreamMessage('sample:pitch-detected', {
        pitch,
        closestNoteInfo,
      });

      if (autoTranspose) {
        const transposeSemitones = 60 - closestNoteInfo.midiNote;
        this.voicePool.transposeSemitones = transposeSemitones;
      }
    }

    if (this.#useZeroCrossings) {
      const zeroes = findZeroCrossings(buffer);
      this.#zeroCrossings = zeroes;
    }

    this.voicePool.setBuffer(buffer, this.#zeroCrossings);
    this.#bufferDuration = buffer.duration;

    this.#resetMacros(buffer.duration);

    this.#isLoaded = true;

    return buffer.duration;
  }

  play(
    midiNote: MidiValue,
    velocity: MidiValue = 100,
    modifiers?: PressedModifiers
  ): ActiveNoteId {
    if (modifiers) this.#handleModifierKeys(modifiers);

    if (modifiers && modifiers.alt !== undefined && modifiers.alt === true) {
      midiNote += 12;
    }

    const safeVelocity = isMidiValue(velocity) ? velocity : 100;
    const noteId = this.voicePool.noteOn(
      midiNote,
      velocity,
      0 // zero delay
    );

    this.#midiNoteToId.set(midiNote, noteId);

    this.sendUpstreamMessage('note:on', {
      midiNote,
      velocity: safeVelocity,
      noteId,
    });

    return noteId;
  }

  release(midiNote: MidiValue, modifiers?: PressedModifiers): this {
    if (modifiers) this.#handleModifierKeys(modifiers);
    if (this.#holdEnabled || this.#holdLocked) return this; // one-shot mode

    this.voicePool.noteOff(midiNote, this.getReleaseTime(), 0);

    this.sendUpstreamMessage('note:off', { midiNote });
    return this;
  }

  releaseAll(fadeOut_sec: number = this.getReleaseTime()): this {
    this.voicePool.allNotesOff(fadeOut_sec);
    this.#midiNoteToId.clear();
    return this;
  }

  panic = (fadeOut_sec?: number) => {
    this.releaseAll(fadeOut_sec);
    return this;
  };

  #handleModifierKeys(modifiers: PressedModifiers) {
    if (modifiers.caps !== undefined) {
      this.setLoopEnabled(modifiers.caps);
    }
    if (modifiers.shift !== undefined) {
      this.setHoldEnabled(modifiers.shift);
    }
    return this;
  }

  enableKeyboard() {
    if (!this.keyboardHandler) {
      this.keyboardHandler = {
        onNoteOn: this.play.bind(this),
        onNoteOff: this.release.bind(this),
        onBlur: () => this.panic(),
        onModifierChange: this.#handleModifierKeys.bind(this),
      };
      globalKeyboardInput.addHandler(this.keyboardHandler);
    }
    return this;
  }

  disableKeyboard() {
    if (this.keyboardHandler) {
      globalKeyboardInput.removeHandler(this.keyboardHandler);
      this.keyboardHandler = null;
    }
    return this;
  }

  async initMidiController(): Promise<boolean> {
    if (this.midiController?.isInitialized) {
      return true;
    }

    if (!this.midiController) {
      this.midiController = new MidiController();
    }

    assert(
      this.midiController,
      `SamplePlayer: Failed to create MIDI controller`
    );

    const result = await tryCatch(() => this.midiController!.initialize());
    assert(!result.error, `SamplePlayer: Failed to initialize MIDI`);
    return result.data;
  }

  async enableMIDI(
    midiController?: MidiController,
    channel: number = 0
  ): Promise<this> {
    const controller = midiController || this.midiController;
    const midiSuccess = await this.initMidiController(); // move ?

    if (midiSuccess && controller?.isInitialized) {
      controller.connectInstrument(this, channel);
    }
    return this;
  }

  disableMIDI(midiController?: MidiController, channel: number = 0): this {
    const controller = midiController || this.midiController;
    if (controller) controller.disconnectInstrument(channel);
    return this;
  }

  setMidiController(midiController: MidiController): this {
    this.midiController = midiController;
    return this;
  }

  /** PARAM SETTERS  */

  setAttackTime(seconds: number): this {
    this.storeParamValue('attack', seconds);
    this.voicePool.applyToAllVoices((voice) => voice.setAttack(seconds));
    return this;
  }

  setReleaseTime(seconds: number): this {
    this.storeParamValue('release', seconds);
    this.voicePool.applyToAllVoices((voice) => voice.setRelease(seconds));
    return this;
  }

  setSampleStartPoint(seconds: number): this {
    this.storeParamValue('startPoint', seconds);
    this.voicePool.applyToAllVoices((voice) => voice.setStartPoint(seconds));
    return this;
  }

  setSampleEndPoint(seconds: number): this {
    this.storeParamValue('endPoint', seconds);
    this.voicePool.applyToAllVoices((voice) => voice.setEndPoint(seconds));
    return this;
  }

  setLoopRampDuration(seconds: number): this {
    this.storeParamValue('loopRampDuration', seconds);
    // ? todo: is this enough ?
    return this;
  }

  setPlaybackRate(value: number): this {
    this.storeParamValue('playbackRate', value);
    this.voicePool.applyToAllVoices((voice) => voice.setPlaybackRate(value));
    console.warn(`SamplePlayer: setPlaybackRate is not implemented yet.`);
    return this;
  }

  // todo: test optimal safe values and move to constants
  SET_TARGET_TIMECONSTANT = 0.05; // 50ms
  #lastHpfUpdateTime = 0;
  #lastLpfUpdateTime = 0;
  #minFilterUpdateInterval = 0.08; // 80ms minimum between updates

  setHpfCutoff(hz: number): this {
    // if (!this.#voicePool.filtersEnabled) return this;
    if (isNaN(hz) || !isFinite(hz)) {
      console.warn(`Invalid HPF frequency: ${hz}`);
      return this;
    }

    // Clamp values to safe range
    const safeValue = Math.max(20, Math.min(hz, 20000));
    this.storeParamValue('hpfCutoff', safeValue);

    const currentTime = this.now;
    if (currentTime - this.#lastHpfUpdateTime < this.#minFilterUpdateInterval) {
      return this;
    }

    this.voicePool.applyToAllVoices((voice) => {
      if (!voice.hpf) return;
      try {
        cancelScheduledParamValues(voice.hpf.frequency, currentTime);
        voice.hpf.frequency.setTargetAtTime(
          safeValue,
          currentTime,
          this.SET_TARGET_TIMECONSTANT
        );
      } catch (error) {
        console.warn('Error automating filter: ', error);
      }
    });

    this.#lastHpfUpdateTime = currentTime;
    return this;
  }

  setLpfCutoff(hz: number): this {
    // if (!this.#pool.filtersEnabled) return this;
    if (isNaN(hz) || !isFinite(hz)) {
      console.warn(`Invalid LPF frequency: ${hz}`);
      return this;
    }
    const maxFilterFreq = this.audioContext.sampleRate / 2 - 100;

    const safeValue = Math.max(20, Math.min(hz, maxFilterFreq));
    this.storeParamValue('lpfCutoff', safeValue);

    const currentTime = this.now;
    if (currentTime - this.#lastLpfUpdateTime < this.#minFilterUpdateInterval) {
      return this;
    }

    this.voicePool.applyToAllVoices((voice) => {
      if (!voice.lpf) return;

      cancelScheduledParamValues(voice.lpf.frequency, currentTime);
      voice.lpf.frequency.setTargetAtTime(
        safeValue,
        currentTime,
        this.SET_TARGET_TIMECONSTANT
      );
    });

    this.#lastLpfUpdateTime = currentTime;
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

  setHoldEnabled(enabled: boolean) {
    if (this.#holdEnabled === enabled) return this;
    // if hold is locked (ON), turning it off is disabled but turning it on should work
    if (this.#holdLocked && !enabled) return this;

    this.#holdEnabled = enabled;

    if (!enabled) this.releaseAll(this.getReleaseTime());
    this.sendUpstreamMessage('hold:enabled', { enabled });
    return this;
  }

  setLoopLocked(locked: boolean): this {
    if (this.#loopLocked === locked) return this;

    this.#loopLocked = locked;

    this.setLoopEnabled(locked);
    this.sendUpstreamMessage('loop:locked', { locked });
    return this;
  }

  setHoldLocked(locked: boolean): this {
    if (this.#holdLocked === locked) return this;

    this.#holdLocked = locked;
    this.setHoldEnabled(locked);

    console.debug(`sending hold:locked message, locked: ${locked}`);
    this.sendUpstreamMessage('hold:locked', { locked });
    return this;
  }

  setLoopStart(
    targetValue: number,
    rampTime: number = this.getLoopRampDuration()
  ) {
    this.setLoopPoint('start', targetValue, this.loopEnd, rampTime);
    return this;
  }

  setLoopEnd(
    targetValue: number,
    rampTime: number = this.getLoopRampDuration()
  ) {
    this.setLoopPoint('end', this.loopStart, targetValue, rampTime);
    return this;
  }

  setFineTuneLoopEnd(loopendPoint: number) {
    this.#loopEndFineTune = loopendPoint;
    this.setLoopEnd(this.loopEnd);
    return this;
  }

  setLoopPoint(
    loopPoint: 'start' | 'end',
    start: number,
    end: number,
    rampDuration: number = this.getLoopRampDuration()
  ) {
    if (start < 0 || end > this.#bufferDuration || start >= end) return this;

    const RAMP_SENSITIVITY = 2;
    const scaledRampTime = rampDuration * RAMP_SENSITIVITY;

    console.warn({ loopPoint }, { start }, { end });

    if (loopPoint === 'start') {
      const normalizedLoopStart = start / this.#bufferDuration;

      const storeLoopStart = () =>
        this.storeParamValue('loopStart', normalizedLoopStart);
      this.#macroLoopStart.ramp(normalizedLoopStart, scaledRampTime, end, {
        onComplete: storeLoopStart,
      });
    } else {
      const normalizedLoopEnd = end * this.#bufferDuration;

      const storeLoopEnd = () =>
        this.storeParamValue('loopEnd', normalizedLoopEnd);
      const fineTunedEnd = normalizedLoopEnd + this.#loopEndFineTune;
      this.#macroLoopEnd.ramp(fineTunedEnd, scaledRampTime, start, {
        onComplete: storeLoopEnd,
      });
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

  getSamplestartPoint(): number {
    return this.getStoredParamValue(
      'startPoint',
      DEFAULT_PARAM_DESCRIPTORS.START_OFFSET.defaultValue
    );
  }

  getSampleendPoint(): number {
    return this.getStoredParamValue(
      'endPoint',
      DEFAULT_PARAM_DESCRIPTORS.END_OFFSET.defaultValue
    );
  }

  getLoopRampDuration(): number {
    return this.getStoredParamValue(
      'loopRampDuration',
      DEFAULT_PARAM_DESCRIPTORS.LOOP_RAMP_DURATION.defaultValue
    );
  }

  getPlaybackRate(): number {
    return this.getStoredParamValue(
      'playbackRate',
      DEFAULT_PARAM_DESCRIPTORS.PLAYBACK_RATE.defaultValue
    );
  }

  getHpfCutoff = () => this.getStoredParamValue('hpfCutoff', NaN);
  getLpfCutoff = () => this.getStoredParamValue('lpfCutoff', NaN);

  // Expose envelopes for UI access

  getAmpEnvelope(): CustomEnvelope {
    // Return the first voice's envelope as the "master" envelope
    const firstVoice = this.voicePool.allVoices[0];
    return firstVoice?.getAmpEnvelope();
  }

  getPitchEnvelope(): CustomEnvelope {
    // Return the first voice's envelope as the "master" envelope
    const firstVoice = this.voicePool.allVoices[0];
    return firstVoice?.getPitchEnvelope();
  }

  startLevelMonitoring(intervalMs?: number) {
    this.outBus.startLevelMonitoring(intervalMs);
  }

  dispose(): void {
    try {
      this.releaseAll();

      if (this.voicePool) {
        this.voicePool.dispose();
        this.voicePool = null as unknown as SampleVoicePool;
      }

      this.#midiNoteToId.clear();

      if (this.outBus) {
        this.outBus.dispose();
        this.outBus = null as unknown as InstrumentMasterBus;
      }

      this.#macroLoopStart?.dispose();
      this.#macroLoopEnd?.dispose();

      this.#macroLoopStart = null as unknown as MacroParam;
      this.#macroLoopEnd = null as unknown as MacroParam;

      // Reset state variables
      this.#bufferDuration = 0;
      this.#isReady = false;
      this.#isLoaded = false;
      this.#zeroCrossings = [];
      this.#useZeroCrossings = false;
      this.#loopEnabled = false;

      this.audioContext = null as unknown as AudioContext;
      this.messages = null as unknown as MessageBus<Message>;

      // Detach keyboard handler
      if (this.keyboardHandler) {
        globalKeyboardInput.removeHandler(this.keyboardHandler);
        this.keyboardHandler = null;
      }

      // todo: disableMIDI
    } catch (error) {
      console.error(`Error disposing Sampler ${this.nodeId}:`, error);
    }
  }

  get out() {
    return this.outBus.output;
  }

  get outputBus() {
    return this.outBus;
  }

  get context() {
    return this.audioContext;
  }

  get now() {
    return this.audioContext.currentTime;
  }

  get sampleDuration(): number {
    return this.#bufferDuration;
  }

  get volume(): number {
    return this.outBus.volume;
  }

  set volume(value: number) {
    this.outBus.volume = value;
  }

  get loopEnabled(): boolean {
    return this.#loopEnabled;
  }

  get holdEnabled(): boolean {
    return this.#holdEnabled;
  }

  get loopStart(): number {
    return this.#macroLoopStart.getValue();
  }

  get loopEnd(): number {
    return this.#macroLoopEnd.getValue();
  }

  get initialized() {
    return this.#isReady;
  }

  get isLoaded() {
    return this.#isLoaded;
  }

  // for UI integration
  getParameterDescriptors(): Record<string, LibParamDescriptor> {
    return {
      attack: DEFAULT_PARAM_DESCRIPTORS.ATTACK,
      release: DEFAULT_PARAM_DESCRIPTORS.RELEASE,
      startPoint: DEFAULT_PARAM_DESCRIPTORS.START_OFFSET,
      endPoint: DEFAULT_PARAM_DESCRIPTORS.END_OFFSET, // Ensure the endPoint is updated on loadSample !!!
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
        return this.getSamplestartPoint();
      case 'endPoint':
        return this.getSampleendPoint();
      case 'playbackRate':
        return this.getPlaybackRate();
      // case 'hpfCutoff':
      //   return this.getHpfCutoff();
      // case 'lpfCutoff':
      //   return this.getLpfCutoff();
      default:
        console.warn(`Unknown parameter: ${name}`);
        return undefined;
    }
  }

  setParameterValue(name: string, value: number): this {
    switch (name) {
      case 'attack':
        this.setAttackTime(value);
        break;
      case 'release':
        this.setReleaseTime(value);
        break;
      case 'startPoint':
        this.setSampleStartPoint(value);
        break;
      case 'endPoint':
        this.setSampleEndPoint(value);
        break;
      case 'playbackRate':
        this.setPlaybackRate(value);
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
      case 'hpfCutoff':
        this.setHpfCutoff(value);
        break;
      case 'lpfCutoff':
        this.setLpfCutoff(value);
        break;
      default:
        console.warn(`Unknown parameter: ${name}`);
    }
    return this;
  }
}
