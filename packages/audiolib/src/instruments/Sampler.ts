// Todo: only stop the most recent voice for midiNote
// Sampler.ts
import { LibInstrument, LibSourceNode, SourceNode } from '@/nodes';
import { Pool } from '@/nodes/helpers/Pool';
import { createNodeId, NodeID } from '@/store/state/IdStore';
import { Message, MessageHandler, createMessageBus } from '@/events';
import { MacroParam } from '@/helpers/MacroParam';
import { assert, tryCatch } from '@/utils';
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
  readonly nodeId: NodeID;
  readonly nodeType: string = 'instrument:sampler:default';

  #bufferDuration: number = 0;

  #context: AudioContext;
  #output: GainNode;
  #sourcePool: Pool<SourceNode>;
  #state: InstrumentState = DEFAULT_SAMPLER_SETTINGS;
  #messages;

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
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context;
    this.#output = new GainNode(context);
    this.#output.gain.value = 1;
    this.#messages = createMessageBus<Message>(this.nodeId);

    // Initialize macro params
    this.#macroLoopStart = new MacroParam(context, 0);
    this.#macroLoopEnd = new MacroParam(context, 0);
    this.#macroLoop = new MacroParam(context, 0);

    // Initialize voices
    this.#sourcePool = new Pool(polyphony, 'source:default');
    this.#preCreateVoices(context, polyphony);

    this.#isInitialized = true;

    if (audioBuffer?.duration) {
      this.loadSample(audioBuffer, audioBuffer.sampleRate);
      this.#sourcePool.nodes.forEach((node) => this.#connectToMacros(node));
    } else {
      this.#isLoaded = false;
    }
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  protected sendMessage(type: string, data: any): void {
    this.#messages.sendMessage(type, data);
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

  // addListener, removeListener, #dispatch, etc. have been removed

  #preCreateVoices(context: AudioContext, polyphony: number): void {
    for (let i = 0; i < polyphony; i++) {
      const node = new SourceNode(context);
      node.connect(this.#output);
      this.#sourcePool.addNode(node);
    }
  }

  #connectToMacros(node: SourceNode): void {
    // (node: SourceNode, params: string[] | AudioParam[]) // make generic
    this.#macroLoopStart.addTarget(node.getParam('loopStart')!, 'loopStart');
    this.#macroLoopEnd.addTarget(node.getParam('loopEnd')!, 'loopEnd');
    this.#macroLoop.addTarget(node.getParam('loop')!, 'loopEnabled');
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

  async loadSample(
    buffer: AudioBuffer,
    modSampleRate?: number
  ): Promise<boolean> {
    this.stopAll();
    this.#isLoaded = false;

    if (
      buffer.sampleRate !== this.#context.sampleRate ||
      (modSampleRate && this.#context.sampleRate !== modSampleRate)
    ) {
      console.warn(
        `sample rate mismatch, 
        buffer: ${buffer.sampleRate}, 
        context: ${this.#context.sampleRate}
        loadSample arg: ${modSampleRate}
        `
      );
    }

    // Cache zero crossings, if being used
    if (this.#useZeroCrossings) this.#zeroCrossings = findZeroCrossings(buffer);

    const allNodes = this.#sourcePool.nodes;
    const promises = allNodes.map((node) => node.loadBuffer(buffer));

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
    const node = this.#sourcePool.allocateNode();
    if (!node) return this;

    node.onMessage('voice:ended', () => {
      this.sendMessage('voice:ended', { midiNote });
    });

    node.trigger({ midiNote, velocity, attackTime: this.#state.attackTime });
    this.sendMessage('note:on', { midiNote, velocity });
    return this;
  }

  // Simple subscription method
  subscribe(callback: EventCallback<SourceEvent>) {
    return this.events.subscribe(callback);
  }

  getParamValue(name: string): number | null {
    // todo
    return null;
  }

  setParamValue(name: string, value: number): this {
    // todo
    return this;
  }

  release(midiNote: number) {
    const nodes = this.#sourcePool.getNodesByNote(midiNote);
    if (!nodes?.length) {
      console.warn(`Could not release note ${midiNote}`);
      return this;
    }

    // todo: only release the most recently triggered
    nodes.forEach((node) => {
      if (node instanceof SourceNode) {
        node.release({ releaseTime: this.#state.releaseTime });
      }
    });

    this.sendMessage('note:off', { midiNote });
    return this;
  }

  stopAll() {
    const callback = (node: LibSourceNode) => node.stop();
    this.#sourcePool.applyToAllActiveNodes(callback);

    return this;
  }

  releaseAll(): this {
    const callback = (node: LibSourceNode) => node.release();
    this.#sourcePool.applyToAllActiveNodes(callback);

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

  // applyToAllActiveNodes(funcToApply: Function) {
  //   this.getAllActiveNodes(funcToApply);
  //   return this;
  // }

  // getAllActiveNodes(applyFunction?: Function): SourceNode[] {
  //   const allActiveNodes: SourceNode[] = [];
  //   this.#activeNotes.forEach((nodeIds) => {
  //     nodeIds.forEach((nodeId) => {
  //       const node = this.#sourcePool.getNodeById(nodeId);
  //       if (node) {
  //         if (applyFunction) applyFunction(node);
  //         allActiveNodes.push(node);
  //       }
  //     });
  //   });
  //   return allActiveNodes;
  // }

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

      // this.#activeNotes.clear();
      // this.#activeNotes = null as unknown as Map<number, string[]>;

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

  set attackMs(timeMs: number) {
    this.#state.attackTime = timeMs * 1000;
  }

  set releaseMs(timeMs: number) {
    this.#state.releaseTime = timeMs * 1000;
  }

  get attackMs(): number {
    return this.#state.attackTime / 1000;
  }

  get releaseMs(): number {
    return this.#state.releaseTime / 1000;
  }

  get isPlaying(): boolean {
    return this.#sourcePool.activeCount > 0;
  }

  get activeNotesCount(): number {
    return this.#sourcePool.activeCount;
  }

  // get activeNotesCount(): number {
  //   return [...this.#activeNotes.values()].reduce(
  //     (sum, arr) => sum + arr.length,
  //     0
  //   );
  // }

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

  // #getLastPlayedNode(): SourceNode | null {
  //   if (this.#activeNotes.size === 0) return null;

  //   // Get the last active note's most recent voice
  //   const lastNote = Array.from(this.#activeNotes.entries()).pop();
  //   if (!lastNote) return null;

  //   const [, nodeIds] = lastNote;
  //   const lastNodeId = nodeIds[nodeIds.length - 1];

  //   return this.#sourcePool.getNodeById(lastNodeId) as SourceNode; // Changed from getNode to getNodeById
  // }
}
