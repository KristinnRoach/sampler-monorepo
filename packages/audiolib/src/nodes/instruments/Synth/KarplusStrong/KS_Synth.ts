import { LibInstrument, InstrumentType } from '@/LibNode';
import { KarplusVoice } from '@/nodes/instruments/Synth/KarplusStrong/KS_Voice';
import { Pool } from '@/nodes/helpers/collections/Pool';
import { createNodeId, NodeID } from '@/nodes/node-store';
import { getAudioContext } from '@/context';
import { Message, MessageHandler, createMessageBus } from '@/events';
import { PressedModifiers } from '@/input/types';
import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';
import { Debouncer } from '@/utils/Debouncer';
import { localStore } from '@/storage/local';

// temp
type KSS_ParamName = 'volume' | 'attackTime' | 'releaseTime';

export class KarplusStrongSynth implements LibInstrument {
  readonly nodeId: NodeID;
  readonly nodeType: InstrumentType = 'synth';

  #context: AudioContext;
  #output: InstrumentMasterBus;
  #voicePool: Pool<KarplusVoice>;
  #messages;

  #activeNotes = new Map<number, Set<KarplusVoice>>();

  // use the paramMap in the Voice class for the actual setting of AudioParams.. i think
  // #audioParams: Record<KSS_ParamName, AudioParam>;

  #debouncer: Debouncer = new Debouncer();

  // Moving this to Debouncer
  // #debounceMs: number;
  // #debounceTimers: Partial<
  //   Record<KSS_ParamName, ReturnType<typeof setTimeout>>
  // > = {};

  // Moving this to localStorage for now (too slow?)
  // #currentValues: Record<KSS_ParamName, number> = {
  //   attackTime: 0.001,
  //   releaseTime: 0.3,
  //   // Todo: actual dynamics handling, temp fix for now:
  //   volume: 0.2,
  // };

  constructor(polyphony: number = 8, options: Record<string, number> = {}) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = getAudioContext();
    this.#output = new InstrumentMasterBus();

    this.#messages = createMessageBus<Message>(this.nodeId);
    this.#voicePool = new Pool<KarplusVoice>();

    this.#preCreateVoices(polyphony);
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any): void {
    this.#messages.sendMessage(type, data);
  }

  #preCreateVoices(polyphony: number): void {
    for (let i = 0; i < polyphony; i++) {
      const voice = new KarplusVoice();
      voice.connect(this.#output.input);
      this.#voicePool.add(voice);
    }
  }

  play(
    midiNote: number,
    velocity: number = 100,
    modifiers: Partial<PressedModifiers> = {}
  ): this {
    const voice = this.#voicePool.allocateNode();
    if (!voice) return this;

    // Trigger note first
    voice.trigger({ midiNote, velocity });

    this.sendMessage('note:on', { midiNote, velocity });

    // Bookkeeping
    if (!this.#activeNotes.has(midiNote)) {
      this.#activeNotes.set(midiNote, new Set());
    }
    this.#activeNotes.get(midiNote)!.add(voice);

    voice.onMessage('voice:ended', () => {
      const noteSet = this.#activeNotes.get(midiNote);
      if (noteSet) {
        noteSet.delete(voice);
        if (noteSet.size === 0) {
          this.#activeNotes.delete(midiNote);
        }
      }
      this.sendMessage('voice:ended', { midiNote });
    });

    return this;
  }

  release(midiNote: number, modifiers: Partial<PressedModifiers> = {}): this {
    const voices = this.#activeNotes.get(midiNote);
    if (!voices || voices.size === 0) {
      console.warn(`Could not release note ${midiNote}`);
      return this;
    }

    voices.forEach((voice) => {
      voice.release(this.releaseSeconds);
    });

    this.sendMessage('note:off', { midiNote });
    return this;
  }

  stopAll(): this {
    this.#activeNotes.forEach((voices, midiNote) => {
      voices.forEach((voice) => {
        voice.release(this.releaseSeconds);
      });
    });
    this.#activeNotes.clear();
    return this;
  }

  releaseAll(): this {
    return this.stopAll();
  }

  #getLocalStorageKey(paramName: string) {
    return `${paramName}-${this.nodeId}`;
  }

  #setParamValueImmediate(name: string, value: number) {
    this.#voicePool.nodes.forEach((voice: any) => {
      const param = voice.getParam(name);
      if (param) {
        param.setValueAtTime(value, this.#context.currentTime);
      }
      const storageKey = this.#getLocalStorageKey(name);
      localStore.saveValue(storageKey, value);
    });
  }

  // ! Rethink default debounce-ing for non-gliding params (only debounce the storage?)
  setParamValue(name: string, value: number, debounceMs = 20): this {
    if (debounceMs === 0) {
      this.#setParamValueImmediate(name, value);
    } else {
      // Get a debounced version for this param name
      const debounced = this.#debouncer.debounce(
        name,
        (val: number) => this.#setParamValueImmediate(name, val),
        debounceMs
      );
      debounced(value);
    }
    return this;
  }

  getParamValue(name: string): number | null {
    const firstVoice = this.#voicePool.nodes[0];
    if (firstVoice) {
      const param = firstVoice.getParam(name);
      return param ? param.value : null;
    }
    return null;
  }

  onGlobalLoopToggle(): this {
    // TODO: loop not implemented yet
    // this.setLoopEnabled(!this.loopEnabled);
    return this;
  }

  connect(destination: AudioNode): this {
    this.#output.connect(destination);
    return this;
  }

  disconnect(): void {
    this.#output.disconnect();
  }

  dispose(): void {
    this.stopAll();
    this.disconnect();

    // ? localStore.remove() needed ?

    this.#voicePool.dispose();
    this.#activeNotes.clear();

    this.#output.dispose();
    this.#output = null as unknown as InstrumentMasterBus;
    this.#context = null as unknown as AudioContext;
  }

  /** SETTERS */
  set volume(value: number) {
    this.#output.volume = value;
  }

  get attackSeconds() {
    return localStore.getValue(this.#getLocalStorageKey('attackSeconds'), 0.3);
  }

  // todo: check ms vs seconds everywhere for consistency
  set attackTime(timeMs: number) {
    localStore.saveValue(
      this.#getLocalStorageKey('attackSeconds'),
      timeMs * 1000
    );
  }

  get releaseSeconds() {
    return localStore.getValue(this.#getLocalStorageKey('releaseSeconds'), 0.3);
  }

  set releaseTime(timeMs: number) {
    localStore.saveValue(
      this.#getLocalStorageKey('releaseSeconds'),
      timeMs * 1000
    );
  }

  /** GETTERS */
  get now() {
    return getAudioContext().currentTime;
  }

  get volume(): number {
    return this.#output.volume;
  }

  get isPlaying(): boolean {
    return this.#activeNotes.size > 0;
  }

  get activeVoices(): number {
    return Array.from(this.#activeNotes.values()).reduce(
      (sum, voices) => sum + voices.size,
      0
    );
  }

  get maxVoices(): number {
    return this.#voicePool.nodes.length;
  }
}
