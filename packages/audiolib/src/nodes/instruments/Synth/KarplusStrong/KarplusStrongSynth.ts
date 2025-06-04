import {
  LibInstrument,
  InstrumentType,
} from '@/nodes/instruments/LibInstrument';
import { ParamDescriptor, LibParam } from '@/nodes/params';
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
    this.#voicePool.auxIn = this.#auxInput;

    // Register parameters
    // this.#registerParameters();

    this.#isReady = true;
  }

  // #registerParameters(): void {
  //   // Register common parameters
  //   // For KarplusStrongSynth, we might need to create LibParam wrappers
  //   // for parameters that are currently handled differently

  //   // Example of registering a parameter with a custom descriptor
  //   const decayDescriptor: ParamDescriptor = {
  //     nodeId: 'decay',
  //     name: 'decay',
  //     valueType: 'number',
  //     minValue: 0.01,
  //     maxValue: 0.99,
  //     defaultValue: 0.5,
  //     group: 'envelope',
  //   };

  //   // Create a LibParam for decay
  //   const decayParam: LibParam = {
  //     nodeId: 'decay',
  //     nodeType: 'param',
  //     isReady: true,
  //     descriptor: decayDescriptor,
  //     getValue: () => this.getStoredParamValue('decay', 0.5),
  //     setValue: (value: number) => {
  //       this.#voicePool.allVoices.forEach((voice) => {
  //         const param = voice.getParam('decay');
  //         if (param) {
  //           param.setValueAtTime(value, this.context.currentTime);
  //         }
  //       });
  //       this.storeParamValue('decay', value);
  //     },
  //     onMessage: () => () => {}, // No-op implementation
  //     dispose: () => {},
  //   };

  //   this.params.register(decayParam);

  //   // Similarly register other parameters
  //   // ...
  // }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.messages.onMessage(type, handler);
  }

  play(
    midiNote: number,
    velocity: number = 100,
    modifiers: Partial<PressedModifiers> = {}
  ): number {
    // Changed return type from 'this' to 'number'
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

    return noteId; // Return the noteId instead of 'this'
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

  // #getLocalStorageKey(paramName: string) {
  //   return `${paramName}-${this.nodeId}`;
  // }

  // setParamValue(paramId: string, value: number, debounceMs = 20): this {
  //   // Special case for volume, which is a property of the synth
  //   if (paramId === 'volume') {
  //     this.volume = value;
  //     return this;
  //   }

  //   // Use the base class implementation with debouncing
  //   if (debounceMs <= 0) {
  //     super.setParamValue(paramId, value, 0);
  //   } else {
  //     const debounced = this.#debouncer.debounce(
  //       paramId,
  //       (val: number) => super.setParamValue(paramId, val, 0),
  //       debounceMs
  //     );
  //     debounced(value);
  //   }

  //   return this;
  // }

  setParameterValue(name: string, value: number, debounceMs = 20): this {
    const executeSet = () => {
      switch (name) {
        case 'volume':
          this.volume = value;
          this.storeParamValue('volume', value);
          break;
        case 'decay':
          this.#voicePool.allVoices.forEach((voice) => {
            const param = voice.getParam('decay');
            if (param) {
              param.setValueAtTime(value, this.context.currentTime);
            }
          });
          this.storeParamValue('decay', value);
          break;
        case 'noiseTime':
          this.#voicePool.allVoices.forEach((voice) => {
            const param = voice.getParam('noiseTime');
            if (param) {
              param.setValueAtTime(value, this.context.currentTime);
            }
          });
          this.storeParamValue('noiseTime', value);
          break;
        default:
          console.warn(`Unknown parameter: ${name}`);
          this.storeParamValue(name, value);
      }
    };

    if (debounceMs <= 0) {
      executeSet();
    } else {
      const debounced = this.#debouncer.debounce(name, executeSet, debounceMs);
      debounced();
    }

    return this;
  }

  // getParamValue(paramId: string): any {
  //   return (
  //     super.getParamValue(paramId) || this.getStoredParamValue(paramId, NaN)
  //   );
  // }

  getParamValue(paramId: string): any {
    return this.getStoredParamValue(paramId, NaN);
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

  get attackSeconds(): number {
    return this.getStoredParamValue('attackSeconds', 0.3);
  }

  set attackTime(timeMs: number) {
    this.storeParamValue('attackSeconds', timeMs / 1000);
  }

  get releaseSeconds(): number {
    return this.getStoredParamValue('releaseSeconds', 0.3);
  }

  set releaseTime(timeMs: number) {
    this.storeParamValue('releaseSeconds', timeMs / 1000);
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
