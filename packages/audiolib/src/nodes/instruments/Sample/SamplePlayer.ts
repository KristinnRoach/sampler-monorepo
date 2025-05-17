import { LibInstrument, InstrumentType, LibVoiceNode } from '@/LibNode';
import { createNodeId, NodeID } from '@/nodes/node-store';
import type { MIDINote, ActiveNoteId } from '../types';
import { getAudioContext } from '@/context';

import {
  MidiController,
  // instances versus singletons?
  globalKeyboardInput,
  InputHandler,
  PressedModifiers,
} from '@/io';

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

import {
  assert,
  tryCatch,
  isValidAudioBuffer,
  isMidiValue,
  findZeroCrossings,
} from '@/utils';

import { MacroParam } from '@/nodes/params';
import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';

import { VoicePool } from '../../helpers/collections/VoicePool';

export class SamplePlayer implements LibInstrument {
  readonly nodeId: NodeID;
  readonly nodeType: InstrumentType = 'sampler';

  // todo: simplify, clean up and standardize all state management

  #bufferDuration: number = 0;

  #context: AudioContext;
  #outBus: InstrumentMasterBus;
  #pool: VoicePool;

  #messages: MessageBus<Message>;
  #keyboardHandler: InputHandler | null = null;

  #midiNoteToId: Map<MIDINote, ActiveNoteId> = new Map();

  #loopRampDuration: number = 0.2;

  #loopEnabled = false;
  #holdEnabled = false;
  #macroLoopStart: MacroParam;
  #macroLoopEnd: MacroParam;

  #startOffset: number = 0;
  #endOffset: number = 0;

  #attack: number = 0.01;
  #release: number = 0.1;

  #isInitialized = false;
  #isLoaded = false;

  #zeroCrossings: number[] = []; // cache maybe needed later
  #useZeroCrossings = true;

  #trackPlaybackPosition = false;

  randomizeVelocity = false; // for testing, refactor later

  constructor(
    context: AudioContext,
    polyphony: number = 16,
    audioBuffer?: AudioBuffer
  ) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context;
    this.#messages = createMessageBus<Message>(this.nodeId);

    // Initialize the output bus
    this.#outBus = new InstrumentMasterBus();

    // Initialize macro params
    this.#macroLoopStart = new MacroParam(context, 0);
    this.#macroLoopEnd = new MacroParam(context, 0);

    // Initialize voice pool
    this.#pool = new VoicePool(context, polyphony, this.#outBus.input);
    this.#connectToMacros();

    this.#isInitialized = true;

