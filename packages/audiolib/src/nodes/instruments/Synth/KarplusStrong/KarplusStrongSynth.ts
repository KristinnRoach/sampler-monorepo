import {
  LibInstrument,
  InstrumentType,
} from '@/nodes/instruments/LibInstrument';
import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';
import { KarplusVoicePool } from './KarplusVoicePool';
import { createNodeId, NodeID } from '@/nodes/node-store';
import { getAudioContext } from '@/context';
import { Message, MessageHandler } from '@/events';
import { MidiController, InputHandler, PressedModifiers } from '@/io';
import { globalKeyboardInput } from '@/io';
import { Debouncer } from '@/utils/Debouncer';
import { localStore } from '@/storage/local';

export class KarplusStrongSynth extends LibInstrument {
  // Keep truly KarplusStrongSynth-specific fields private with #
  #auxInput: GainNode;
  #voicePool: KarplusVoicePool;
  #midiNoteToId = new Map<number, number>(); // Track active notes by midiNote
  #debouncer: Debouncer = new Debouncer();
  #isReady: boolean = false;

  get isReady() {
    return this.#isReady;
  }

  constructor(
    polyphony: number = 8,
    ctx?: AudioContext,
    options: Record<string, number> = {}
  ) {
    super('synth', ctx || getAudioContext(), polyphony);

    // Initialize voice pool
    this.#voicePool = new KarplusVoicePool(
      this.context,
      polyphony,
      this.outBus.input
    );
    this.voices = this.#voicePool;

    // Create auxiliary input
    this.#auxInput = new GainNode(this.context);
    this.#voicePool.ins.forEach((input) => this.#auxInput.connect(input));

    this.#isReady = true;
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.messages.onMessage(type, handler);
  }

  play(
    midiNote: number,
    velocity: number = 100,
    modifiers: Partial<PressedModifiers> = {}
  ): this {
    // Release any existing note with same midiNote
    if (this.#midiNoteToId.has(midiNote)) {
      const oldNoteId = this.#midiNoteToId.get(midiNote)!;
      this.#voicePool.noteOff(oldNoteId, 0); // Quick release
    }

    // Assign a voice and play the note
    const noteId = this.#voicePool.noteOn(midiNote, velocity);

    // Store the noteId for this midiNote
    this.#midiNoteToId.set(midiNote, noteId);

    this.sendUpstreamMessage('note:on', { midiNote, velocity, noteId });

    return this;
  }

  release(midiNote: number, modifiers: Partial<PressedModifiers> = {}): this {
    const noteId = this.#midiNoteToId.get(midiNote);
    if (noteId === undefined) {
      console.warn(`Could not release note ${midiNote}`);
      return this;
    }

    this.#voicePool.noteOff(noteId, this.releaseSeconds);
    this.#midiNoteToId.delete(midiNote);

    this.sendUpstreamMessage('note:off', { midiNote });
    return this;
  }

  panic = () => this.stopAll();

  stopAll(): this {
    this.#voicePool.allNotesOff();
    this.#midiNoteToId.clear();
    return this;
  }

  #getLocalStorageKey(paramName: string) {
    return `${paramName}-${this.nodeId}`;
  }

  setParamValue(name: string, value: number, debounceMs = 20): this {
    // Special case for volume, which is a property of the synth, not individual voices
    if (name === 'volume') {
      this.volume = value; // This will set the output bus volume
      return this;
    }
    // other params
    if (debounceMs === 0) {
      this.#setParamValueImmediate(name, value);
    } else {
      const debounced = this.#debouncer.debounce(
        name,
        (val: number) => this.#setParamValueImmediate(name, val),
        debounceMs
      );
      debounced(value);
    }
    return this;
  }

  #setParamValueImmediate(name: string, value: number) {
    this.#voicePool.allVoices.forEach((voice: any) => {
      const param = voice.getParam(name);
      if (param) {
        param.setValueAtTime(value, this.context.currentTime);
      }
      const storageKey = this.#getLocalStorageKey(name);
      localStore.saveValue(storageKey, value);
    });
  }

  getParamValue(name: string) {
    const storageKey = this.#getLocalStorageKey(name);
    return localStore.getValue(storageKey, NaN);
  }

  // connect(destination: AudioNode): this {
  //   this.outBus.connect(destination);
  //   return this;
  // }

  // disconnect(): void {
  //   this.outBus.disconnect();
  // }

  enableKeyboard(): this {
    if (!this.keyboardHandler) {
      this.keyboardHandler = {
        onNoteOn: this.play.bind(this),
        onNoteOff: this.release.bind(this),
        onBlur: this.#onBlur.bind(this),
        onModifierChange: this.#handleModifierKeys.bind(this),
      };
      globalKeyboardInput.addHandler(this.keyboardHandler);
    } else {
      console.debug(`keyboard already enabled`);
    }
    return this;
  }

  disableKeyboard(): this {
    if (this.keyboardHandler) {
      globalKeyboardInput.removeHandler(this.keyboardHandler);
      this.keyboardHandler = null;
    } else {
      console.debug(`keyboard already disabled`);
    }
    return this;
  }

  async enableMIDI(
    midiController = this.midiController,
    channel: number = 0
  ): Promise<this> {
    if (!midiController) {
      midiController = new MidiController();
      await midiController.initialize();
    }
    if (midiController.isInitialized) {
      midiController.connectInstrument(this, channel);
    }
    return this;
  }

  disableMIDI(midiController?: MidiController, channel: number = 0): this {
    midiController?.disconnectInstrument(channel);
    this.midiController?.disconnectInstrument(channel);
    return this;
  }

  #onBlur(): this {
    console.debug('Blur occurred');
    this.stopAll();
    return this;
  }

  #handleModifierKeys(modifiers: PressedModifiers): this {
    // todo: add any modifier key handling here
    return this;
  }

  dispose(): void {
    this.stopAll();
    this.disconnect();

    if (this.keyboardHandler) {
      globalKeyboardInput.removeHandler(this.keyboardHandler);
      this.keyboardHandler = null;
    }

    this.#voicePool.dispose();
    this.#midiNoteToId.clear();
    this.outBus.dispose();
    this.outBus = null as unknown as InstrumentMasterBus;
    this.context = null as unknown as AudioContext;
  }

  /** SETTERS */
  set volume(value: number) {
    this.outBus.volume = value;
  }

  get auxIn() {
    return this.#auxInput;
  }

  get attackSeconds() {
    return localStore.getValue(this.#getLocalStorageKey('attackSeconds'), 0.3);
  }

  set attackTime(timeMs: number) {
    localStore.saveValue(
      this.#getLocalStorageKey('attackSeconds'),
      timeMs / 1000
    );
  }

  get releaseSeconds() {
    return localStore.getValue(this.#getLocalStorageKey('releaseSeconds'), 0.3);
  }

  set releaseTime(timeMs: number) {
    localStore.saveValue(
      this.#getLocalStorageKey('releaseSeconds'),
      timeMs / 1000
    );
  }

  /** GETTERS */
  get now() {
    return this.context.currentTime;
  }

  get volume(): number {
    return this.outBus.volume;
  }

  get isPlaying(): boolean {
    return this.#midiNoteToId.size > 0;
  }

  get activeVoices(): number {
    return this.#midiNoteToId.size;
  }

  get maxVoices(): number {
    return this.#voicePool.allVoices.length;
  }
}
