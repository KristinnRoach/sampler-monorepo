// Todo: only stop the most recent voice for midiNote
// Sampler.ts
import { assert, tryCatch } from '@/utils';
import { Pool } from '@/nodes/helpers/Pool';
import { LibInstrument, LibSourceNode, SourceNode } from '@/nodes';
import { MacroParam } from '@/helpers/MacroParam';
import { createNodeId } from '@/store/state/IdStore';
import { findZeroCrossings } from '@/utils';

export class Sampler implements LibInstrument {
  readonly nodeId: NodeID = createNodeId();
  readonly nodeType: string = 'source:default';
  // #buffer: AudioBuffer | null = null;
  // todo: just store in idb samplelib for now! // decide where to store ref to buffer (currently in SourceNode and audiolib)
  #bufferDuration: number = 0;

  #context: AudioContext;
  #output: GainNode;

  #sourcePool: Pool<SourceNode>; // todo: Pool<LibSourceNode>;
  #activeNotes: Map<number, string[]> = new Map(); // <midiNote, nodeId[]>

  #macroLoopStart: MacroParam;
  #macroLoopEnd: MacroParam;
  #macroLoop: MacroParam;

  #loopRampTime: number = 0.2;

  #isInitialized: boolean = false;
  #isLoaded: boolean = false;

  #zeroCrossings: number[] = []; // maybe needed later
  #useZeroCrossings: boolean = true;

  constructor(
    polyphony: number = 16,
    context: AudioContext,
    audioBuffer?: AudioBuffer
  ) {
    this.#context = context;
    this.#output = new GainNode(context);
    this.#output.gain.value = 1;

    this.#activeNotes = new Map();

    this.#sourcePool = new Pool(polyphony, 'source:default');

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
    this.#isLoaded = false;

    // use validate audioBuffer util
    if (audioBuffer && audioBuffer.duration) {
      // ? context.samplerate or buffer.sr should be default??
      this.loadSample(audioBuffer, audioBuffer.sampleRate);
    }
  }

  addListener(event: string, listener: Function) {
    console.error('Method not implemented.');
    return this;
  }

  removeListener(event: string, listener: Function) {
    console.error('Method not implemented.');
    return this;
  }

  dispatchEvent(event: Event) {
    console.error('Method not implemented.');
    return this;
  }

  now = () => this.#context.currentTime;

  connect(destination: AudioNode) {
    this.#output.connect(destination);
    return this;
  }

  disconnect() {
    this.#output.disconnect();
    return this;
  }

  #preCreateVoices(context: AudioContext, polyphony: number): void {
    for (let i = 0; i < polyphony; i++) {
      const node = new SourceNode(context);
      node.connect(this.#output);
      this.#sourcePool.addNode(node);
      // constructor calls setupNodeParams
    }
  }

