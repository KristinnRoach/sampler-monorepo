import {
  ensureAudioCtx,
  getAudioContext,
  releaseGlobalAudioContext,
} from '@/context';

import { createNodeId, deleteNodeId, NodeID } from '@/nodes/node-store';
import { assert, tryCatch } from '@/utils';
import { createAsyncInit, InitState } from '@/utils/async-initializable';

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

import { idb, initIdb, sampleLib } from './storage/idb';
import { fetchInitSampleAsAudioBuffer } from './storage/assets/asset-utils';

import { LibInstrument, LibNode, ContainerType } from '@/LibNode';
import { SamplePlayer, KarplusStrongSynth } from './nodes/instruments';
import { Recorder } from '@/nodes/recorder';

import { initProcessors } from './worklets';

import { MidiController } from '@/io';

export class Audiolib implements LibNode {
  readonly nodeId: NodeID;
  readonly nodeType: ContainerType = 'audiolib';
  static #instance: Audiolib | null = null;

  #asyncInit = createAsyncInit<Audiolib>();
  #midiController = new MidiController();

  #audioContext: AudioContext | null = null;
  #masterGain: GainNode; // todo: MasterBus
  #instruments: Map<string, LibInstrument> = new Map();

  #globalAudioRecorder: Recorder | null = null;
  #currentAudioBuffer: AudioBuffer | null = null;

  static getInstance(): Audiolib {
    if (!Audiolib.#instance) {
      Audiolib.#instance = new Audiolib();
    }
    return Audiolib.#instance;
  }

  #messages: MessageBus<Message>;

  private constructor() {
    this.nodeId = createNodeId(this.nodeType);
    this.#messages = createMessageBus<Message>(this.nodeId);

    this.#audioContext = getAudioContext();
    assert(this.#audioContext, 'Failed to get audio context', {
      nodeId: this.nodeId,
    });

    this.#masterGain = this.#audioContext.createGain();
    this.#masterGain.gain.value = 1.0;
    this.#masterGain.connect(this.#audioContext.destination);

