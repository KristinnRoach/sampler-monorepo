import {
  LibInstrument,
  InstrumentType,
  Messenger,
  LibAudioNode,
} from '@/nodes/LibNode';
import { KarplusVoicePool } from './KarplusVoicePool';
import { createNodeId, NodeID } from '@/nodes/node-store';
import { ensureAudioCtx, getAudioContext } from '@/context';
import {
  Message,
  MessageBus,
  MessageHandler,
  createMessageBus,
} from '@/events';

import {
  MidiController,
  globalKeyboardInput,
  InputHandler,
  PressedModifiers,
} from '@/io';

import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';
import { Debouncer } from '@/utils/Debouncer';
import { localStore } from '@/storage/local';

export class KarplusStrongSynth implements LibInstrument, Messenger {
  readonly nodeId: NodeID;
  readonly nodeType: InstrumentType = 'synth';

  #context: AudioContext;
  #output: InstrumentMasterBus;
  #auxInput: GainNode;
  #voicePool: KarplusVoicePool;
  #messages: MessageBus<Message>;

  #keyboardHandler: InputHandler | null = null;
  #midiController: MidiController | null = null;
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
    this.nodeId = createNodeId(this.nodeType);
    this.#messages = createMessageBus<Message>(this.nodeId);

    this.#context = ctx || getAudioContext(); // || ensureAudioCtx()
    this.#output = new InstrumentMasterBus();

    this.#voicePool = new KarplusVoicePool(
      this.#context,
      polyphony,
      this.#output.input
    );

    // TEST
    this.#auxInput = new GainNode(this.#context);
    this.#voicePool.ins.forEach((input) => this.#auxInput.connect(input));

    this.#isReady = true;
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  protected sendUpstreamMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
    return this;
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
    // const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

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
        param.setValueAtTime(value, this.#context.currentTime);
      }
      const storageKey = this.#getLocalStorageKey(name);
      localStore.saveValue(storageKey, value);
    });
  }

  getParamValue(name: string) {
    const storageKey = this.#getLocalStorageKey(name);
    return localStore.getValue(storageKey, NaN);
  }

  connect(destination: AudioNode): this {
    // | LibAudioNode
    this.#output.connect(destination);
    return this;
  }

  disconnect(): void {
    this.#output.disconnect();
  }

  enableKeyboard(): this {
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

  disableKeyboard(): this {
    if (this.#keyboardHandler) {
      globalKeyboardInput.removeHandler(this.#keyboardHandler);
      this.#keyboardHandler = null;
    } else {
      console.debug(`keyboard already disabled`);
    }
    return this;
  }

  async enableMIDI(
    midiController = this.#midiController, // todo: u know
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
    // todo: u know
    midiController?.disconnectInstrument(channel);
    this.#midiController?.disconnectInstrument(channel);

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
    // ? localStore.remove() needed ?
    if (this.#keyboardHandler) {
      globalKeyboardInput.removeHandler(this.#keyboardHandler);
      this.#keyboardHandler = null;
    }
    this.#voicePool.dispose();
    this.#midiNoteToId.clear();
    this.#output.dispose();
    this.#output = null as unknown as InstrumentMasterBus;
    this.#context = null as unknown as AudioContext;
  }

  /** SETTERS */
  set volume(value: number) {
    this.#output.volume = value;
  }

  // set auxInput(stream: AudioNode) {
  //   this.#voicePool.auxIn = stream;
  // }

  get auxIn() {
    return this.#auxInput; // auxIn;
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

  get context() {
    return this.#context;
  }

  get now() {
    return getAudioContext().currentTime;
  }

  get volume(): number {
    return this.#output.volume;
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
