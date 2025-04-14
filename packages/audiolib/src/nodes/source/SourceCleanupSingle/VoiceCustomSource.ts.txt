import { SourceWorkletNode } from './SourceWorkletNode';
import { LibNode } from '@/abstract/nodes/baseClasses/LibNode';
import { ensureAudioCtx, getAudioContext } from '@/context';
import { AudiolibProcessor } from '@/processors/ProcessorRegistry';
import SourceProcessorRaw from './source-processor?raw';

export class VoiceCustomSource extends LibNode {
  readonly processorName: AudiolibProcessor = 'source-processor';

  #context: BaseAudioContext;
  #src: SourceWorkletNode;
  #outputNode: GainNode;
  #buffer: AudioBuffer | null;
  #isProcessorRegistered: boolean;
  #isLoaded: boolean;

  #isPlayingNote: number;

  constructor(
    audioBuffer?: AudioBuffer,
    context: BaseAudioContext = getAudioContext()
  ) {
    super();
    this.#context = context;
    this.#outputNode = context.createGain();
    this.#outputNode.gain.setValueAtTime(0, this.now());

    // this.#src = null;
    this.#buffer = null;
    this.#isProcessorRegistered = false;
    this.#isLoaded = false;

    if (!this.#isProcessorRegistered) {
      this.registerProcessor().then(() => {
        this.#isProcessorRegistered = true;
      });
    }

    this.#src = new SourceWorkletNode(this.#context);

    if (audioBuffer) {
      this.updateAudioBuffer(audioBuffer).then(() => {
        this.#isLoaded = true;
      });
    }

    this.#isPlayingNote = -1;
  }

  async registerProcessor(): Promise<boolean> {
    if (this.#isProcessorRegistered) return false;

    const blob = new Blob([SourceProcessorRaw], {
      type: 'application/javascript',
    });
    const url = URL.createObjectURL(blob);

    try {
      this.#context = await ensureAudioCtx();
      await this.#context.audioWorklet.addModule(url);
      this.#isProcessorRegistered = true;
      return true;
    } catch (error) {
      console.error('Failed to register worklet processor:', error);
      this.#isProcessorRegistered = false;
      throw error;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  resetSource(): void {
    if (this.#src) this.#src.dispose();
    // this.#src = null;
    this.#src = new SourceWorkletNode(this.#context);
    this.#src.connect(this.#outputNode);
  }

  async updateAudioBuffer(audioBuffer: AudioBuffer): Promise<void> {
    this.#isLoaded = false;
    this.#buffer = null;

    if (!this.#context || this.#context.state !== 'running') {
      this.#context = await ensureAudioCtx();
    }

    this.resetSource();

    if (this.#src) {
      this.#src.buffer = audioBuffer;
    } else {
      throw new Error('Source node is not initialized');
    }

    this.#buffer = audioBuffer;
    this.#isLoaded = true;
  }

  playNote(
    midiNote: number,
    velocity: number = 1,
    startTime: number = this.now()
  ) {
    if (!this.#buffer) {
      throw new Error('Buffer is not set');
    }

    if (!this.#src) {
      this.#src = new SourceWorkletNode(this.#context);
      this.#src.buffer = this.#buffer;
      this.#src.connect(this.#outputNode);
    }
    this.#src.playNote(midiNote, velocity, startTime);

    this.#isPlayingNote = midiNote;
  }

  stop(when: number = this.now()) {
    this.#src?.stop(when);

    this.#isPlayingNote = -1;
  }

  get output(): GainNode {
    return this.#outputNode;
  }

  get src(): SourceWorkletNode | null {
    return this.#src;
  }

  get isPlayingNote(): number {
    return this.#isPlayingNote;
  }

  now(): number {
    return this.#context.currentTime;
  }
}
