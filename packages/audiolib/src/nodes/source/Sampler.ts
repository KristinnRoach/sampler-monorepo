// Todo: only stop the most recent voice for midiNote
// Sampler.ts
import { assert } from '@/utils';
import { SourcePool } from './SourcePool';
import { SourceNode } from './SourceNode';
import { MacroParam } from '@/helpers/MacroParam';
import { createNodeId } from '@/store/IdStore';
import { findZeroCrossings } from '@/utils';

export class Sampler {
  readonly nodeId: NodeID = createNodeId();
  readonly nodeType: string = 'source:default';
  // #buffer: AudioBuffer | null = null; // todo: decide where to store ref to buffer (currently in SourceNode and audiolib)
  #bufferDuration: number = 0;

  #context: AudioContext;
  #output: GainNode;

  #sourcePool: SourcePool;
  #activeNotes: Map<number, string[]> = new Map(); // <midiNote, nodeId[]>

  #macroLoopStart: MacroParam;
  #macroLoopEnd: MacroParam;
  #macroLoop: MacroParam;

  #loopRampTime: number = 0.2;

  #isInitialized: boolean = false;
  // #isLoaded: boolean;

  #zeroCrossings: number[] = [];
  #useZeroCrossings: boolean = true;

  constructor(
    audioBuffer: AudioBuffer,
    polyphony: number = 16,
    context: AudioContext
  ) {
    this.#context = context;
    this.#output = new GainNode(context);
    this.#output.gain.value = 1;

    this.#activeNotes = new Map();

    this.#sourcePool = new SourcePool(polyphony);

    this.#preCreateVoices(context, polyphony);

    // Initialize macro params
    this.#macroLoopStart = new MacroParam(context, 0);
    this.#macroLoopEnd = new MacroParam(context, 0);
    this.#macroLoop = new MacroParam(context, 0);

    // Set up parameters for all pre-created nodes
    for (const node of this.#sourcePool.nodes) {
      this.#setupNodeParams(node);
    }

    this.#isInitialized = true;
  }

  connect(destination: AudioNode) {
    this.#output.connect(destination);
    return this;
  }

  #now = () => this.#context.currentTime;

  #preCreateVoices(context: AudioContext, polyphony: number): void {
    for (let i = 0; i < polyphony; i++) {
      const node = new SourceNode(context);
      node.connect(this.#output);
      this.#sourcePool.addNode(node);
      // constructor calls setupNodeParams
    }
  }

