// Todo: only stop the most recent voice for midiNote
// Sampler.ts
import { LibInstrument, InstrumentType, LibVoiceNode } from '@/LibNode';
import { createNodeId, NodeID } from '@/state/registry/NodeIDs';
import { getAudioContext } from '@/context';

import { PressedModifiers } from '@/input';
import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';
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
  #messages: MessageBus<Message>;

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
    this.#voicePool.applyToAll((voice) => {
      voice.onMessage('voice:position', (data) => {
        if (this.#trackPlaybackPosition && voice === this.#mostRecentSource)
          this.#messages.sendMessage('voice:position', data);
      });
    });

    this.#isInitialized = true;

    if (audioBuffer?.duration) {
      this.loadSample(audioBuffer, audioBuffer.sampleRate);
      this.#voicePool.applyToAll((voice) => this.#connectToMacros(voice));
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

  #connectToMacros(voice: SampleVoice): void {
    this.#macroLoopStart.addTarget(voice.getParam('loopStart')!, 'loopStart');
    this.#macroLoopEnd.addTarget(voice.getParam('loopEnd')!, 'loopEnd');
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

  play(
    midiNote: number,
    velocity: number = 100,
    modifiers: Partial<PressedModifiers> = {}
  ): this {
    console.debug(this.getDebugState());

    const voice = this.#voicePool.allocateNode();
    if (!voice) return this;

    const safeVelocity = isMidiValue(velocity) ? velocity : 100; // default velocity

    // Need to set the loop state on the newly allocated voice
    voice.setLoopEnabled(modifiers.caps ?? this.#loopEnabled); // ? both caps and loopenabled ?

    voice.trigger({
      // consider just passing the loop enabled state here?
      midiNote,
      attack_sec: this.#state.attack_sec,
      velocity: safeVelocity,
    });

    if (!this.#activeMidiNoteToVoice.has(midiNote)) {
      this.#activeMidiNoteToVoice.set(midiNote, new Set());
    }
    this.#activeMidiNoteToVoice.get(midiNote)!.add(voice);

    // Position tracking
    if (this.#trackPlaybackPosition) {
      if (this.#mostRecentSource) {
        this.#mostRecentSource.enablePositionTracking = false;
      }
      this.#mostRecentSource = voice;
      voice.enablePositionTracking = true;
    }

    this.sendMessage('note:on', { midiNote, velocity: safeVelocity });
    return this;
  }

  release(midiNote: number, modifiers: Partial<PressedModifiers> = {}): this {
    const voices = this.#activeMidiNoteToVoice.get(midiNote);
    if (!voices || voices.size === 0) {
      console.warn(`Could not release note ${midiNote}`);
      return this;
    }

    // Always release the voices regardless of loop state
    voices.forEach((voice) => {
      voice.release({ release_sec: this.#state.release_sec });
      voice.enablePositionTracking = false;
      if (this.#mostRecentSource === voice) this.#mostRecentSource = null;
    });

    this.sendMessage('note:off', { midiNote });
    return this;
  }

  stopAll() {
    const callback = (voice: LibVoiceNode) => voice.stop();

    tryCatch(
      () => this.#voicePool.applyToActive(callback),
      'Failed to stop all voices'
    );

    return this;
  }

  releaseAll(): this {
    const callback = (voice: LibVoiceNode) => voice.release();

    tryCatch(
      () => this.#voicePool.applyToActive(callback),
      'Failed to release all voices'
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
    // Skip if no change
    if (this.#loopEnabled === enabled) return this;

    // Update internal state
    this.#loopEnabled = enabled;

    // Update all active voices
    this.#voicePool.applyToActive((voice: SampleVoice) => {
      voice.setLoopEnabled(enabled);
    });

    // Notify listeners
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
      this.#voicePool.nodes.forEach((voice) => {
        voice.enablePositionTracking = false;
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

      this.#context = null as unknown as AudioContext;

      this.#messages = null as unknown as MessageBus<Message>;
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

  get activeVoicesCount(): number {
    return Array.from(this.#activeMidiNoteToVoice.values()).reduce(
      (sum, voices) => sum + voices.size,
      0
    );
  }

  get voiceCount(): number {
    return this.#voicePool.nodes.length;
  }

  get sampleDuration(): number {
    return this.#bufferDuration;
  }

  get volume(): number {
    return this.#output.gain.value;
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

  get isInitialized() {
    return this.#isInitialized;
  }

  get isLoaded() {
    return this.#isLoaded;
  }

  // Add a debug method to check state
  getDebugState(): object {
    return {
      loopEnabled: this.#loopEnabled,
      activeVoices: this.#voicePool.activeCount,
      activeNotes: Array.from(this.#activeMidiNoteToVoice.keys()),
      loopStart: this.loopStart,
      loopEnd: this.loopEnd,
    };
  }
}
