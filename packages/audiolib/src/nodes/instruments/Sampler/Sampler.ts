// Todo: only stop the most recent voice for midiNote
// Sampler.ts
import { LibInstrument, InstrumentType, LibVoiceNode } from '@/LibNode';
import { createNodeId, NodeID } from '@/store/state/IdStore';
import { getAudioContext } from '@/context';

import { PressedModifiers } from '@/input';
import { Message, MessageHandler, createMessageBus } from '@/events';
import { assert, tryCatch, isMidiValue, findZeroCrossings } from '@/utils';

import { SampleVoice } from '@/nodes/voices/voice_nodes/sample/SampleVoice';
import { Pool } from '@/nodes/collections/Pool';
import { MacroParam } from '@/nodes/params';
import { DEFAULT_SAMPLER_SETTINGS, InstrumentState } from './defaults';

export class Sampler implements LibInstrument {
  readonly nodeId: NodeID;
  readonly nodeType: InstrumentType = 'sampler';

  #bufferDuration: number = 0;

  #context: AudioContext;
  #output: GainNode;
  #voicePool: Pool<SampleVoice>;
  #messages;

  #activeMidiNoteToVoice = new Map<number, Set<SampleVoice>>();
  #state: InstrumentState = DEFAULT_SAMPLER_SETTINGS;

  #loopEnabled: boolean = false;
  #loopRampTime: number = 0.2;

  #macroLoopStart: MacroParam;
  #macroLoopEnd: MacroParam;

  #isInitialized = false;
  #isLoaded = false;

  #zeroCrossings: number[] = []; // cache maybe needed later
  #useZeroCrossings = true;

  #trackPlaybackPosition = false;
  #mostRecentSource: SampleVoice | null = null;

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

    // Initialize pool with type only (removed polyphony parameter)
    this.#voicePool = new Pool<SampleVoice>();

    // Pre-create voices, max num voices === polyphony
    this.#preCreateVoices(context, polyphony);

