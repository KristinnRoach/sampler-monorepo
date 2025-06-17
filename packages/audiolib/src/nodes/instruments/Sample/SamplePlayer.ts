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

  // #envelopeControllers: Record<string, any> = {}; // Map of param name to controller // add Type for AudioEnvelopeController
  #ampEnvelope: CustomEnvelope;
  #pitchEnvelope: CustomEnvelope;
  #macroEnvGain: MacroParam;
  #macroPlaybackRate: MacroParam;

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
    this.#ampEnvelope = createCustomEnvelope();
    this.#pitchEnvelope = createCustomEnvelope();

    this.#macroLoopStart = new MacroParam(
      context,
      DEFAULT_PARAM_DESCRIPTORS.LOOP_START
    );
    this.#macroLoopEnd = new MacroParam(
      context,
      DEFAULT_PARAM_DESCRIPTORS.LOOP_END
    );

    this.#macroEnvGain = new MacroParam(
      context,
      DEFAULT_PARAM_DESCRIPTORS.ENV_GAIN
    );

    this.#macroPlaybackRate = new MacroParam(
      context,
      DEFAULT_PARAM_DESCRIPTORS.PLAYBACK_RATE
    );

    this.#connectVoicesToMacros();

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

  // setEnvelopeController(
  //   controller: any,
  //   paramName: 'envGain' | 'playbackRate' | 'loopStart' | 'loopEnd' = 'envGain'
  // ): this {
  //   this.#envelopeControllers[paramName] = controller;
  //   return this;
  // }

  getMacrosAudioParam(
    paramName: 'loopStart' | 'loopEnd' | 'envGain' | 'playbackRate'
  ) {
    switch (paramName) {
      case 'loopStart':
        return this.#macroLoopStart.audioParam;
      case 'loopEnd':
        return this.#macroLoopEnd.audioParam;
      case 'envGain':
        return this.#macroEnvGain.audioParam;
      case 'playbackRate':
        return this.#macroPlaybackRate.audioParam; // ! check integration
      default:
        const unreachable: never = paramName;
        throw new Error(`Unknown macro parameter: ${unreachable}`);
    }
  }

  getMacro(paramName: 'loopStart' | 'loopEnd' | 'envGain' | 'playbackRate') {
    switch (paramName) {
      case 'loopStart':
        return this.#macroLoopStart;
      case 'loopEnd':
        return this.#macroLoopEnd;
      case 'envGain':
        return this.#macroEnvGain;
      case 'playbackRate':
        return this.#macroPlaybackRate;
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

      const envGainParam = voice.getParam('envGain');
      const playbackRateParam = voice.getParam('playbackRate');

      if (envGainParam) {
        this.#macroEnvGain.addTarget(envGainParam, 'envGain');
      }

      if (playbackRateParam) {
        this.#macroPlaybackRate.addTarget(playbackRateParam, 'playbackRate');
      }

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

    this.#macroEnvGain.audioParam.setValueAtTime(0, this.now);
    this.#macroLoopEnd.audioParam.setValueAtTime(lastZero, this.now);
    this.#macroLoopStart.audioParam.setValueAtTime(firstZero, this.now);

    // consider whether startOffset and endOffset should be macros

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
    autoTranspose = true
  ): Promise<boolean> {
    if (buffer instanceof ArrayBuffer) {
      const ctx = getAudioContext();
      buffer = await ctx.decodeAudioData(buffer);
    }

    assert(isValidAudioBuffer(buffer));

    this.releaseAll();
    this.voicePool.transposeSemitones = 0; // or possibly stored value
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

      console.table(closestNoteInfo);

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

      // reset start and end offset
      const storedStart = this.getStoredParamValue('startOffset', 0);
      this.setParameterValue('startOffset', storedStart ?? zeroes[0]);

      const storedOffFromEnd = this.getStoredParamValue('endOffset', 0);
      const lastZeroOffFromEnd =
        buffer.duration - zeroes[zeroes.length - 1] || 0;
      this.setParameterValue(
        'endOffset',
        storedOffFromEnd || lastZeroOffFromEnd
      );

      // cache zero crossings
      this.#zeroCrossings = zeroes;
    }

    this.voicePool.setBuffer(buffer, this.#zeroCrossings);

    this.#resetMacros(buffer.duration);
    // TODO: #resetEnvelopes({buffer.duration})
    this.#bufferDuration = buffer.duration;

    this.setLoopEnd(buffer.duration); // for now, use saved loopEnd if exists, when implemented

    this.#isLoaded = true;
    return true;
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

    // If this MIDI note is already playing, release it first
    if (this.#midiNoteToId.has(midiNote)) {
      const oldNoteId = this.#midiNoteToId.get(midiNote)!;
      this.voicePool.noteOff(oldNoteId, 0); // Quick release
    }

    const safeVelocity = isMidiValue(velocity) ? velocity : 100;
    const noteId = this.voicePool.noteOn(
      midiNote,
      velocity,
      0 // zero delay
    );

    // this.getMacrosAudioParam('envGain').linearRampToValueAtTime(
    //   1,
    //   this.now + 0.001
    // );

    this.#ampEnvelope.applyToAudioParam(
      this.getMacrosAudioParam('envGain'),
      this.now + 0.001,
      this.sampleDuration
    );

    this.#pitchEnvelope.applyToAudioParam(
      this.getMacrosAudioParam('playbackRate'),
      this.now + 0.001,
      this.sampleDuration
    );

    // ! - audiolib should just receive values from SamplerElement UI and handle applying it
    // - env length AND env loop duration should be determined by sample duration
    // minus start / end offsets.. or loopStart / loopEnd offsets
    // if (this.context) {
    //   const currentTime = this.context.currentTime;
    //   const duration = this.#bufferDuration || 2;
    //   Object.entries(this.#envelopeControllers).forEach(
    //     ([paramName, controller]) => {
    //       if (controller) {
    //         const param = this.getMacrosAudioParam(paramName as any);
    //         if (param) {
    //           controller.applyToAudioParam(param, currentTime, duration);
    //         }
    //       }
    //     }
    //   );
    // }

    this.#midiNoteToId.set(midiNote, noteId);

    this.sendUpstreamMessage('note:on', {
      midiNote,
      velocity: safeVelocity,
      noteId,
    });

    return noteId;
  }

  release(note: MidiValue | ActiveNoteId, modifiers?: PressedModifiers): this {
    if (modifiers) this.#handleModifierKeys(modifiers);

    if (this.#holdEnabled || this.#holdLocked) return this; // simple play through (one-shot mode)

    let noteId: ActiveNoteId;
    let midiNote: MidiValue | undefined;

    if (note >= 0 && note <= 127) {
      midiNote = note as MidiValue;
      noteId = this.#midiNoteToId.get(midiNote) ?? -1;
      if (noteId !== -1) {
        this.#midiNoteToId.delete(midiNote);
      } else {
        // No matching noteId found
        return this;
      }
    } else {
      // It's already a noteId
      noteId = note as ActiveNoteId;

      // Find and remove from midiNoteToId if present
      for (const [midi, id] of this.#midiNoteToId.entries()) {
        if (id === noteId) {
          midiNote = midi;
          this.#midiNoteToId.delete(midi);
          break;
        }
      }
    }

    this.voicePool.noteOff(noteId, this.getReleaseTime(), 0); // Pass the release time directly

    this.sendUpstreamMessage('note:off', { noteId, midiNote });
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

  setSampleStartOffset(seconds: number): this {
    this.storeParamValue('startOffset', seconds);
    this.voicePool.applyToAllVoices((voice) => voice.setStartOffset(seconds));
    return this;
  }

  setSampleEndOffset(seconds: number): this {
    this.storeParamValue('endOffset', seconds);
    this.voicePool.applyToAllVoices((voice) => voice.setEndOffset(seconds));
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

  setFineTuneLoopEnd(loopEndOffset: number) {
    this.#loopEndFineTune = loopEndOffset;
    console.log(`fine tune: ${this.#loopEndFineTune}`);
    console.log(`curr loop end: ${this.loopEnd}`);
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

    if (loopPoint === 'start') {
      const storeLoopStart = () => this.storeParamValue('loopStart', start);
      this.#macroLoopStart.ramp(start, scaledRampTime, end, {
        onComplete: storeLoopStart,
      });
    } else {
      const storeLoopEnd = () => this.storeParamValue('loopEnd', end);
      const fineTunedEnd = end + this.#loopEndFineTune;
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

  getSampleStartOffset(): number {
    return this.getStoredParamValue(
      'startOffset',
      DEFAULT_PARAM_DESCRIPTORS.START_OFFSET.defaultValue
    );
  }

  getSampleEndOffset(): number {
    return this.getStoredParamValue(
      'endOffset',
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
    return this.#ampEnvelope;
  }

  getPitchEnvelope(): CustomEnvelope {
    return this.#pitchEnvelope;
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

      this.#macroEnvGain?.dispose();
      this.#macroLoopStart?.dispose();
      this.#macroLoopEnd?.dispose();

      this.#macroEnvGain = null as unknown as MacroParam;
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

  // get firstChildren() {
  //   return this.#children;
  // }

  // get in() { this.#hpf }

  get out() {
    return this.outBus.output;
  }

  get outputBus() {
    return this.outBus;
  }

  // get destination() {
  //   return this.destination;
  // }

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

  get isReady() {
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
      startOffset: DEFAULT_PARAM_DESCRIPTORS.START_OFFSET,
      endOffset: DEFAULT_PARAM_DESCRIPTORS.END_OFFSET, // Ensure the endOffset is updated on loadSample !!!
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
      case 'startOffset':
        return this.getSampleStartOffset();
      case 'endOffset':
        return this.getSampleEndOffset();
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
      // case 'envGain':  // + playbackRate eða henda
      //   this.setEnvGain(value);
      //   break;
      case 'attack':
        this.setAttackTime(value);
        break;
      case 'release':
        this.setReleaseTime(value);
        break;
      case 'startOffset':
        this.setSampleStartOffset(value);
        break;
      case 'endOffset':
        this.setSampleEndOffset(value);
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
