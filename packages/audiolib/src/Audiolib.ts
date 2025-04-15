import {
  ensureAudioCtx,
  getAudioContext,
  releaseGlobalAudioContext,
} from '@/context';
import { idb, initIdb, sampleLib } from './store/persistent/idb';
import { AudiolibProcessor, registry } from '@/processors/ProcessorRegistry';
import { LibNode } from '@/abstract/baseClasses/LibNode';
import { SourceWorkletNode } from '@/nodes/source/SourceCleanupSingle/SourceWorkletNode';
import SourceProcessorRaw from '@/processors/source/source-processor?raw';

export class Audiolib extends LibNode {
  static #instance: Audiolib | null = null;

  static getInstance(): Audiolib {
    if (!Audiolib.#instance) {
      Audiolib.#instance = new Audiolib();
    }
    return Audiolib.#instance;
  }

  #audioContext: AudioContext | null = null;
  #masterGain: GainNode;

  #polyphony: number = 8;
  #sourcePool: SourceWorkletNode[] = [];
  #defaultSample: { sampleId: string; audioData: AudioBuffer } | null = null; // todo: use (App)Sample type

  private constructor() {
    super();
    console.log(`Audiolib constructor. Instance nodeId: ${this.nodeId}.`);
    this.#audioContext = getAudioContext();
    this.#masterGain = this.#audioContext.createGain();
    this.#masterGain.gain.value = 0.5;
    this.#masterGain.connect(this.#audioContext.destination);
  }

  async init(): Promise<void> {
    // registerDefaultProcessors now or later
    console.debug(`Audiolib init - context: ${this.#audioContext}`);
    console.debug(`${this.#audioContext?.state}`);

    await initIdb();
    console.debug('initialized IndexedDB', { idb });

    await this.refreshLatestSample();
  }

  async refreshLatestSample(): Promise<void> {
    const appSample = await sampleLib.getLatestSample();
    if (appSample?.audioData instanceof AudioBuffer && appSample?.sampleId) {
      this.#defaultSample = {
        audioData: appSample.audioData,
        sampleId: appSample.sampleId,
      };
      const id = appSample.sampleId;
      const data = appSample.audioData;
      console.log(
        `Refreshed sample id: ${id}, buff duration: ${data.duration}`
      );
    } else {
      console.error('Could not refresh sample, got this from db: ', appSample);
    }
  }

  testPlayUsingAudioBufferSourceNode() {
    const buffer = this.#defaultSample?.audioData;
    if (!buffer) return;
    const src = this.#audioContext?.createBufferSource();
    if (!src) return;
    src.buffer = buffer;
    const dest = this.#audioContext?.destination;
    if (!dest) return;

    src.connect(this.#masterGain);
    this.#masterGain.connect(dest);
    src.start();

    console.warn('SHOULD BE PLAYING - ABSN test');
  }

  async createSourceNode(props?: {
    context?: AudioContext;
    processorName?: AudiolibProcessor | string;
    audioData?: AudioBuffer | Float32Array[]; // | Float32Array[][]

    // sampleId?: string; //  !? einfalda þangað til skil options
    // numberOfInputs?: number;
    // numberOfOutputs?: number;
    // outputChannelCount?: number | ArrayLike<number>; // ? sequence<unsigned long> // dictionary types from w3.org
    // parameterData?: Record<string, number>; // ? record<DOMString, double>
    // processorOptions?: {}; // ? object
  }): Promise<SourceWorkletNode | null> {
    const ctx = props?.context || (await ensureAudioCtx());
    const name = props?.processorName || 'source-processor';

    // ! AudioBuffer can not be copied between threads
    // Convert to transferable format before passing it
    let processedAudio = null;
    if (this.#defaultSample?.audioData) {
      // Create separate Float32Arrays for each channel
      processedAudio = [];
      for (let i = 0; i < this.#defaultSample.audioData.numberOfChannels; i++) {
        // Create a new copy of the data to ensure it's transferable
        const channelData = this.#defaultSample.audioData.getChannelData(i);
        processedAudio.push(new Float32Array(channelData));
      }
    }

    const processorOptions = {
      audioData: processedAudio,
      sampleRate: this.#audioContext?.sampleRate || 48000,
    };

    // console.warn(
    //   `why is this all zeroes? processorOptions.audioData -> ${processorOptions.audioData}`
    // );

    if (!registry.hasRegistered(name)) {
      console.warn(`Processor ${name} not registered, registering now...`);
      await registry.register({
        processorName: name,
        rawSource: SourceProcessorRaw,
      });
      console.debug(`processor ${name} registered`);
    }

    if (!processorOptions.audioData) {
      //console.error('No audio provided for source, fallback to default sample');
      throw new Error('No audio data provided');
    }

    if (this.#sourcePool.length >= this.#polyphony) {
      console.warn(`Polyphony limit of ${this.#polyphony} has been reached.`);
      return null;
    }

    const node = new SourceWorkletNode(ctx, name, processorOptions);
    node.connect(this.#masterGain);

    console.trace(node.start());
    console.debug(`VOLUME: ${this.#masterGain.gain.value}`);

    const poolSize = this.#sourcePool.push(node);
    console.debug(`poolSize: ${poolSize}`);

    // const TEST_AUTO_CREATE = true;
    node.addEventListener('ended', async () => {
      // const autoNewSrc = await this.createSourceNode(); // todo: remove or finish

      this.#sourcePool.splice(
        this.#sourcePool.findIndex((n) => n.nodeId === node.nodeId),
        1
        // TEST_AUTO_CREATE && autoNewSrc
      );
      console.debug(`poolSize 'ended': ${this.#sourcePool.length}`);
      node.dispose();
    });

    return node;
  }

  async ensureAudioCtx(): Promise<AudioContext> {
    return await ensureAudioCtx();
  }

  /** GETTERS & SETTERS **/

  get sourceNodes(): SourceWorkletNode[] {
    return this.#sourcePool;
  }

  get audioContext(): AudioContext | null {
    if (!this.#audioContext) console.error('context not initialized!');
    return this.#audioContext;
  }

  dispose(): void {
    console.debug('Audiolib dispose called');
    this.#sourcePool.forEach((node) => node.dispose());
    this.#sourcePool = [];
    this.#masterGain.disconnect();
    this.#masterGain = null as unknown as GainNode;
    releaseGlobalAudioContext();
    registry.dispose();
    idb.close();
    super.dispose();
    Audiolib.#instance = null;
  }
}