  #setupNodeParams(node: SourceNode): void {
    this.#macroLoopStart.addTarget(node.loopStart, 'loopStart');
    this.#macroLoopEnd.addTarget(node.loopEnd, 'loopEnd');
    this.#macroLoop.addTarget(node.loop, 'loopEnabled');
  }

  #resetMacros(bufferDuration: number = this.#bufferDuration) {
    this.#macroLoopEnd.macro.setValueAtTime(bufferDuration, this.now());
    this.#macroLoopStart.macro.setValueAtTime(0, this.now());
    this.#macroLoop.macro.setValueAtTime(0, this.now());

    if (!this.#useZeroCrossings || !(this.#zeroCrossings.length > 0)) {
      return this;
    }
    // set zero crossings
    this.#macroLoopStart.setAllowedParamValues(this.#zeroCrossings);
    this.#macroLoopEnd.setAllowedParamValues(this.#zeroCrossings);

    // set scale - allowed durations ...
  }

  async loadSample(buffer: AudioBuffer, sampleRate?: number): Promise<boolean> {
    this.stopAll();
    this.#isLoaded = false;

    const rate = sampleRate || buffer.sampleRate;

    // Cache zero crossings, if being used
    if (this.#useZeroCrossings) this.#zeroCrossings = findZeroCrossings(buffer);

    const allNodes = this.#sourcePool.nodes;
    const promises = allNodes.map((node) => node.loadBuffer(buffer, rate));

    const result = await tryCatch(
      Promise.all(promises),
      'Failed to load sample'
    );

    if (result.error) {
      return false; // Loading failed
    }

    this.#resetMacros(buffer.duration);
    this.#bufferDuration = buffer.duration;
    this.setLoopEnd(buffer.duration);

    this.#isLoaded = true;
    return true; // If returns true: set isLoaded = true
  }

  playNote(midiNote: number, velocity: number = 1) {
    let node = this.#sourcePool.getAvailableNode();

    if (!node) {
      // todo: skoða voice stealing stratt
      if (this.#activeNotes.size > 0) {
        const oldestNote = this.#activeNotes.keys().next().value;

        if (!oldestNote) return this; // for now
        this.stopNote(oldestNote);

        // Try again
        node = this.#sourcePool.getAvailableNode();
      }

      // If still no node, something is wrong
      if (!node) {
        console.error('No voices available and voice stealing failed');
        return this;
      }
    }

    node.play({ midiNote });
    this.#addToActiveNotes(midiNote, node.nodeId);

    node.addListener('ended', () => {
      this.#removeFromActiveNotes(midiNote, node.nodeId);
      this.#sourcePool.markAvailable(node.nodeId);
    });

    return this;
  }

  getParamValue(name: string): number | null {
    // todo
    return null;
  }

  setParamValue(name: string, value: number): this {
    // todo
    return this;
  }

  triggerAttack(midiNote: number, velocity: number = 1) {
    // Todo
    this.playNote(midiNote, velocity);
    return this;
  }

  triggerRelease(midiNote: number) {
    // Todo
    this.stopNote(midiNote);
    return this;
  }

  triggerAttackRelease(
    // Todo
    midiNote: number,
    duration: number,
    velocity: number = 1
  ) {
    this.playNote(midiNote, velocity);
    setTimeout(() => this.stopNote(midiNote), duration * 1000);
    return this;
  }

  #addToActiveNotes(midiNote: number, nodeId: string) {
    if (this.#activeNotes.has(midiNote)) {
      this.#activeNotes.get(midiNote)?.push(nodeId);
    } else {
      this.#activeNotes.set(midiNote, [nodeId]);
    }
    return this;
  }

  #removeFromActiveNotes(midiNote: number, nodeId: string) {
    const nodeIds = this.#activeNotes.get(midiNote);
    if (nodeIds) {
      const remaining = nodeIds.filter((id) => id !== nodeId);
      if (remaining.length > 0) {
        this.#activeNotes.set(midiNote, remaining);
      } else {
        this.#activeNotes.delete(midiNote);
      }
    }
    return this;
  }

  stopNote(midiNote: number) {
    const nodeIds = this.#activeNotes.get(midiNote)?.slice() || [];

    nodeIds.forEach((nodeId) => {
      const node = this.#sourcePool.getNodeById(nodeId);
      if (node) {
        node.stop();
        this.#sourcePool.markAvailable(nodeId);
      }
    });

    this.#activeNotes.delete(midiNote);
    return this;
  }

  stopAll() {
    const callback = (node: LibSourceNode) => {
      node.stop();
      this.#sourcePool.markAvailable(node.nodeId);
    };

    this.applyToAllActiveNodes(callback);

    this.#activeNotes.clear();

    return this;
  }

  releaseAll(): this {
    // TODO
    this.stopAll();
    return this;
  }

  setLoopEnabled(enabled: boolean): this {
    const now = this.now();
    this.#macroLoop.macro.setValueAtTime(enabled ? 1 : 0, now);

    // Set loop points (maybe unnecessary?)
    if (enabled) {
      if (this.#macroLoopEnd.macro.value <= 0) {
        this.#macroLoopEnd.macro = this.#bufferDuration;
      }
      if (this.#macroLoopStart.macro.value < 0) {
        this.#macroLoopStart.macro = 0.01;
      }
    }

    return this;
  }

  setLoopStart(
    targetValue: number,
    rampTime: number = this.#loopRampTime
  ): this {
    this.#macroLoopStart.ramp(targetValue, rampTime, this.#macroLoopEnd.value);
    return this;
  }

  setLoopEnd(targetValue: number, rampTime: number = this.#loopRampTime): this {
    this.#macroLoopEnd.ramp(targetValue, rampTime, this.#macroLoopStart.value);
    return this;
  }

  applyToAllActiveNodes(funcToApply: Function) {
    this.getAllActiveNodes(funcToApply);
    return this;
  }

  getAllActiveNodes(applyFunction?: Function): SourceNode[] {
    const allActiveNodes: SourceNode[] = [];
    this.#activeNotes.forEach((nodeIds) => {
      nodeIds.forEach((nodeId) => {
        const node = this.#sourcePool.getNodeById(nodeId);
        if (node) {
          if (applyFunction) applyFunction(node);
          allActiveNodes.push(node);
        }
      });
    });
    return allActiveNodes;
  }

  dispose(): void {
    try {
      this.stopAll();

      if (this.#sourcePool) {
        this.#sourcePool.dispose();
        this.#sourcePool = null as unknown as Pool<SourceNode>;
      }

      if (this.#output) {
        this.#output.disconnect();
        this.#output = null as unknown as GainNode;
      }

      this.#activeNotes.clear();
      this.#activeNotes = null as unknown as Map<number, string[]>;

      this.#macroLoopStart.dispose();
      this.#macroLoopEnd.dispose();
      this.#macroLoop.dispose();
      this.#macroLoopStart = null as unknown as MacroParam;
      this.#macroLoopEnd = null as unknown as MacroParam;
      this.#macroLoop = null as unknown as MacroParam;

      // Reset state variables
      this.#bufferDuration = 0;
      this.#isInitialized = false;
      this.#isLoaded = false;
      this.#zeroCrossings = [];
      this.#useZeroCrossings = false;
      this.#loopRampTime = 0;

      // Clear context reference
      this.#context = null as unknown as AudioContext;
    } catch (error) {
      console.error(`Error disposing Sampler ${this.nodeId}:`, error);
    }
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

  get isInitialized() {
    return this.#isInitialized;
  }

  get isLoaded() {
    return this.#isLoaded;
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
    return this.#macroLoopStart.macro;
  }
  get loopEnd(): AudioParam {
    return this.#macroLoopEnd.macro;
  }
  get isLooping(): boolean {
    return this.#macroLoop.macro.value > 0.5;
  }
}
