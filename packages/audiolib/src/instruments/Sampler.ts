// Todo: only stop the most recent voice for midiNote
// Sampler.ts
import { LibInstrument, Instrument, SourceNode, LibVoiceNode } from '@/nodes';
import { Pool } from '@/nodes/collections/Pool';
import { createNodeId, NodeID } from '@/store/state/IdStore';
import { Message, MessageHandler, createMessageBus } from '@/events';
import { MacroParam } from '@/helpers/MacroParam';
import { assert, tryCatch } from '@/utils';
import { findZeroCrossings } from '@/utils';
import { getAudioContext } from '@/context';

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
  readonly nodeType: Instrument = 'sampler';

  #bufferDuration: number = 0;

  #context: AudioContext;
  #output: GainNode;
  #sourcePool: Pool<SourceNode>;
  #messages;

  #activeNotes = new Map<number, Set<SourceNode>>();
  #state: InstrumentState = DEFAULT_SAMPLER_SETTINGS;

  #macroLoopStart: MacroParam;
  #macroLoopEnd: MacroParam;
  #macroLoop: MacroParam;

  #loopRampTime: number = 0.2;

  #isInitialized = false;
  #isLoaded = false;

  #zeroCrossings: number[] = []; // maybe needed later
  #useZeroCrossings = true;

  #trackPlaybackPosition = false;
  #mostRecentSource: SourceNode | null = null;

  randomizeVelocity = false; // for testing, refactor later

  constructor(
    polyphony: number = 48,
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

    // Initialize pool with type only (removed polyphony parameter)
    this.#sourcePool = new Pool<SourceNode>();

    // Pre-create voices with polyphony
    this.#preCreateVoices(context, polyphony);

    // Todo: probably just track the latest played note instead of all..
    this.#sourcePool.nodes.forEach((node) => {
      node.onMessage('voice:position', (data) => {
        if (this.#trackPlaybackPosition && node === this.#mostRecentSource)
          this.#messages.sendMessage('voice:position', data);
      });
    });

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
      this.#sourcePool.add(node);
    }
  }

  #connectToMacros(node: SourceNode): void {
    // (node: SourceNode, params: string[] | AudioParam[]) // make generic
    this.#macroLoopStart.addTarget(node.getParam('loopStart')!, 'loopStart');
    this.#macroLoopEnd.addTarget(node.getParam('loopEnd')!, 'loopEnd');
    // this.#macroLoop.addTarget(node.getParam('loop')!, 'loopEnabled');
  }

  #resetMacros(bufferDuration: number = this.#bufferDuration) {
    this.#macroLoopEnd.macro.setValueAtTime(bufferDuration, this.now);
    this.#macroLoopStart.macro.setValueAtTime(0, this.now);
    this.#macroLoop.macro.setValueAtTime(0, this.now);

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

  play(midiNote: number, modifers: TODO, velocity: number = 0.8) {
    const node = this.#sourcePool.allocateNode();
    if (!node) return this;

    const capsOn = modifers.caps;

    // Trigger sound first to minimize latency
    node.trigger({ midiNote, velocity, attackTime: this.#state.attackTime });

    // then bookkeeping
    if (!this.#activeNotes.has(midiNote)) {
      this.#activeNotes.set(midiNote, new Set());
    }
    this.#activeNotes.get(midiNote)!.add(node);

    // Update most recent source for tracking position
    this.#mostRecentSource = node;
    node.enablePositionTracking = true;

    this.sendMessage('note:on', { midiNote, velocity });

    if (node.getParam('loop').value !== (capsOn ? 1 : 0)) {
      // this.setLoopEnabled(capsOn); // ! Not working!?

      // Test to make prev active notes start looping
      const active = Array.from(this.#activeNotes.values());
      if (active) {
        active.forEach((set) => {
          set.forEach((node) => node.setLoopEnabled(capsOn));
        });
      }
    }

    return this;
  }

  enablePositionTracking(
    enabled: boolean,
    strategy: 'mostRecent' | 'all' = 'mostRecent'
  ) {
    this.#trackPlaybackPosition = enabled;

    if (enabled && strategy === 'mostRecent') {
      // Only enable tracking for most recent source
      if (this.#mostRecentSource) {
        this.#mostRecentSource.enablePositionTracking = true;
      }
    } else if (enabled && strategy === 'all') {
      // todo
    } else {
      // Disable tracking for all sources
      this.#sourcePool.nodes.forEach((node) => {
        node.enablePositionTracking = false;
      });
    }
  }

  getParamValue(name: string): number | null {
    // todo
    return null;
  }

  setParamValue(name: string, value: number): this {
    // todo
    return this;
  }

  release(midiNote: number, modifers: TODO) {
    const nodes = this.#activeNotes.get(midiNote);
    if (!nodes || nodes.size === 0) {
      console.warn(`Could not release note ${midiNote}`);
      return this;
    }

    if (this.loopEnabled !== modifers.caps) {
      this.setLoopEnabled(modifers.caps);
    }

    nodes.forEach((node) => {
      node.release({ releaseTime: this.#state.releaseTime });
      node.enablePositionTracking = false;
      if (this.#mostRecentSource === node) this.#mostRecentSource = null;
    });

    this.sendMessage('note:off', { midiNote });
    return this;
  }

  stopAll() {
    const callback = (node: LibVoiceNode) => node.stop();

    tryCatch(
      () => this.#sourcePool.applyToAllActiveNodes(callback),
      'Failed to stop all nodes'
    );

    return this;
  }

  releaseAll(): this {
    const callback = (node: LibVoiceNode) => node.release();

    tryCatch(
      () => this.#sourcePool.applyToAllActiveNodes(callback),
      'Failed to release all nodes'
    );

    return this;
  }

  get loopEnabled() {
    return this.#macroLoop.getValue() > 0.5;
  }

  onGlobalLoopToggle(capsOn: TODO): this {
    // // add conditionals for loop locked etc
    // this.setLoopEnabled(capsOn);

    return this;
  }

  setLoopStart(
    targetValue: number,
    rampTime: number = this.#loopRampTime
  ): this {
    this.#macroLoopStart.ramp(
      targetValue,
      rampTime,
      this.#macroLoopEnd.getValue()
    );
    return this;
  }

  setLoopEnd(targetValue: number, rampTime: number = this.#loopRampTime): this {
    this.#macroLoopEnd.ramp(
      targetValue,
      rampTime,
      this.#macroLoopStart.getValue()
    );
    return this;
  }

  setLoopEnabled(enabled: boolean) {
    this.#macroLoop.macro = enabled ? 1 : 0;
    // this.#sourcePool.nodes.forEach((voice) => voice.setLoopEnabled(enabled));
  }

  dispose(): void {
    try {
      this.stopAll();
      this.#mostRecentSource = null;

      if (this.#sourcePool) {
        this.#sourcePool.dispose();
        this.#sourcePool = null as unknown as Pool<SourceNode>;
      }

      this.#activeNotes.clear();

      if (this.#output) {
        this.#output.disconnect();
        this.#output = null as unknown as GainNode;
      }

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

  set attackMs(timeMs: number) {
    this.#state.attackTime = timeMs * 1000;
  }

  set releaseMs(timeMs: number) {
    this.#state.releaseTime = timeMs * 1000;
  }

  get now() {
    return getAudioContext().currentTime;
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
    return Array.from(this.#activeNotes.values()).reduce(
      (sum, nodes) => sum + nodes.size,
      0
    );
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

// setLoopEnabled(enabled: boolean): this {
//   this.#macroLoop.macro.setValueAtTime(enabled ? 1 : 0, this.now);

//   // Cleanup
//   if (enabled) {
//     if (this.#macroLoopEnd.macro.value <= this.#macroLoopStart.macro.value) {
//       this.#macroLoopEnd.macro = this.#bufferDuration;
//     }
//     if (
//       this.#macroLoopStart.macro.value < 0 ||
//       this.#macroLoopStart.macro.value >= this.#macroLoopEnd.macro.value
//     ) {
//       this.#macroLoopStart.macro = 0.01;
//     }
//   }

//   return this;
// }

//   get currentPosition(): number {
//     return this.#currentPosition;
//   }

//   get normalizedPosition(): number {
//     return this.#bufferDuration
//       ? this.#currentPosition / this.#bufferDuration
//       : 0;
//   }

//   testPlayPos(pos: number) {
//     this.#currentPosition = pos;
//   }
// }

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
// }ss
