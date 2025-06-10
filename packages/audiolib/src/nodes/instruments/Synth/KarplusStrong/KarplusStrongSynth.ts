import { LibInstrument } from '@/nodes/instruments/LibInstrument';
import { ParamDescriptor } from '@/nodes/params';
import type { MidiValue, ActiveNoteId } from '@/nodes/instruments/types';
import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';
import { KarplusVoicePool } from './KarplusVoicePool';
import { getAudioContext } from '@/context';
import { Message, MessageHandler } from '@/events';
import { MidiController, PressedModifiers } from '@/io';
import { globalKeyboardInput } from '@/io';
import { Debouncer } from '@/utils/Debouncer';
import { normalizeRange, cancelScheduledParamValues } from '@/utils';

export class KarplusStrongSynth extends LibInstrument {
  // KarplusStrongSynth-specific private # fields
  #auxInput: GainNode;
  #pool: KarplusVoicePool;
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
    this.#pool = new KarplusVoicePool(
      this.context,
      polyphony,
      this.outBus.input
    );
    this.voices = this.#pool;

    // Create auxiliary input
    this.#auxInput = new GainNode(this.context);
    this.#pool.auxIn = this.#auxInput;

    // Load stored parameter values
    this.setParameterValue('volume', this.getStoredParamValue('volume', 1));
    this.setParameterValue('attack', this.getStoredParamValue('attack', 0.01));
    this.setParameterValue('decay', this.getStoredParamValue('decay', 0.9));
    this.setParameterValue(
      'noiseTime',
      this.getStoredParamValue('noiseTime', 0.1)
    );

    this.#isReady = true;
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.messages.onMessage(type, handler);
  }

  play(
    // returns noteId, which is currently just the midi note
    midiNote: MidiValue,
    velocity: number = 100,
    modifiers: Partial<PressedModifiers> = {}
  ): ActiveNoteId {
    // ActiveNoteId vs MidiValue / midiNote
    // Release any existing note with same midiNote
    if (this.#midiNoteToId.has(midiNote)) {
      const oldNoteId = this.#midiNoteToId.get(midiNote)!;
      this.#pool.noteOff(oldNoteId, 0); // Quick release
    }

    // Assign a voice and play the note
    const noteId = this.#pool.noteOn(midiNote, velocity);

    // Store the noteId for this midiNote
    this.#midiNoteToId.set(midiNote, noteId);

    this.sendUpstreamMessage('note:on', { midiNote, velocity, noteId });

    return noteId;
  }

  release(midiNote: number, modifiers: Partial<PressedModifiers> = {}): this {
    const noteId = this.#midiNoteToId.get(midiNote);
    if (noteId === undefined) {
      console.warn(`Could not release note ${midiNote}`);
      return this;
    }

    this.#pool.noteOff(noteId, this.decaySeconds);
    this.#midiNoteToId.delete(midiNote);

    this.sendUpstreamMessage('note:off', { midiNote });
    return this;
  }

  panic = (fadeOut_sec?: number) => this.releaseAll(fadeOut_sec);

  releaseAll(fadeOut_sec?: number): this {
    // todo: use "fadeOut_sec"
    console.debug(
      `todo: implement fade out. 
      Curr fadeout value is ${fadeOut_sec}`
    );
    this.stopAll();
    return this;
  }

  stopAll(): this {
    this.#pool.allNotesOff();
    this.#midiNoteToId.clear();
    return this;
  }

  // setParameterValue(name: string, value: number, debounceMs = 20): this {
  setParameterValue(name: string, value: number): this {
    const executeSet = () => {
      switch (name) {
        case 'volume':
          this.volume = value;
          this.storeParamValue('volume', value);
          break;

        case 'attack':
          this.#pool.allVoices.forEach((voice) => {
            voice.attack = value;
          });
          const useableAttack = normalizeRange(value, 0, 1, 0.1, 1);
          this.storeParamValue('attack', useableAttack);
          break;

        case 'decay':
          this.#pool.allVoices.forEach((voice) => {
            const param = voice.getParam('decay');
            if (param) {
              const useableDecay = normalizeRange(value, 0, 1, 0.35, 0.995);
              param.setValueAtTime(useableDecay, this.context.currentTime);
            }
          });
          this.storeParamValue('decay', value);
          break;

        case 'noiseTime':
          this.#pool.allVoices.forEach((voice) => {
            const param = voice.getParam('noiseTime');
            if (param) {
              const useableNoiseTime = normalizeRange(value, 0.0, 1, 0.1, 0.99);
              param.setValueAtTime(useableNoiseTime, this.context.currentTime);
            }
          });
          this.storeParamValue('noiseTime', value);
          break;

        default:
          console.warn(`Unknown parameter: ${name}`);
      }
    };

    // if (debounceMs <= 0) {
    //   executeSet();
    // } else {
    //   const debounced = this.#debouncer.debounce(name, executeSet, debounceMs);
    //   debounced();
    // }
    // todo: remove comment above or make debouncing of params consistent for all LibInstruments
    // for now let's just:
    executeSet();

    return this;
  }

  getParameterValue(name: string): number | undefined {
    switch (name) {
      case 'volume':
        return this.volume;
      case 'attack':
        return this.getStoredParamValue('attack', 0.01);
      case 'decay':
        return this.getStoredParamValue('decay', 0.9);
      case 'noiseTime':
        return this.getStoredParamValue('noiseTime', 0.1);
      default:
        console.warn(`Unknown parameter: ${name}`);
        return undefined;
    }
  }
  // could also be simplified to something like:
  // getParamValue(paramId: string): any {
  //   return this.getStoredParamValue(paramId, NaN);
  // }

  // TODO: review and standardize these param descriptors, this was added as quick placeholders to align the interfaces
  getParameterDescriptors(): Record<string, ParamDescriptor> {
    return {
      volume: {
        nodeId: `${this.nodeId}-volume`,
        name: 'Volume',
        valueType: 'number',
        defaultValue: 0.5,
        minValue: 0,
        maxValue: 2,
        group: 'output',
      },
      attack: {
        nodeId: `${this.nodeId}-attack`,
        name: 'Attack',
        valueType: 'number',
        defaultValue: 0.01,
        minValue: 0,
        maxValue: 2,
        group: 'envelope',
      },
      decay: {
        nodeId: `${this.nodeId}-decay`,
        name: 'Decay',
        valueType: 'number',
        defaultValue: 0.9,
        minValue: 0,
        maxValue: 5,
        group: 'envelope',
      },
      noiseTime: {
        nodeId: `${this.nodeId}-noiseTime`,
        name: 'Noise Time',
        valueType: 'number',
        defaultValue: 0.1,
        minValue: 0,
        maxValue: 1,
        group: 'synthesis',
      },
    };
  }

  enableKeyboard(): this {
    if (!this.keyboardHandler) {
      this.keyboardHandler = {
        onNoteOn: this.play.bind(this),
        onNoteOff: this.release.bind(this),
        onBlur: this.#onBlur.bind(this),
        onModifierChange: this.#handleModifierKeys.bind(this),
      };
      globalKeyboardInput.addHandler(this.keyboardHandler);
    }
    console.info(`Karplus-strong synth: keyboard enabled`);
    return this;
  }

  disableKeyboard(): this {
    if (this.keyboardHandler) {
      globalKeyboardInput.removeHandler(this.keyboardHandler);
      this.keyboardHandler = null;
    }
    console.info(`Karplus-strong synth: keyboard disabled`);
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
      console.info(`Karplus-strong synth: MIDI enabled`);
    }
    return this;
  }

  disableMIDI(midiController?: MidiController, channel: number = 0): this {
    midiController?.disconnectInstrument(channel);
    this.midiController?.disconnectInstrument(channel);
    console.info(`Karplus-strong synth: MIDI disabled`);
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

    this.#pool.dispose();
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

  // todo: align with samplePlayer's param getters / setters naming convention
  get attackSeconds(): number {
    return this.getStoredParamValue('attack', 0.3);
  }

  set attackTime(timeMs: number) {
    this.storeParamValue('attack', timeMs / 1000);
  }

  get decaySeconds(): number {
    return this.getStoredParamValue('decay', 0.3);
  }

  set decayTime(timeMs: number) {
    this.storeParamValue('decay', timeMs / 1000);
  }

  // TODO: Standardize filters
  // todo: test optimal safe values and move to constants
  SET_TARGET_TIMECONSTANT = 0.05; // 50ms
  #lastHpfUpdateTime = 0;
  #lastLpfUpdateTime = 0;
  #minFilterUpdateInterval = 0.05; // 50ms minimum between updates

  setHpfCutoff(hz: number): this {
    // if (!this.#pool.filtersEnabled) return this;
    if (isNaN(hz) || !isFinite(hz)) {
      console.warn(`Invalid LPF frequency: ${hz}`);
      return this;
    }

    const currentTime = this.now;
    if (currentTime - this.#lastHpfUpdateTime < this.#minFilterUpdateInterval) {
      return this;
    }

    this.storeParamValue('karplus:hpfCutoff', hz);
    this.#pool.applyToAllVoices((voice) => voice.setParam('hpf', hz));

    this.#lastHpfUpdateTime = currentTime;

    return this;
  }

  setLpfCutoff(hz: number): this {
    // if (!this.#pool.filtersEnabled) return this;
    const maxFilterFreq = this.context.sampleRate / 1 - 100;

    // Ensure the frequency is a valid number and within safe range
    if (isNaN(hz) || !isFinite(hz)) {
      console.warn(`Invalid LPF frequency: ${hz}`);
      return this;
    }

    const safeValue = Math.max(20, Math.min(hz, maxFilterFreq));
    this.storeParamValue('karplus:lpfCutoff', safeValue);

    const currentTime = this.now;
    if (currentTime - this.#lastLpfUpdateTime < this.#minFilterUpdateInterval) {
      return this;
    }

    this.#pool.applyToAllVoices((voice) => {
      if (!voice.lpf) return;

      cancelScheduledParamValues(voice.lpf.frequency, currentTime);
      // voice.lpf.frequency.cancelScheduledValues(currentTime);
      // const currentValue = voice.lpf.frequency.defaultValue;
      // voice.lpf.frequency.setValueAtTime(
      //   voice.lpf.frequency.value,
      //   currentTime
      // );
      voice.lpf.frequency.setTargetAtTime(
        safeValue,
        currentTime,
        this.SET_TARGET_TIMECONSTANT
      );
    });

    this.#lastLpfUpdateTime = currentTime;

    return this;
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
    return this.#pool.allVoices.length;
  }
}

// connect(destination: AudioNode): this {
//   this.outBus.connect(destination);
//   return this;
// }

// disconnect(): void {
//   this.outBus.disconnect();
// }

// Register parameters
// this.#registerParameters();
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
