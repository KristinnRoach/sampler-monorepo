import {
  ensureAudioCtx,
  getAudioContext,
  releaseGlobalAudioContext,
} from '@/context';

import { registry } from '@/store/state/worklet-registry/ProcessorRegistry';
import { createNodeId, deleteNodeId } from '@/store/state/IdStore';
import { globalKeyboardInput, InputHandler } from '@/input';
import { assert, tryCatch } from '@/utils';

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';

import { idb, initIdb, sampleLib } from './store/persistent/idb';
import { fetchInitSampleAsAudioBuffer } from './store/assets/asset-utils';

import {
  LibInstrument,
  LibNode,
  LibContainerNode,
  Instrument,
  Container,
} from '@/nodes';
import { Sampler, KarplusStrongSynth } from './instruments';
import { Recorder } from '@/recorder';

let globalLoopState: boolean = false;

export class Audiolib implements LibContainerNode {
  readonly nodeId: NodeID;
  readonly nodeType: Container = 'audiolib';
  static #instance: Audiolib | null = null;

  static getInstance(): Audiolib {
    if (!Audiolib.#instance) {
      Audiolib.#instance = new Audiolib();
    }
    return Audiolib.#instance;
  }

  #audioContext: AudioContext | null = null;
  #masterGain: GainNode;
  #instruments: Map<string, LibInstrument> = new Map();
  #globalAudioRecorder: Recorder | null = null;
  #currentAudioBuffer: AudioBuffer | null = null; // move

  #keyboardHandler: InputHandler | null = null;
  #messages: MessageBus<Message>;
  #isInitialized: boolean = false;

  private constructor() {
    this.nodeId = createNodeId(this.nodeType);

    this.#messages = createMessageBus<Message>(this.nodeId);
    assert(this.#messages, `Failed to create message bus for Audiolib class`);

    this.#audioContext = getAudioContext();
    assert(this.#audioContext, 'Failed to get audio context', {
      nodeId: this.nodeId,
    });

    this.#masterGain = this.#audioContext.createGain();
    this.#masterGain.gain.value = 0.5;
    this.#masterGain.connect(this.#audioContext.destination);
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

  async init(): Promise<Audiolib> {
    if (this.#isInitialized) {
      console.debug(`Audiolib already initialized`);
      return this;
    }
    // Ensure audio context is available
    const ctxResult = await tryCatch(ensureAudioCtx());
    assert(ctxResult.data, 'Could not initialize audio context', ctxResult);
    await this.#validateContext(ctxResult.data);
    const ctx = ctxResult.data;

    // Initialize indexedDB
    const idbResult = await tryCatch(initIdb());
    assert(!idbResult.error, 'IndexedDB initialization failed', idbResult);

    // Fetch initial sample
    const sampleResult = await tryCatch(fetchInitSampleAsAudioBuffer());
    assert(!sampleResult.error, 'Failed to fetch initial sample');
    this.#currentAudioBuffer = sampleResult.data;

    // Register processors
    const processorResult = await tryCatch(
      registry.registerDefaultProcessors()
    );
    assert(
      !processorResult.error,
      'Processor registration failed',
      processorResult
    );

    // Initialize Recorder node
    const recorder = new Recorder(ctx);
    const recResult = await tryCatch(recorder.init());
    assert(!recResult.error, `Failed to init Recorder`, recResult);
    this.#globalAudioRecorder = recorder;

    // All is well
    console.log('Audiolib initialized successfully');
    this.#isInitialized = true;
    return this;
  }

  createSampler(
    audioSample?: AudioBuffer,
    polyphony = 16,
    ctx = this.#audioContext
  ): Sampler | null {
    assert(ctx, 'Audio context is not available', { nodeId: this.nodeId });

    let audioBuffer = audioSample || this.#currentAudioBuffer;
    assert(audioBuffer, 'No audio buffer available for sampler', {
      providedSample: !!audioSample,
      initSampleAvailable: !!this.#currentAudioBuffer,
    });

    const newSampler = new Sampler(polyphony, ctx, audioBuffer);
    assert(newSampler, `Failed to create Sampler`);

    const alreadyLoaded = this.#instruments.has(newSampler.nodeId);
    assert(
      !alreadyLoaded,
      `Sampler with id: ${newSampler.nodeId} already loaded`
    );

    newSampler.connect(this.#masterGain);
    this.#instruments.set(newSampler.nodeId, newSampler);

    return newSampler;
  }

  createKarplusStrongSynth(polyphony = 8, ctx = this.#audioContext) {
    assert(ctx, 'Audio context is not available', { nodeId: this.nodeId });

    const newSynth = new KarplusStrongSynth(polyphony);
    assert(newSynth, `Failed to create Karplus Strong synth`);

    const alreadyLoaded = this.#instruments.has(newSynth.nodeId);
    assert(
      !alreadyLoaded,
      `Sampler with id: ${newSynth.nodeId} already loaded`
    );

    newSynth.connect(this.#masterGain);
    this.#instruments.set(newSynth.nodeId, newSynth);

    return newSynth;
  }

  #onNoteOn(midiNote: number, modifiers: TODO, velocity?: number) {
    this.#instruments.forEach((s) => s.play(midiNote, modifiers, velocity));
  }

  #onNoteOff(midiNote: number, modifiers: TODO) {
    this.#instruments.forEach((s) => s.release(midiNote, modifiers));
  }

  #onBlur() {
    console.debug('Blur occured');
    this.#instruments.forEach((s) => s.releaseAll());
  }

