// Todo: only stop the most recent voice for midiNote
// Sampler.ts
import { assert, tryCatch } from '@/utils';
import { Pool } from '@/nodes/helpers/Pool';
import { LibInstrument, LibSourceNode, SourceNode } from '@/nodes';
import { MacroParam } from '@/helpers/MacroParam';
import { createNodeId } from '@/store/state/IdStore';
import { findZeroCrossings } from '@/utils';

interface InstrumentState {
  [key: string]: number;
}

const DEFAULT_SAMPLER_SETTINGS: InstrumentState = {
  midiNote: 60,
  velocity: 1,
  startOffset: 0,
  endOffset: 0,
  attackTime: 0.01,
  releaseTime: 0.3,
  loopEnabled: 0,
  loopStart: 0,
  loopEnd: 0,
};

export class Sampler implements LibInstrument {
  readonly nodeId: NodeID = createNodeId();
  readonly nodeType: string = 'source:default';
  // #buffer: AudioBuffer | null = null;
  // todo: just store in idb samplelib for now! // decide where to store ref to buffer (currently in SourceNode and audiolib)
  #bufferDuration: number = 0;

  #context: AudioContext;
  #output: GainNode;
  #eventListeners: Record<string, Function[]>;

  #sourcePool: Pool<SourceNode>; // todo: Pool<LibSourceNode>;
  #activeNotes: Map<number, string[]> = new Map(); // <midiNote, nodeId[]>

  #state: InstrumentState = DEFAULT_SAMPLER_SETTINGS;

  #macroLoopStart: MacroParam;
  #macroLoopEnd: MacroParam;
  #macroLoop: MacroParam;

  #loopRampTime: number = 0.2;

  #isInitialized: boolean = false;
  #isLoaded: boolean = false;

  #zeroCrossings: number[] = []; // maybe needed later
  #useZeroCrossings: boolean = true;

  #currentPosition: number = 0;
  #currentAmplitude: number = 0;
  #positionUpdateInterval: number | null = null;

  randomizeVelocity: boolean = false; // for testing, refactor later

  constructor(
    polyphony: number = 16,
    context: AudioContext,
    audioBuffer?: AudioBuffer
  ) {
    this.#context = context;
    this.#output = new GainNode(context);
    this.#output.gain.value = 1;

    // Initialize macro params
    this.#macroLoopStart = new MacroParam(context, 0);
    this.#macroLoopEnd = new MacroParam(context, 0);
    this.#macroLoop = new MacroParam(context, 0);

    // Initialize voices
    this.#activeNotes = new Map();
    this.#sourcePool = new Pool(polyphony, 'source:default');
    this.#preCreateVoices(context, polyphony);

    this.#isInitialized = true;

    // use validate audioBuffer util
    if (audioBuffer && audioBuffer.duration) {
      // ? context.samplerate or buffer.sr should be default??
      this.loadSample(audioBuffer, audioBuffer.sampleRate);
    } else {
      this.#isLoaded = false;
    }

    // Start position tracking
    // this.#startPositionTracking();

    // Set up event target
    this.#eventListeners = {
      position_and_amplitude: [],
      'voice:ended': [],
      'all-notes:ended': [],
    };
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

  // Event handling

  addListener(type: string, callback: Function) {
    if (this.#eventListeners[type]) {
      this.#eventListeners[type].push(callback);
    }
    return this;
  }