    if (audioBuffer?.duration) {
      this.loadSample(audioBuffer, audioBuffer.sampleRate);
    } else {
      this.#isLoaded = false;
    }
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any): void {
    this.#messages.sendMessage(type, data);
  }

  connect(destination: AudioNode): this {
    this.#outBus.connect(destination);
    return this;
  }

  disconnect(): void {
    this.#outBus.disconnect();
  }

  #connectToMacros(): this {
    const voices = this.#pool.allVoices;

    voices.forEach((voice) => {
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
    // todo: set scale - allowed durations ...
    return this;
  }

  async loadSample(
    buffer: AudioBuffer,
    modSampleRate?: number
  ): Promise<boolean> {
    assert(isValidAudioBuffer(buffer));

    this.stopAll();
    this.#isLoaded = false;

    if (
      buffer.sampleRate !== this.#context.sampleRate ||
      (modSampleRate && this.#context.sampleRate !== modSampleRate)
    ) {
      console.warn(
        `sample rate mismatch, 
        buffer rate: ${buffer.sampleRate}, 
        context rate: ${this.#context.sampleRate}
        requested rate: ${modSampleRate}
        `
      );
    }

    if (this.#useZeroCrossings) {
      const zeroes = findZeroCrossings(buffer);
      // reset start and end offset
      this.#startOffset = zeroes[0] || 0; // or saved value
      const lastZero = zeroes[zeroes.length - 1];
      this.#endOffset = buffer.duration - lastZero || 0;
      // cache zero crossings
      this.#zeroCrossings = zeroes;
    }

    const allVoices = this.#pool.allVoices;
    assert(allVoices.length > 0, 'No voices to load sample!');

    const promises = allVoices.map((v) => v.loadBuffer(buffer));

    const result = await tryCatch(
      () => Promise.all(promises),
      'Failed to load sample'
    );
    if (result.error) {
      return false;
    }

    this.#resetMacros(buffer.duration);
    this.#bufferDuration = buffer.duration;

    this.setLoopEnd(buffer.duration); // for now, use saved loopEnd if exists, when implemented

    this.#isLoaded = true;
    return true;
  }

  play(
    midiNote: number,
    velocity: number = 100,
    modifiers?: PressedModifiers
  ): ActiveNoteId {
    // ??? Returns the noteId so callers can use it

    if (modifiers) this.#handleModifierKeys(modifiers);

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
      this.#attack
    );

    this.#midiNoteToId.set(midiNote, noteId);

    this.sendMessage('note:on', { midiNote, velocity: safeVelocity, noteId });
    return noteId;
  }

  release(input: MIDINote | ActiveNoteId, modifiers?: PressedModifiers): this {
    if (modifiers) this.#handleModifierKeys(modifiers);
    if (this.#holdEnabled) return this; // simple play through (one-shot mode)

    // Convert MIDI note to noteId if needed
    let noteId: ActiveNoteId;
    let midiNote: MIDINote | undefined;

    if (input >= 0 && input <= 127) {
      // It's a MIDI note
      midiNote = input as MIDINote;
      noteId = this.#midiNoteToId.get(midiNote) ?? -1;
      if (noteId !== -1) {
        this.#midiNoteToId.delete(midiNote);
      } else {
        // No matching noteId found
        return this;
      }
    } else {
      // It's already a noteId
      noteId = input as ActiveNoteId;

      // Find and remove from midiNoteToId if present
      for (const [midi, id] of this.#midiNoteToId.entries()) {
        if (id === noteId) {
          midiNote = midi;
          this.#midiNoteToId.delete(midi);
          break;
        }
      }
    }

    this.#pool.noteOff(noteId, this.#release, 0);

    this.sendMessage('note:off', { noteId, midiNote });
    return this;
  }

  panic = () => this.stopAll();

  stopAll() {
    this.#pool.allNotesOff();
    this.#midiNoteToId.clear();
    return this;
  }

  #onBlur() {
    console.debug('Blur occured');
    this.panic();
    return this;
  }

  #handleModifierKeys(modifiers: PressedModifiers) {
    if (modifiers.caps !== undefined) {
      this.setLoopEnabled(modifiers.caps);
    }
    return this;
  }

  enableKeyboard() {
    if (!this.#keyboardHandler) {
      this.#keyboardHandler = {
        onNoteOn: this.play.bind(this),
        onNoteOff: this.release.bind(this),
        onBlur: this.#onBlur.bind(this),
        onModifierChange: this.#handleModifierKeys.bind(this),
      };
      globalKeyboardInput.addHandler(this.#keyboardHandler);
    } else {
      console.debug(`keyboard already enabled`);
    }
    return this;
  }

  disableKeyboard() {
    if (this.#keyboardHandler) {
      globalKeyboardInput.removeHandler(this.#keyboardHandler);
      this.#keyboardHandler = null;
    } else {
      console.debug(`keyboard already disabled`);
    }
    return this;
  }

  async enableMIDI(
    midiController: MidiController,
    channel: number = 0
  ): Promise<this> {
    assert(midiController.isInitialized, `MidiController must be initialized`);
    midiController.connectInstrument(this, channel);
    return this;
  }

  disableMIDI(midiController: MidiController, channel: number = 0): this {
    midiController.disconnectInstrument(channel);
    return this;
  }

  setAttackTime(seconds: number) {
    this.#attack = seconds;
    return this;
  }

  setReleaseTime(seconds: number) {
    this.#release = seconds;
    return this;
  }

  setSampleStartOffset(seconds: number) {
    this.#startOffset = seconds;
    return this;
  }

  setSampleEndOffset(seconds: number) {
    this.#endOffset = seconds;
    return this;
  }

  setHoldEnabled(enabled: boolean) {
    if (this.#holdEnabled === enabled) return this;
    this.#holdEnabled = enabled;
    this.sendMessage('hold:state', { enabled });
    return this;
  }

  setLoopEnabled(enabled: boolean): this {
    if (this.#loopEnabled === enabled) return this;

    const voices = this.#pool.allVoices;
    voices.forEach((v) => v.setLoopEnabled(enabled));

    this.#loopEnabled = enabled;
    this.sendMessage('loop:state', { enabled });
    return this;
  }

  setLoopStart(targetValue: number, rampTime: number = this.#loopRampDuration) {
    this.setLoopPoint('start', targetValue, this.loopEnd, rampTime);
    return this;
  }

  setLoopEnd(targetValue: number, rampTime: number = this.#loopRampDuration) {
    this.setLoopPoint('end', this.loopStart, targetValue, rampTime);
    return this;
  }

  setLoopPoint(
    loopPoint: 'start' | 'end',
    start: number,
    end: number,
    rampDuration: number = this.#loopRampDuration
  ) {
    if (start < 0 || end > this.#bufferDuration || start >= end) return this;

    const RAMP_FACTOR = 2;
    const scaledRampTime = rampDuration * RAMP_FACTOR;

    if (loopPoint === 'start') {
      this.#macroLoopStart.ramp(start, scaledRampTime, end);
    } else {
      this.#macroLoopEnd.ramp(end, scaledRampTime, start);
    }

    return this;
  }

  startLevelMonitoring(intervalMs?: number) {
    this.#outBus.startLevelMonitoring(intervalMs);
  }

  dispose(): void {
    try {
      this.stopAll();

      if (this.#pool) {
        this.#pool.dispose();
        this.#pool = null as unknown as VoicePool;
      }

      this.#midiNoteToId.clear();

      if (this.#outBus) {
        this.#outBus.dispose();
        this.#outBus = null as unknown as InstrumentMasterBus;
      }

      this.#macroLoopStart?.dispose();
      this.#macroLoopEnd?.dispose();
      this.#macroLoopStart = null as unknown as MacroParam;
      this.#macroLoopEnd = null as unknown as MacroParam;

      // Reset state variables
      this.#bufferDuration = 0;
      this.#isInitialized = false;
      this.#isLoaded = false;
      this.#zeroCrossings = [];
      this.#useZeroCrossings = false;
      this.#loopRampDuration = 0;
      // this.#loopEnabled = false;

      this.#context = null as unknown as AudioContext;
      this.#messages = null as unknown as MessageBus<Message>;

      // Detach keyboard handler
      if (this.#keyboardHandler) {
        globalKeyboardInput.removeHandler(this.#keyboardHandler);
        this.#keyboardHandler = null;
      }

      // todo: disableMIDI
    } catch (error) {
      console.error(`Error disposing Sampler ${this.nodeId}:`, error);
    }
  }

  get now() {
    return getAudioContext().currentTime;
  }

  get sampleDuration(): number {
    return this.#bufferDuration;
  }

  get volume(): number {
    return this.#outBus.volume;
  }

  set volume(value: number) {
    this.#outBus.volume = value;
  }

  get loopEnabled(): boolean {
    return this.#loopEnabled;
  }

  get loopStart(): number {
    return this.#macroLoopStart.getValue();
  }

  get loopEnd(): number {
    return this.#macroLoopEnd.getValue();
  }

  get isInitialized() {
    return this.#isInitialized;
  }

  get isLoaded() {
    return this.#isLoaded;
  }
}

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

//     voice.connect(this.#outBus.input);
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