  #setupNodeParams(node: SourceNode): void {
    this.#macroLoopStart.addTarget(node.loopStart);
    this.#macroLoopEnd.addTarget(node.loopEnd);
    this.#macroLoop.addTarget(node.loop);
  }

  #resetMacros(bufferDuration: number = this.#bufferDuration): void {
    this.#macroLoopEnd.param.setValueAtTime(bufferDuration, this.#now());
    this.#macroLoopStart.param.setValueAtTime(0, this.#now());
    this.#macroLoop.param.setValueAtTime(0, this.#now());
  }

  async loadSample(buffer: AudioBuffer, sampleRate?: number): Promise<void> {
    this.stopAll();
    const allNodes = this.#sourcePool.nodes;
    const rate = sampleRate || buffer.sampleRate; // duplicate sr logic in sourcenode
    console.debug(
      `loading buffer with sample rate: ${rate}, context's sample rate: ${this.#context.sampleRate}`
    );

    // Cache zero crossings
    this.#zeroCrossings = findZeroCrossings(buffer);

    console.debug({ calculatedZeroCrossings: this.#zeroCrossings });

    const promises = allNodes.map((node) => node.loadBuffer(buffer, rate));

    this.#resetMacros(buffer.duration);

    this.#bufferDuration = buffer.duration;

    this.setLoopEnd(buffer.duration);

    await Promise.all(promises);
    return;
  }

  playNote(midiNote: number, velocity: number = 1): void {
    let node = this.#sourcePool.getAvailableNode();

    if (!node) {
      // todo: skoða voice stealing stratt
      if (this.#activeNotes.size > 0) {
        const oldestNote = this.#activeNotes.keys().next().value;

        if (!oldestNote) return; // for now
        this.stopNote(oldestNote);

        // Try again
        node = this.#sourcePool.getAvailableNode();
      }

      // If still no node, something is wrong
      if (!node) {
        console.error('No voices available and voice stealing failed');
        return;
      }
    }

    node.play({ midiNote });
    this.#addToActiveNotes(midiNote, node.nodeId);

    node.addListener('ended', () => {
      this.#removeFromActiveNotes(midiNote, node.nodeId);
      this.#sourcePool.releaseNode(node.nodeId);
    });
  }

  #addToActiveNotes(midiNote: number, nodeId: string): void {
    if (this.#activeNotes.has(midiNote)) {
      this.#activeNotes.get(midiNote)?.push(nodeId);
    } else {
      this.#activeNotes.set(midiNote, [nodeId]);
    }
  }

  #removeFromActiveNotes(midiNote: number, nodeId: string): void {
    const nodeIds = this.#activeNotes.get(midiNote);
    if (nodeIds) {
      const remaining = nodeIds.filter((id) => id !== nodeId);
      if (remaining.length > 0) {
        this.#activeNotes.set(midiNote, remaining);
      } else {
        this.#activeNotes.delete(midiNote);
      }
    }
  }

  stopNote(midiNote: number): void {
    const nodeIds = this.#activeNotes.get(midiNote)?.slice() || [];

    nodeIds.forEach((nodeId) => {
      const node = this.#sourcePool.getNodeById(nodeId);
      if (node) {
        node.stop();
        this.#sourcePool.releaseNode(nodeId);
      }
    });

    this.#activeNotes.delete(midiNote);
  }

  stopAll(): void {
    this.#sourcePool.stopAll();
    this.#activeNotes.clear();
  }

  setLoopEnabled(enabled: boolean): this {
    const now = this.#now();
    this.#macroLoop.param.setValueAtTime(enabled ? 1 : 0, now);

    // If enabling loop and loop points are not set properly, set them
    if (enabled) {
      if (this.#macroLoopEnd.param.value <= 0) {
        this.#macroLoopEnd.param.setValueAtTime(this.#bufferDuration, now);
      }
      if (this.#macroLoopStart.param.value < 0) {
        this.#macroLoopStart.param.setValueAtTime(0, now);
      }
    }

    return this;
  }

  setLoopStart(
    targetValue: number,
    rampTime: number = this.#loopRampTime
  ): this {
    this.#macroLoopStart.ramp(targetValue, rampTime);
    return this;
  }

  setLoopEnd(targetValue: number, rampTime: number = this.#loopRampTime): this {
    // // TODO: Testing which sounds nicer, macro vs looping through
    // this.#macroLoopEnd.param.exponentialRampToValueAtTime(
    //   targetValue,
    //   this.#now() + rampTime
    // );

    this.#macroLoopEnd.ramp(targetValue, rampTime);
    return this;
  }

  getAllActiveNodes(): SourceNode[] {
    // add util to pass in a function to avoid iterating twice
    const allActiveNodes: SourceNode[] = [];
    this.#activeNotes.forEach((nodeIds) => {
      nodeIds.forEach((nodeId) => {
        const node = this.#sourcePool.getNodeById(nodeId);
        if (node) {
          allActiveNodes.push(node);
        }
      });
    });
    return allActiveNodes;
  }

  get activeNotesCount(): number {
    return [...this.#activeNotes.values()].reduce(
      (sum, arr) => sum + arr.length,
      0
    );
  }
  get isPlaying(): boolean {
    return this.#activeNotes.size > 0;
  }

  get sampleDuration(): number {
    return this.#bufferDuration;
  }

  get volume(): number {
    return this.#output.gain.value;
  }

  get voiceCount(): number {
    return this.#sourcePool.nodes.length;
  }
  get loopStart(): AudioParam {
    return this.#macroLoopStart.param;
  }
  get loopEnd(): AudioParam {
    return this.#macroLoopEnd.param;
  }
  get isLooping(): boolean {
    return this.#macroLoop.param.value > 0.5;
  }
}