    // Replace init method with wrapped version
    this.init = this.#asyncInit.wrapInit(this.#initImpl.bind(this));
  }

  /** TODO: Review initialization approaches and standardize,
   *        is "async-initializable.ts" beneficial to use everywhere
   *        or just redundantly complex ? */

  // Public init method (will be replaced by wrapper)
  init!: () => Promise<Audiolib>;

  // Original implementation moved here
  async #initImpl(): Promise<Audiolib> {
    // Ensure audio context is available
    const ctxResult = await tryCatch(() => ensureAudioCtx());
    assert(!ctxResult.error, 'Could not initialize audio context', ctxResult);
    await this.#validateContext(ctxResult.data);
    const ctx = ctxResult.data;

    // Initialize indexedDB
    const idbResult = await tryCatch(() => initIdb());
    assert(!idbResult.error, 'IndexedDB initialization failed', idbResult);

    // Fetch initial sample
    const sampleResult = await tryCatch(() => fetchInitSampleAsAudioBuffer());
    assert(!sampleResult.error, 'Failed to fetch initial sample');
    this.#currentAudioBuffer = sampleResult.data;

    // Register worklet processors
    const worklResult = await tryCatch(() => initProcessors(ctx));
    console.log('Plugin registration result:', worklResult);
    assert(!worklResult.error, `Failed to register with plugin`, worklResult);

    // Initialize Recorder node
    const recorder = new Recorder(ctx);
    const recResult = await tryCatch(() => recorder.init());
    assert(!recResult.error, `Failed to init Recorder`, recResult);
    this.#globalAudioRecorder = recorder;

    const midiSuccess = await this.initMidiController(); // move ?
    console.debug(`midi initialized? : ${midiSuccess}`);

    // All is well
    console.log('Audiolib initialized successfully');
    return this;
  }

  // Public API for initialization state
  isReady(): boolean {
    return this.#asyncInit.isReady();
  }

  getInitState(): InitState {
    return this.#asyncInit.getState();
  }

  onReady(callback: (instance: Audiolib) => void): () => void {
    const checkAndCall = () => {
      if (this.isReady()) callback(this);
    };

    // Call immediately if already ready
    checkAndCall();

    // Subscribe to future state changes
    return this.#asyncInit.onStateChange(checkAndCall);
  }

  async #validateContext(ctx: AudioContext): Promise<void> {
    assert(
      ctx === this.#audioContext,
      'Singleton globalAudioContext compromised',
      { expected: this.#audioContext, received: ctx }
    );

    assert(ctx.audioWorklet, 'AudioWorklet not available in this context', {
      context: ctx,
    });
  }

  async initMidiController(): Promise<boolean> {
    const result = await tryCatch(() => this.#midiController.initialize());
    assert(!result.error, `Failed to initialize MIDI`);
    return result.data;
  }

  createSamplePlayer(
    ctx = this.#audioContext,
    polyphony = 16,
    audioBuffer?: AudioBuffer
  ): SamplePlayer | null {
    assert(ctx, 'Audio context is not available', { nodeId: this.nodeId });

    let buffer = audioBuffer || this.#currentAudioBuffer;
    assert(buffer, 'No audio buffer available for SamplePlayer', {
      providedSample: !!audioBuffer,
      initSampleAvailable: !!this.#currentAudioBuffer,
    });

    const newSamplePlayer = new SamplePlayer(ctx, polyphony, buffer);
    assert(newSamplePlayer, `Failed to create SamplePlayer`);

    const alreadyLoaded = this.#instruments.has(newSamplePlayer.nodeId);
    assert(
      !alreadyLoaded,
      `SamplePlayer with id: ${newSamplePlayer.nodeId} already loaded`
    );

    newSamplePlayer.connect(this.#masterGain);
    this.#instruments.set(newSamplePlayer.nodeId, newSamplePlayer);

    // monitor levels -> sampler.startLevelMonitoring();
    // add input handling -> sampler.enableKeyboard() and/or sampler.enableMidi()
    // todo: allow calling sampler.enableMidi() without args for client

    return newSamplePlayer;
  }

  createKarplusStrongSynth(polyphony = 8, ctx = this.#audioContext) {
    assert(ctx, 'Audio context is not available', { nodeId: this.nodeId });

    const newSynth = new KarplusStrongSynth(polyphony);
    assert(newSynth, `Failed to create Karplus Strong synth`);

    const alreadyLoaded = this.#instruments.has(newSynth.nodeId);
    assert(
      !alreadyLoaded,
      `Instrument with id: ${newSynth.nodeId} already loaded`
    );

    newSynth.connect(this.#masterGain);
    this.#instruments.set(newSynth.nodeId, newSynth);

    // remove after testing:
    newSynth.enableMIDI(this.#midiController);

    // add input handling -> synth.enableKeyboard()
    // todo: allow calling synth.enableMidi() without args for client

    return newSynth;
  }

  /** Message Bus **/

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any): void {
    this.#messages.sendMessage(type, data);
  }

  /** LibNode methods */
  connect(
    destination?: AudioNode,
    outputIndex?: number,
    inputIndex?: number
  ): this {
    if (destination) {
      this.#masterGain.connect(destination, outputIndex, inputIndex);
    } else {
      // If no destination provided, connect to default destination
      const defaultDestination = this.#audioContext?.destination;
      if (defaultDestination) {
        this.#masterGain.connect(defaultDestination);
      }
    }
    return this;
  }

  disconnect(destination?: AudioNode | null): void {
    if (destination) {
      this.#masterGain.disconnect(destination);
    } else {
      this.#masterGain.disconnect();
    }
  }

  /** LibContainerNode required methods */
  // Todo: change interface or adapt

  add(child: LibNode): this {
    this.nodes.push(child);
    return this;
  }

  remove(child: LibNode): this {
    const index = this.nodes.indexOf(child);
    if (index > -1) {
      this.nodes.splice(index, 1);
    }
    return this;
  }

  get nodes(): LibNode[] {
    return Array.from(this.#instruments.values());
  }

  /** GETTERS & SETTERS **/

  async ensureAudioCtx(): Promise<AudioContext> {
    const result = await tryCatch(
      () => ensureAudioCtx(),
      'Failed to ensure audio context'
    );
    if (result.error) {
      console.error('Could not ensure audio context:', result.error);
      throw result.error;
    }
    return result.data;
  }

  get audioContext(): AudioContext | null {
    if (!this.#audioContext) {
      console.error('Audio context not initialized!');
    }
    return this.#audioContext;
  }

  get now() {
    return getAudioContext().currentTime;
  }

  async recordAudioSample(): Promise<AudioBuffer> {
    assert(this.#globalAudioRecorder, 'Recorder not initialized');
    await this.#globalAudioRecorder.start();
    return this.#globalAudioRecorder.stop();
  }

  // ? this is currently needed to connect Recorder, refactor later for flexibility
  getCurrentSamplePlayer(): SamplePlayer | null {
    // Find the first SamplePlayer instance in the instruments map
    for (const instrument of this.#instruments.values()) {
      if (instrument instanceof SamplePlayer) {
        return instrument;
      }
    }
    return null;
  }

  /** CLEAN UP **/

  dispose(): void {
    try {
      console.debug('Audiolib dispose called');
      for (const instrument of this.#instruments.values()) {
        instrument.dispose();
      }
      this.#instruments.clear();

      if (this.#masterGain) {
        this.#masterGain.disconnect();
        this.#masterGain = null as unknown as GainNode;
      }
      idb.close();
      deleteNodeId(this.nodeId);
      releaseGlobalAudioContext();

      // Explicitly nullify resource-holding fields
      this.#audioContext?.close();
      this.#audioContext = null;
      this.#globalAudioRecorder?.dispose();
      this.#globalAudioRecorder = null;
      this.#currentAudioBuffer = null;

      Audiolib.#instance = null;
    } catch (error) {
      console.error(
        `Error during Audiolib disposal: ${error instanceof Error ? error.message : String(error)}`
      );
      Audiolib.#instance = null;
    }
  }
}

// Old global keyboard input for reffernce - clean up soon:
// enableKeyboard() {
// unnecessary or should just call enable for all instruments ?
//   if (!this.#keyboardHandler) {
//     this.#keyboardHandler = {
//       onNoteOn: this.#onNoteOn.bind(this),
//       onNoteOff: this.#onNoteOff.bind(this),
//       onBlur: this.#onBlur.bind(this),
//       // onCapsToggled: this.#onCapsToggled.bind(this),
//     };
//     globalKeyboardInput.addHandler(this.#keyboardHandler);
//   } else {
//     console.debug(`keyboard already enabled`);
//   }
// }

// disableKeyboard() {
//   if (this.#keyboardHandler) {
//     globalKeyboardInput.removeHandler(this.#keyboardHandler);
//     this.#keyboardHandler = null;
//   } else {
//     console.debug(`keyboard already disabled`);
//   }
// }

// #onNoteOn(
//   midiNote: number,
//   velocity: number = 100, // DEFAULT
//   modifiers: PressedModifiers
// ) {
//   this.#instruments.forEach((s) => s.play(midiNote, velocity, modifiers));
// }

// #onNoteOff(midiNote: number, modifiers: PressedModifiers) {
//   this.#instruments.forEach((s) => s.release(midiNote, modifiers));
// }

// #onBlur() {
//   console.debug('Blur occured');
//   this.#instruments.forEach((s) => s.releaseAll());
// }

// in dispose:
// // Detach keyboard handler
// if (this.#keyboardHandler) {
//   globalKeyboardInput.removeHandler(this.#keyboardHandler);
//   this.#keyboardHandler = null;
// }

// Old SampleInstrument test - remove:
// createSampleInstrument(
//   audioSample?: AudioBuffer,
//   polyphony = 16,
//   ctx = this.#audioContext
// ): SampleInstrument | null {
//   assert(ctx, 'Audio context is not available', { nodeId: this.nodeId });

//   let audioBuffer = audioSample || this.#currentAudioBuffer;
//   assert(audioBuffer, 'No audio buffer available for sampler', {
//     providedSample: !!audioSample,
//     initSampleAvailable: !!this.#currentAudioBuffer,
//   });

//   const options = { polyphony, output: this.#masterGain };

//   const newSampleInstrument = new SampleInstrument(ctx, options);
//   assert(newSampleInstrument, `Failed to create SampleInstrument`);

//   newSampleInstrument.loadSample(audioBuffer);
//   const alreadyLoaded = this.#instruments.has(newSampleInstrument.nodeId);
//   assert(
//     !alreadyLoaded,
//     `Sampler with id: ${newSampleInstrument.nodeId} already loaded`
//   );

//   // newSampleInstrument.connect(this.#masterGain);
//   this.#instruments.set(newSampleInstrument.nodeId, newSampleInstrument);

//   return newSampleInstrument;
// }
