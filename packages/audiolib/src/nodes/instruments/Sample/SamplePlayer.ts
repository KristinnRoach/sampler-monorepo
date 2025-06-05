import { LibInstrument } from '@/nodes/instruments/LibInstrument';
import type { MidiValue, ActiveNoteId } from '../types';
import { getAudioContext } from '@/context';
import { MidiController, globalKeyboardInput, PressedModifiers } from '@/io';
import { Message, MessageHandler, MessageBus } from '@/events';

import {
  assert,
  tryCatch,
  isValidAudioBuffer,
  isMidiValue,
  findZeroCrossings,
} from '@/utils';

import {
  MacroParam,
  ParamDescriptor,
  DEFAULT_PARAM_DESCRIPTORS,
} from '@/nodes/params';

import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';

import { SampleVoicePool } from './SampleVoicePool';

export class SamplePlayer extends LibInstrument {
  // SamplePlayer-specific fields private with #
  // #children: Array<LibNode | AudioNode> = [];
  #lpf: BiquadFilterNode | null = null;
  #hpf: BiquadFilterNode | null = null;
  #pool: SampleVoicePool;
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

    // Initialize the output bus methods
    this.setAltOutVolume = (...args) => this.outBus.setAltOutVolume(...args);
    this.connectAltOut = (...args) => this.outBus.connectAltOut(...args);
    this.mute = (...args) => this.outBus.mute(...args);

