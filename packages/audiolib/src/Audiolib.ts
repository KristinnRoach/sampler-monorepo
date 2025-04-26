import {
  ensureAudioCtx,
  getAudioContext,
  releaseGlobalAudioContext,
} from '@/context';
import { fetchInitSampleAsAudioBuffer } from './store/assets/asset-utils';
import { idb, initIdb, sampleLib } from './store/persistent/idb';
import { registry } from '@/store/state/worklet-registry/ProcessorRegistry';
import { Sampler, KarplusStrongSynth } from './instruments';
import { assert, tryCatch } from '@/utils';
import { LibNode } from '@/nodes';
import { Message, MessageHandler, createMessageBus } from '@/events';

export class Audiolib implements LibNode {
  readonly nodeId: string = 'audiolib';
  readonly nodeType: string = 'audiolib';
  static #instance: Audiolib | null = null;

  static getInstance(): Audiolib {
    if (!Audiolib.#instance) {
      Audiolib.#instance = new Audiolib();
    }
    return Audiolib.#instance;
  }

  #audioContext: AudioContext | null = null;
  #masterGain: GainNode;
  #samplers: Map<string, Sampler> = new Map();
  #INIT_APP_SAMPLE: AudioBuffer | null = null;
  #messages;

  private constructor() {
    try {
      this.#audioContext = getAudioContext();
      assert(this.#audioContext, 'Failed to get audio context', {
        nodeId: this.nodeId,
      });

      this.#masterGain = this.#audioContext.createGain();
      this.#masterGain.gain.value = 0.5;
      this.#masterGain.connect(this.#audioContext.destination);

      this.#messages = createMessageBus<Message>(this.nodeId);
    } catch (error) {
      console.error('Error during Audiolib construction:', error);
      throw new Error(
        `Failed to initialize Audiolib: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async #validateContext(ctx: AudioContext): Promise<void> {
    try {
      assert(
        ctx === this.#audioContext,
        'Singleton globalAudioContext compromised!',
        { expected: this.#audioContext, received: ctx }
      );

      assert(
        ctx.audioWorklet,
        'Audio worklet not available in this audio context!',
        { context: ctx }
      );
    } catch (error) {
      console.error(
        `Context validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error; // Re-throw to allow callers to handle it
    }
  }

  async init(): Promise<void> {
    try {
      // Ensure audio context is available
      const ctxResult = await tryCatch(
        ensureAudioCtx(),
        'Failed to ensure audio context'
      );
      assert(ctxResult.data, 'Could not initialize audio context', ctxResult);

      await this.#validateContext(ctxResult.data);

      // Initialize indexedDB
      const idbResult = await tryCatch(
        initIdb(),
        'Failed to initialize IndexedDB'
      );
      assert(!idbResult.error, 'IndexedDB initialization failed', idbResult);

      // Fetch initial sample
      const sampleResult = await tryCatch(
        fetchInitSampleAsAudioBuffer(),
        'Failed to fetch initial sample'
      );
      this.#INIT_APP_SAMPLE = sampleResult.data;

      // Register processors
      const processorResult = await tryCatch(
        registry.registerDefaultProcessors(),
        'Failed to register audio processors'
      );
      assert(
        !processorResult.error,
        'Processor registration failed',
        processorResult
      );

      console.log('Audiolib initialized successfully');
    } catch (error) {
      console.error(
        `Audiolib initialization failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new Error(
        `Failed to initialize Audiolib: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  createSampler(
    audioSample?: AudioBuffer,
    polyphony = 16,
    ctx = this.#audioContext
  ): Sampler | null {
    try {
      assert(ctx, 'Audio context is not available', { nodeId: this.nodeId });

      let audioBuffer = audioSample || this.#INIT_APP_SAMPLE;
      assert(audioBuffer, 'No audio buffer available for sampler', {
        providedSample: !!audioSample,
        initSampleAvailable: !!this.#INIT_APP_SAMPLE,
      });

      const newSampler = new Sampler(polyphony, ctx, audioBuffer);
      newSampler.connect(this.#masterGain);
      this.#samplers.set(newSampler.nodeId, newSampler);
      return newSampler;
    } catch (error) {
      console.error(
        `Failed to create sampler: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  createKarplusStrongSynth(polyphony = 8, ctx = this.#audioContext) {
    try {
      assert(ctx, 'Audio context is not available', { nodeId: this.nodeId });

      const newSynth = new KarplusStrongSynth(polyphony);
      newSynth.connect(this.#masterGain);
      return newSynth;
    } catch (error) {
      console.error(
        `Failed to create Karplus Strong synth: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
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

  /** CLEAN UP **/

  dispose(): void {
    try {
      console.debug('Audiolib dispose called');

      for (const sampler of this.#samplers.values()) {
        sampler.dispose();
      }
      this.#samplers.clear();

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
