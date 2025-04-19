import {
  ensureAudioCtx,
  getAudioContext,
  releaseGlobalAudioContext,
} from '@/context';
import { idb, initIdb, sampleLib } from './store/persistent/idb';
import { AudiolibProcessor, registry } from '@/processors/ProcessorRegistry';
import { LibNode } from '@/abstract/baseClasses/LibNode';
import { SourceNode } from './nodes/source/SourceNode';
import SourceProcessorRaw from '@/nodes/source/source-processor?raw';

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
  #sourcePool: SourceNode[] = [];
  #activeSources: Map<number, SourceNode> = new Map();
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

    await this.initSourceWorklet();
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

  async loadBuffer(buffer: AudioBuffer, sampleRate?: number) {
    this.#activeSources.forEach((src) => src.stop());
    this.#activeSources.clear();

    this.#sourcePool.map((src) => src.loadBuffer(buffer, sampleRate));

    // todo: load through IDB (optional noCache)
    // todo: if(this.#sourcePool.length < this.#polyphony)

    if (!this.#audioContext) return;

    const newPlayer = new SourceNode(this.#audioContext);
    newPlayer.loadBuffer(buffer, buffer.sampleRate);
    newPlayer.connect(this.#masterGain);

    // todo: maybe use the fact that array push() returns the new length of the array
    // to store reference to the player via it's index in the array
    const poolSize = this.#sourcePool.push(newPlayer);
    const thisPlayerIndex = poolSize - 1;

    console.debug({
      pool: this.#sourcePool,
      clearedActive: this.#activeSources,
    });
  }

  async initSourceWorklet(name = 'source-processor') {
    if (!this.#audioContext || !this.#audioContext?.audioWorklet) {
      console.error(`no context or doesnt support worklet`);
      return;
    }

    if (!registry.hasRegistered(name)) {
      console.warn(`Processor ${name} not registered, registering now...`);
      await registry.register({
        processorName: name,
        rawSource: SourceProcessorRaw,
      });
      console.debug(`processor ${name} registered`);
    }

    const initPlayer = await this.createSourceNode();
    initPlayer?.connect(this.#masterGain);

    if (!this.#defaultSample || !this.#defaultSample.audioData) {
      console.warn('no default sample!');
      return initPlayer;
    }
  }

  async createSourceNode(audioBuffer?: AudioBuffer) {
    if (!this.#audioContext) return;

    const player = new SourceNode(this.#audioContext);
    player.connect(this.#masterGain);

    let usedBuffer: AudioBuffer;
    if (!audioBuffer) {
      console.debug('no buffer provided, trying default sample');
      if (!this.#defaultSample || !this.#defaultSample.audioData) {
        console.warn('no default sample!');
        return player;
      }
      usedBuffer = this.#defaultSample.audioData;
    } else {
      usedBuffer = audioBuffer;
    }

    await player.loadBuffer(usedBuffer, usedBuffer.sampleRate);

    this.#sourcePool.push(player);

    return player;
  }

  playNote(midiNote: number, velocity?: number) {
    const source = this.#sourcePool.pop();
    if (!source) {
      console.error('no source to playNote');
      return;
    }
    source.play({ midiNote });
    this.#activeSources.set(midiNote, source);

    this.createSourceNode(); // prep next source
  }

  stopNote(midiNote: number) {
    const source = this.#activeSources.get(midiNote);
    if (!source) console.warn('no source to stopNote');
    source?.stop();
    this.#activeSources.delete(midiNote);
  }

  async ensureAudioCtx(): Promise<AudioContext> {
    return await ensureAudioCtx();
  }

  /** GETTERS & SETTERS **/

  get sourceNodes(): SourceNode[] {
    return this.#sourcePool;
  }

  get audioContext(): AudioContext | null {
    if (!this.#audioContext) console.error('context not initialized!');
    return this.#audioContext;
  }

  dispose(): void {
    console.debug('Audiolib dispose called');
    this.#sourcePool.forEach((node) => node.disconnect()); // vantar dispose
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