  removeListener(type: string, callback: Function) {
    if (this.#eventListeners[type]) {
      this.#eventListeners[type] = this.#eventListeners[type].filter(
        (cb) => cb !== callback
      );
    }
    return this;
  }

  #dispatch(type: string, detail: Record<string, any> = {}) {
    if (this.#eventListeners[type]) {
      const event = { type, detail, target: this };
      this.#eventListeners[type].forEach((cb) => cb(event));
    }
    return this;
  }

  #preCreateVoices(context: AudioContext, polyphony: number): void {
    for (let i = 0; i < polyphony; i++) {
      const node = new SourceNode(context);
      node.connect(this.#output);
      this.#sourcePool.addNode(node);
    }
  }

  #connectToMacros(node: SourceNode): void {
    // (node: SourceNode, params: string[] | AudioParam[]) // make generic
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
    // enabled just [0, 1] ?

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
    return true;
  }

  play(midiNote: number, velocity: number = 0.8) {
    let node = this.#sourcePool.getAvailableNode();

    if (!node) {
      // todo: skoða voice stealing stratt
      if (this.#activeNotes.size > 0) {
        const oldestNote = this.#activeNotes.keys().next().value;

        if (!oldestNote) return this; // for now
        this.release(oldestNote); // todo: immediate stop

        // Try again
        node = this.#sourcePool.getAvailableNode();
      }

      // If still no node, something is wrong
      if (!node) {
        console.error('No voices available and voice stealing failed');
        return this;
      }
    }
    assert(node, 'No node available');

    velocity = this.randomizeVelocity
      ? velocity * Math.random() * 0.5 + 0.5
      : velocity;

    node.trigger({ midiNote, velocity });
    this.#addToActiveNotes(midiNote, node.nodeId);

    node.addListener('voice:ended', () => {
      this.#removeFromActiveNotes(midiNote, node.nodeId); // todo: move active notes to pool
      this.#dispatch('voice:ended', { midiNote, nodeId: node.nodeId });
      if (this.#activeNotes.size === 0) {
        this.#dispatch('all-notes:ended');
      }
    });

    // if tracking
    this.track(node);

    return this;
  }

  track(node: SourceNode) {
    node.addEventListener('voice:position_and_amplitude', (event: any) => {
      this.#dispatch('position_and_amplitude', {
        nodeId: event.nodeId,
        position: event.position,
        seconds: event.seconds,
        amplitude: event.amplitude,
      });
    });
  }

  getParamValue(name: string): number | null {
    // todo
    return null;
  }

  setParamValue(name: string, value: number): this {
    // todo
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

  release(midiNote: number) {
    const nodeIds = this.#activeNotes.get(midiNote)?.slice() || [];

    nodeIds.forEach((nodeId) => {
      const node = this.#sourcePool.getNodeById(nodeId);
      if (node) {
        node.release();
      }
    });

    this.#activeNotes.delete(midiNote);
    return this;
  }

  stopAll() {
    const callback = (node: LibSourceNode) => node.stop();
    this.applyToAllActiveNodes(callback);

    return this;
  }

  releaseAll(): this {
    const callback = (node: LibSourceNode) => node.release();
    this.applyToAllActiveNodes(callback);

    return this;
  }

  setLoopEnabled(enabled: boolean): this {
    const now = this.now();
    this.#macroLoop.macro.setValueAtTime(enabled ? 1 : 0, now);

    // Cleanup
    if (enabled) {
      if (this.#macroLoopEnd.macro.value <= this.#macroLoopStart.macro.value) {
        this.#macroLoopEnd.macro = this.#bufferDuration;
      }
      if (
        this.#macroLoopStart.macro.value < 0 ||
        this.#macroLoopStart.macro.value >= this.#macroLoopEnd.macro.value
      ) {
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

      // Clean up position tracking
      if (this.#positionUpdateInterval) {
        clearInterval(this.#positionUpdateInterval);
      }
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

  get currentPosition(): number {
    return this.#currentPosition;
  }

  get normalizedPosition(): number {
    return this.#bufferDuration
      ? this.#currentPosition / this.#bufferDuration
      : 0;
  }

  testPlayPos(pos: number) {
    this.#currentPosition = pos;
  }

  // #startPositionTracking() {
  //   if (this.#positionUpdateInterval) {
  //     clearInterval(this.#positionUpdateInterval);
  //   }

  //   // Update position 60 times per second
  //   this.#positionUpdateInterval = setInterval(() => {
  //     if (this.isPlaying) {
  //       // Get position from the most recently played voice
  //       const lastPlayedNode = this.#getLastPlayedNode();
  //       if (lastPlayedNode) {
  //         this.#currentPosition = lastPlayedNode.playbackPositionParam.value;
  //         this.#currentAmplitude = lastPlayedNode.playbackPositionParam.value;
  //       }
  //     }
  //   }, 1000 / 60) as unknown as number;
  // }

  #getLastPlayedNode(): SourceNode | null {
    if (this.#activeNotes.size === 0) return null;

    // Get the last active note's most recent voice
    const lastNote = Array.from(this.#activeNotes.entries()).pop();
    if (!lastNote) return null;

    const [, nodeIds] = lastNote;
    const lastNodeId = nodeIds[nodeIds.length - 1];

    return this.#sourcePool.getNodeById(lastNodeId) as SourceNode; // Changed from getNode to getNodeById
  }
}