    // Init filters
    this.#hpf = new BiquadFilterNode(context, {
      type: 'highpass',
      frequency: 100,
      Q: 1,
    });

    this.#lpf = new BiquadFilterNode(context, {
      type: 'lowpass',
      frequency: 20000,
      Q: 1,
    });

    // ? Load stored values ?

    // Initialize voice pool
    this.#pool = new SampleVoicePool(context, polyphony, this.outBus.input);
    this.voices = this.#pool; // Assign to protected property in base class

    // Connect audiochain
    this.#hpf.connect(this.#lpf);

    // Setup parameters
    this.#macroLoopStart = new MacroParam(
      context,
      DEFAULT_PARAM_DESCRIPTORS.LOOP_START
    );
    this.#macroLoopEnd = new MacroParam(
      context,
      DEFAULT_PARAM_DESCRIPTORS.LOOP_END
    );

    // this.#registerParameters();
    this.#connectVoicesToMacros();

    // // Populate SamplePlayers sub-graph
    // this.#addChildren([this.outBus, this.#hpf, this.#lpf, this.#pool]);

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

  #connectVoicesToMacros(): this {
    const voices = this.#pool.allVoices;

    voices.forEach((voice) => {
      // Connect only the loop points
      const loopStartParam = voice.getParam('loopStart');
      const loopEndParam = voice.getParam('loopEnd');
      if (loopStartParam && loopEndParam) {
        this.#macroLoopStart.addTarget(loopStartParam, 'loopStart');
        this.#macroLoopEnd.addTarget(loopEndParam, 'loopEnd');
      }
    });

    return this;
  }

  #resetMacros(bufferDuration: number = this.#bufferDuration) {
    const lastZero =
      this.#zeroCrossings[this.#zeroCrossings.length - 1] ?? bufferDuration;
    const firstZero = this.#zeroCrossings[0] ?? 0;
    this.#macroLoopEnd.macro.setValueAtTime(lastZero, this.now);
    this.#macroLoopStart.macro.setValueAtTime(firstZero, this.now);

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
    modSampleRate?: number
  ): Promise<boolean> {
    if (buffer instanceof ArrayBuffer) {
      const ctx = getAudioContext();
      buffer = await ctx.decodeAudioData(buffer);
    }

    assert(isValidAudioBuffer(buffer));

    this.releaseAll();
    this.#isLoaded = false;

    if (
      buffer.sampleRate !== this.context.sampleRate ||
      (modSampleRate && this.context.sampleRate !== modSampleRate)
    ) {
      console.warn(
        `sample rate mismatch, 
        buffer rate: ${buffer.sampleRate}, 
        context rate: ${this.context.sampleRate}
        requested rate: ${modSampleRate}
        `
      );
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

    this.#pool.setBuffer(buffer, this.#zeroCrossings);

    this.#resetMacros(buffer.duration);
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
    // if (modifiers) this.#handleModifierKeys(modifiers);

    if (modifiers && modifiers.alt !== undefined && modifiers.alt === true) {
      midiNote += 12;
    }

    // If this MIDI note is already playing, release it first
    if (this.#midiNoteToId.has(midiNote)) {
      const oldNoteId = this.#midiNoteToId.get(midiNote)!;
      this.#pool.noteOff(oldNoteId, 0); // Quick release
    }

    const safeVelocity = isMidiValue(velocity) ? velocity : 100;
    const noteId = this.#pool.noteOn(
      midiNote,
      velocity,
      this.now,
      this.getAttackTime() // Pass the attack time directly
    );

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

    this.#pool.noteOff(noteId, this.getReleaseTime(), 0); // Pass the release time directly

    this.sendUpstreamMessage('note:off', { noteId, midiNote });
    return this;
  }

  releaseAll(fadeOut_sec: number = this.getReleaseTime()): this {
    this.#pool.allNotesOff(fadeOut_sec);
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
      // if (!this.#holdEnabled) this.setLoopEnabled(modifiers.shift);
    }

    if (modifiers.space !== undefined && modifiers.space === true) {
      this.#pool.transposeSemitones -= 12;
      console.log(
        `Transposing down by 12 semitones, new value: ${this.#pool.transposeSemitones}`
      );
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
      console.log(`SamplePlayer: MIDI controller initialized`);
      return true;
    }

    if (!this.midiController) {
      console.debug(`SamplePlayer: Creating MIDI controller.`);
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

  setAttackTime(value: number): this {
    this.storeParamValue('attack', value);
    return this;
  }

  setReleaseTime(value: number): this {
    this.storeParamValue('release', value);
    return this;
  }

  setSampleStartOffset(seconds: number): this {
    this.storeParamValue('startOffset', seconds);
    this.#pool.allVoices.forEach((voice) => voice.setStartOffset(seconds));
    return this;
  }

  setSampleEndOffset(seconds: number): this {
    this.storeParamValue('endOffset', seconds);
    this.#pool.allVoices.forEach((voice) => voice.setEndOffset(seconds));
    return this;
  }

  setLoopRampDuration(seconds: number): this {
    this.storeParamValue('loopRampDuration', seconds);
    return this;
  }

  setPlaybackRate(value: number): this {
    // this.#pool.setPlaybackRate(value);
    this.storeParamValue('playbackRate', value);
    return this;
  }

  setHpfCutoff(value: number): this {
    if (!this.#hpf) return this;
    this.#hpf.frequency.setValueAtTime(value, this.now);
    this.storeParamValue('hpfCutoff', value);
    return this;
  }

  setLpfCutoff(value: number): this {
    if (!this.#lpf) return this;
    this.#lpf.frequency.setValueAtTime(value, this.now);
    this.storeParamValue('lpfCutoff', value);
    return this;
  }

  setLoopEnabled(enabled: boolean): this {
    if (this.#loopEnabled === enabled) return this;
    // if loop is locked (ON), turning it off is disabled but turning it on should work
    if (this.#loopLocked && !enabled) return this;

    const voices = this.#pool.allVoices;
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
    this.sendUpstreamMessage('hold:state', { enabled });
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
    const fineTuned = targetValue + this.#loopEndFineTune;
    this.setLoopPoint('end', this.loopStart, fineTuned, rampTime);
    return this;
  }

  setFineTuneLoopEnd(valueToAdd: number) {
    this.#loopEndFineTune = valueToAdd;
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

    // ? refactor
    if (loopPoint === 'start') {
      const storeLoopStart = () => this.storeParamValue('loopStart', start);
      this.#macroLoopStart.ramp(start, scaledRampTime, end, {
        onComplete: storeLoopStart,
      });
    } else {
      const storeLoopEnd = () => this.storeParamValue('loopEnd', end);

      this.#macroLoopEnd.ramp(end, scaledRampTime, start, {
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

  // NOTE: MacroParams (e.g. loopStart and loopEnd) use direct access property getters (get loopStart() etc)

  getPlaybackRate(): number {
    return this.getStoredParamValue(
      'playbackRate',
      DEFAULT_PARAM_DESCRIPTORS.PLAYBACK_RATE.defaultValue
    );
  }

  getHpfCutoff() {
    return this.getStoredParamValue(
      'hpfCutoff',
      this.#hpf?.frequency.value ||
        DEFAULT_PARAM_DESCRIPTORS.HIGHPASS_CUTOFF.defaultValue
    );
  }

  getLpfCutoff() {
    return this.getStoredParamValue(
      'lpfCutoff',
      this.#lpf?.frequency.value ||
        DEFAULT_PARAM_DESCRIPTORS.LOWPASS_CUTOFF.defaultValue
    );
  }

  startLevelMonitoring(intervalMs?: number) {
    this.outBus.startLevelMonitoring(intervalMs);
  }

  dispose(): void {
    try {
      this.releaseAll();

      if (this.#pool) {
        this.#pool.dispose();
        this.#pool = null as unknown as SampleVoicePool;
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

      this.context = null as unknown as AudioContext;
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

  get now() {
    return this.context.currentTime;
  }

  get audioContext() {
    return this.context;
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

  // todo: use for UI integration
  getParameterDescriptors(): Record<string, ParamDescriptor> {
    return {
      attack: DEFAULT_PARAM_DESCRIPTORS.ATTACK,
      release: DEFAULT_PARAM_DESCRIPTORS.RELEASE,
      startOffset: DEFAULT_PARAM_DESCRIPTORS.START_OFFSET,
      endOffset: DEFAULT_PARAM_DESCRIPTORS.END_OFFSET, // TODO: Ensure the endOffset is updated on loadSample !!!
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
      case 'hpfCutoff':
        return this.getHpfCutoff();
      case 'lpfCutoff':
        return this.getLpfCutoff();
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

  // // Todo: change this to "panic" // abstract method from LibInstrument
  // stopAll(fadeOut_sec: number = this.getReleaseTime()): this {
  //   return this.releaseAll(fadeOut_sec);
  // }
}

// IGNORE ALL COMMENTS BELOW - will clean up later

// #onNoteOn(
//   midiNote: number,
//   velocity: number = 100,
//   modifiers: PressedModifiers
// ) {
//   this.#pool.noteOn(midiNote, velocity);
// }

// #onNoteOff(midiNote: number, modifiers: PressedModifiers) {
//   this.#pool.noteOff(midiNote);
// }

// get isPlaying(): boolean {
//   return this.#pool.playingCount > 0;
// }

// get activeVoicesCount(): number {
//   return Array.from(this.#activeMidiNoteToVoice.values()).reduce(
//     (sum, voices) => sum + voices.size,
//     0
//   );
// }

// get voiceCount(): number {
//   return this.#pool.allVoices.length;
// }

// #mostRecentSource: SampleVoice | null = null;

// enablePositionTracking(
//   enabled: boolean,
//   strategy: 'mostRecent' | 'all' = 'mostRecent'
// ) {
//   // todo: delegate to pool
//   // this.#trackPlaybackPosition = enabled;
//   // if (enabled && strategy === 'mostRecent') {
//   //   // Only enable tracking for most recent source
//   //   if (this.#mostRecentSource) {
//   //     this.#mostRecentSource.enablePositionTracking = true;
//   //   }
//   // } else if (enabled && strategy === 'all') {
//   //   // todo
//   // } else {
//   //   // Disable tracking for all sources
//   //   this.#pool.allVoices.forEach((voice) => {
//   //     (voice as any).enablePositionTracking = false;
//   //   });
//   // }
// }

// getParamValue(name: string): number | null {
//   // todo
//   return null;
// }

// setParamValue(name: string, value: number): this {
//   // todo
//   return this;
// }

// #initVoices(context: AudioContext, polyphony: number): void {
//   for (let i = 0; i < polyphony; i++) {
//     const voice = new SampleVoice(context);

//     voice.connect(this.outBus.input);
//     this.#connectToMacros(voice);

//     this.#pool.add(voice);

//     voice.onMessage('voice:releasing', (data) => {
//       this.#pool.releaseVoice(voice);
//     });

//     voice.onMessage('voice:ended', (data) => {
//       // todo: clarify responsibilities for sampler vs pool !
//       this.#activeMidiNoteToVoice.forEach((voices, midiNote) => {
//         if (voices.has(voice)) {
//           voices.delete(voice);
//           // Return voice to pool
//           this.#pool.stopVoice(voice);
//           if (voices.size === 0) {
//             this.#activeMidiNoteToVoice.delete(midiNote);
//           }
//         }
//       });
//       // Forward position tracking events
//       if (this.#mostRecentSource === voice) {
//         this.#mostRecentSource = null;
//       }
//     });
//   }
// }

// getParameterValues(): Record<string, number> {
//   return {
//     attack: this.getParamValue('attack') || this.#attack,
//     release: this.getParamValue('release') || this.#release,
//     startOffset: this.getParamValue('start-offset') || this.#startOffset,
//     endOffset: this.getParamValue('end-offset') || this.#endOffset,
//     playbackRate: this.getParamValue('playback-rate') || this.#playbackRate,
//     loopStart: this.#macroLoopStart.getValue(),
//     loopEnd: this.#macroLoopEnd.getValue(),
//     loopRampDuration: this.#loopRampDuration,
//     hpfCutoff: this.getParamValue('hpf-freq'),
//     lpfCutoff: this.getParamValue('lpf-freq'),
//   };
// }

// #addChild = (node: LibNode | AudioNode) => this.#children.push(node);

// #addChildren = (nodes: Array<LibNode | AudioNode>) => {
//   nodes.forEach((n) => this.#children.push(n));
//   return this;
// };

// #registerParameters(): void {
//   // Register the loop macros (already LibParams)
//   this.params.register(this.#macroLoopStart);
//   this.params.register(this.#macroLoopEnd);

//   this.params.register(
//     // Need to wrap these simple values as LibParams:
//     new LibParam('attack', DEFAULT_PARAM_DESCRIPTORS.ATTACK, this.#attack)
//   );
//   this.params.register(
//     new LibParam('release', DEFAULT_PARAM_DESCRIPTORS.RELEASE, this.#release)
//   );
//   this.params.register(
//     new LibParam(
//       'start-offset',
//       DEFAULT_PARAM_DESCRIPTORS.START_OFFSET,
//       this.#startOffset
//     )
//   );
//   this.params.register(
//     new LibParam(
//       'end-offset',
//       DEFAULT_PARAM_DESCRIPTORS.END_OFFSET,
//       this.#endOffset
//     )
//   );
//   this.params.register(
//     new LibParam(
//       'playback-rate',
//       DEFAULT_PARAM_DESCRIPTORS.PLAYBACK_RATE,
//       this.#playbackRate
//     )
//   );
//   this.params.register(
//     new LibParam(
//       'loop-ramp-duration',
//       DEFAULT_PARAM_DESCRIPTORS.LOOP_RAMP_DURATION,
//       this.#loopRampDuration
//     )
//   );

//   if (!this.#hpf || !this.#lpf) return;

//   // Register native AudioParams with descriptors
//   this.params.register(
//     this.#hpf.frequency,
//     DEFAULT_PARAM_DESCRIPTORS.HIGHPASS_CUTOFF
//   );

//   this.params.register(
//     this.#lpf.frequency,
//     DEFAULT_PARAM_DESCRIPTORS.LOWPASS_CUTOFF
//   );
// }

// const allVoices = this.#pool.allVoices;
// assert(allVoices.length > 0, 'No voices to load sample!');

// const promises = allVoices.map((v) => {
//   v.loadBuffer(buffer, this.#zeroCrossings);
//   v.setStartOffset(this.#startOffset);
//   v.setEndOffset(
//     this.#zeroCrossings[this.#zeroCrossings.length - 1] || buffer.duration
//   );
// });

// const result = await tryCatch(
//   () => Promise.all(promises),
//   'Failed to load sample'
// );
// if (result.error) {
//   return false;
// }
