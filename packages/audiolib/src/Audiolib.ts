import {
  ensureAudioCtx,
  getAudioContext,
  releaseGlobalAudioContext,
} from '@/context';
import { LibNode } from '@/abstract/baseClasses/LibNode';

import { idb, initIdb, sampleLib } from './store/persistent/idb';
import { registry } from '@/processors/ProcessorRegistry';
import SourceProcessorRaw from '@/nodes/source/source-processor?raw';

import { Sampler } from './nodes/source/Sampler';
import { assert } from '@/utils';

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

  #samplers: Map<string, Sampler> = new Map();

  // #sourcePool: SourceNode[] = [];
  // #activeSources: Map<number, SourceNode> = new Map();
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
    await ensureAudioCtx();
    console.debug(
      `Audiolib init(), context state: ${this.#audioContext?.state}`
    );

    await initIdb();
    console.debug('initialized IndexedDB', { idb });

    await this.refreshLatestSample();

    await this.registerProcessors();
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

  createSampler(
    audioSample?: AudioBuffer,
    polyphony = 8,
    ctx = this.#audioContext
  ): Sampler | null {
    assert(ctx, '', this);

    const audioBuffer = audioSample || this.#defaultSample?.audioData;

    if (!audioBuffer) {
      console.error('no buffer for create sampler ??');
      return null; // for now
    }

    const newSampler = new Sampler(polyphony, ctx, audioBuffer);
    newSampler.connect(this.#masterGain);
    this.#samplers.set(newSampler.nodeId, newSampler);
    return newSampler;
  }

  // this is overly verbose - should register all default processors
  // todo: simplify and cleanup all the registry logic!!
  async registerProcessors(name = 'source-processor'): Promise<boolean> {
    if (!this.#audioContext || !this.#audioContext?.audioWorklet) {
      console.error(`no context or doesnt support worklet`);
      return false;
    }

    if (!registry.hasRegistered(name)) {
      const registryName = await registry.register({
        processorName: name,
        rawSource: SourceProcessorRaw,
      });
      return registryName !== null;
    }

    return registry.hasRegistered(name);
  }

  async ensureAudioCtx(): Promise<AudioContext> {
    return await ensureAudioCtx();
  }

  /** GETTERS & SETTERS **/

  get audioContext(): AudioContext | null {
    if (!this.#audioContext) console.error('context not initialized!');
    return this.#audioContext;
  }

  dispose(): void {
    console.debug('Audiolib dispose called');
    this.#masterGain.disconnect();
    this.#masterGain = null as unknown as GainNode;
    releaseGlobalAudioContext();
    registry.dispose();
    idb.close();
    super.dispose();
    Audiolib.#instance = null;
  }
}