  enableKeyboard() {
    if (!this.#keyboardHandler) {
      this.#keyboardHandler = {
        onNoteOn: this.#onNoteOn.bind(this),
        onNoteOff: this.#onNoteOff.bind(this),
        onBlur: this.#onBlur.bind(this),
        // onCapsToggled: this.#onCapsToggled.bind(this),
      };
      globalKeyboardInput.addHandler(this.#keyboardHandler);
    } else {
      console.debug(`keyboard already enabled`);
    }
  }

  disableKeyboard() {
    if (this.#keyboardHandler) {
      globalKeyboardInput.removeHandler(this.#keyboardHandler);
      this.#keyboardHandler = null;
    } else {
      console.debug(`keyboard already disabled`);
    }
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
    destination: AudioNode | null,
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
    // this.nodes.push(child);
    return this;
  }

  remove(child: LibNode): this {
    // Todo
    // const index = this.nodes.indexOf(child);
    // if (index > -1) {
    //   this.nodes.splice(index, 1);
    // }
    return this;
  }

  get nodes(): LibNode[] {
    return Array.from(this.#instruments.values());
  }

  /** GETTERS & SETTERS **/

  async ensureAudioCtx(): Promise<AudioContext> {
    const result = await tryCatch(
      ensureAudioCtx(),
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

  // Add this method to get the current sampler
  getCurrentSampler(): Sampler | null {
    // Find the first Sampler instance in the instruments map
    for (const instrument of this.#instruments.values()) {
      if (instrument instanceof Sampler) {
        return instrument;
      }
    }
    return null;
  }

  /** CLEAN UP **/

  dispose(): void {
    try {
      console.debug('Audiolib dispose called');

      for (const sampler of this.#instruments.values()) {
        sampler.dispose();
      }
      this.#instruments.clear();

      if (this.#masterGain) {
        this.#masterGain.disconnect();
        this.#masterGain = null as unknown as GainNode;
      }

      // Release global resources
      releaseGlobalAudioContext();
      registry.dispose();
      idb.close();

      Audiolib.#instance = null;
    } catch (error) {
      console.error(
        `Error during Audiolib disposal: ${error instanceof Error ? error.message : String(error)}`
      );
      Audiolib.#instance = null;
    }
  }
}

// #onCapsToggled(capsOn: boolean, modifiers: TODO) {
//   if (globalLoopState !== capsOn) {
//     console.log('Audiolib mod.caps ENABLED: ', capsOn);

//     globalLoopState = capsOn;
//     this.#instruments.forEach((s) => s.onGlobalLoopToggle(capsOn));
//   }
// }