    // for now just track the latest played note instead of all..
    this.#voicePool.applyToAll((node) => {
      node.onMessage('voice:position', (data) => {
        if (this.#trackPlaybackPosition && node === this.#mostRecentSource)
          this.#messages.sendMessage('voice:position', data);
      });
    });

    this.#isInitialized = true;

    if (audioBuffer?.duration) {
      this.loadSample(audioBuffer, audioBuffer.sampleRate);
      this.#voicePool.applyToAll((node) => this.#connectToMacros(node));
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

  #preCreateVoices(context: AudioContext, polyphony: number): void {
    for (let i = 0; i < polyphony; i++) {
      const voice = new SampleVoice(context);
      voice.connect(this.#output);
      this.#voicePool.add(voice);
    }
  }

  #connectToMacros(node: SampleVoice): void {
    // (node: SourceNode, params: string[] | AudioParam[]) // make generic
    this.#macroLoopStart.addTarget(node.getParam('loopStart')!, 'loopStart');
    this.#macroLoopEnd.addTarget(node.getParam('loopEnd')!, 'loopEnd');
  }

  #resetMacros(bufferDuration: number = this.#bufferDuration) {
    this.#macroLoopEnd.macro.setValueAtTime(bufferDuration, this.now);
    this.#macroLoopStart.macro.setValueAtTime(0, this.now);

    if (!this.#useZeroCrossings || !(this.#zeroCrossings.length > 0)) {
      return this;
    }
    // set zero crossings
    this.#macroLoopStart.setAllowedParamValues(this.#zeroCrossings);
    this.#macroLoopEnd.setAllowedParamValues(this.#zeroCrossings);

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

    const allVoices = this.#voicePool.nodes;
    assert(allVoices.length > 0, 'No voices to load sample!');

    const promises = allVoices.map((voice) => voice.loadBuffer(buffer));
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

  play(midiNote: number, modifiers: PressedModifiers, velocity?: number): this {
    // console.log('Sampler play:', { midiNote, modifiers, velocity }); // Debug log
    const node = this.#voicePool.allocateNode();
    if (!node) return this;

    // Ensure velocity is a valid number
    const safeVelocity = isMidiValue(velocity) ? velocity : 100; // default velocity

    node.trigger({
      midiNote,
      attack_sec: this.#state.attack_sec,
      velocity: safeVelocity,
    });

    if (!this.#activeMidiNoteToVoice.has(midiNote)) {
      this.#activeMidiNoteToVoice.set(midiNote, new Set());
    }
    this.#activeMidiNoteToVoice.get(midiNote)!.add(node);

    // Position tracking
    if (this.#trackPlaybackPosition) {
      if (this.#mostRecentSource) {
        this.#mostRecentSource.enablePositionTracking = false;
      }
      this.#mostRecentSource = node;
      node.enablePositionTracking = true;
    }

    this.sendMessage('note:on', { midiNote, velocity: safeVelocity });
    return this;
  }

  release(midiNote: number, modifiers: PressedModifiers) {
    const nodes = this.#activeMidiNoteToVoice.get(midiNote);
    if (!nodes || nodes.size === 0) {
      console.warn(`Could not release note ${midiNote}`);
      return this;
    }

    if (this.#loopEnabled !== modifiers.caps) {
      console.log('Updating loop state:', modifiers.caps);
      this.setLoopEnabled(modifiers.caps);
    }

    nodes.forEach((node) => {
      node.release({ release_sec: this.#state.release_sec });
      node.enablePositionTracking = false;
      if (this.#mostRecentSource === node) this.#mostRecentSource = null;
    });

    this.sendMessage('note:off', { midiNote });
    return this;
  }

  stopAll() {
    const callback = (node: LibVoiceNode) => node.stop();

    tryCatch(
      () => this.#voicePool.applyToAllActive(callback),
      'Failed to stop all nodes'
    );

    return this;
  }

  releaseAll(): this {
    const callback = (node: LibVoiceNode) => node.release();

    tryCatch(
      () => this.#voicePool.applyToAllActive(callback),
      'Failed to release all nodes'
    );

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

  get loopEnabled() {
    return this.#loopEnabled;
  }

  setLoopEnabled(enabled: boolean): this {
    console.log('setLoopEnabled called with:', enabled); // Debug log
    if (this.#loopEnabled === enabled) return this;

    this.#loopEnabled = enabled;

    // Validate loop points when enabling
    if (enabled) {
      const start = this.#macroLoopStart.getValue();
      const end = this.#macroLoopEnd.getValue();

      if (end <= start || start < 0) {
        this.#macroLoopStart.macro.setValueAtTime(0, this.now);
        this.#macroLoopEnd.macro.setValueAtTime(this.#bufferDuration, this.now);
      }
    }

    // Update loop state for all active voices
    this.#voicePool.applyToAllActive((node: SampleVoice) => {
      console.log('Updating voice loop state:', enabled); // Debug log
      node.setLoopEnabled(enabled);
    });

    this.sendMessage('loop:state', { enabled });
    return this;
  }
  setLoopStart(targetValue: number, rampTime: number = this.#loopRampTime) {
    this.setLoopPoint('start', targetValue, this.loopEnd, rampTime);
    return this;
  }

  setLoopEnd(targetValue: number, rampTime: number = this.#loopRampTime) {
    this.setLoopPoint('end', this.loopStart, targetValue, rampTime);
    return this;
  }

  setLoopPoint(
    loopPoint: 'start' | 'end',
    start: number,
    end: number,
    rampTime: number = this.#loopRampTime
  ) {
    if (start < 0 || end > this.#bufferDuration || start >= end) return this;

    if (loopPoint === 'start') {
      this.#macroLoopStart.ramp(start, rampTime, end);
    } else {
      this.#macroLoopEnd.ramp(end, rampTime, start);
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
      this.#voicePool.nodes.forEach((node) => {
        node.enablePositionTracking = false;
      });
    }
  }

  dispose(): void {
    try {
      this.stopAll();
      this.#mostRecentSource = null;

      if (this.#voicePool) {
        this.#voicePool.dispose();
        this.#voicePool = null as unknown as Pool<SampleVoice>;
      }

      this.#activeMidiNoteToVoice.clear();

      if (this.#output) {
        this.#output.disconnect();
        this.#output = null as unknown as GainNode;
      }

      this.#macroLoopStart?.dispose();
      this.#macroLoopEnd?.dispose();
      this.#macroLoopStart = null as unknown as MacroParam;
      this.#macroLoopEnd = null as unknown as MacroParam;

      // Reset state variables
      this.#bufferDuration = 0;
      this.#isInitialized = false;
      this.#isLoaded = false;
      this.#zeroCrossings = [];
      this.#useZeroCrossings = false;
      this.#loopRampTime = 0;
      this.#loopEnabled = false;

      // Clear context reference
      this.#context = null as unknown as AudioContext;
    } catch (error) {
      console.error(`Error disposing Sampler ${this.nodeId}:`, error);
    }
  }

  set attack_sec(timeSeconds: number) {
    this.#state.attackTime = timeSeconds;
  }

  set release_sec(timeSeconds: number) {
    this.#state.releaseTime = timeSeconds;
  }

  get now() {
    return getAudioContext().currentTime;
  }

  get attack_sec(): number {
    return this.#state.attackTime;
  }

  get release_sec(): number {
    return this.#state.releaseTime;
  }

  get isPlaying(): boolean {
    return this.#voicePool.activeCount > 0;
  }

  get activeNotesCount(): number {
    return Array.from(this.#activeMidiNoteToVoice.values()).reduce(
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
    return this.#voicePool.nodes.length;
  }

  get isLooping(): boolean {
    return this.#loopEnabled;
  }

  get loopStart(): number {
    return this.#macroLoopStart.getValue();
  }

  get loopEnd(): number {
    return this.#macroLoopEnd.getValue();
  }
}
