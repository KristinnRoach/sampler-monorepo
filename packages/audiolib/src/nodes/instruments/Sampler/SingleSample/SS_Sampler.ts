import { LibInstrument, InstrumentType, LibVoiceNode } from '@/LibNode';
import { createNodeId, NodeID } from '@/state/registry/NodeIDs';
import { getAudioContext } from '@/context';

import { PressedModifiers, checkGlobalLoopState } from '@/input'; // todo

import {
  Message,
  MessageHandler,
  createMessageBus,
  MessageBus,
} from '@/events';
import {
  assert,
  tryCatch,
  isValidAudioBuffer,
  isMidiValue,
  findZeroCrossings,
} from '@/utils';

import { SampleVoice } from '@/nodes/instruments/Sampler/SingleSample/SampleVoice';
import { Pool } from '@/nodes/collections/Pool';
import { MacroParam } from '@/nodes/params';
// import { DEFAULT_SAMPLE_VOICE_SETTINGS, SampleVoiceSettings } from './defaults';
import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';

export class Sampler implements LibInstrument {
  readonly nodeId: NodeID;
  readonly nodeType: InstrumentType = 'sampler';

  #bufferDuration: number = 0;

  #context: AudioContext;
  #output: InstrumentMasterBus;
  #voicePool: Pool<SampleVoice>;
  #messages: MessageBus<Message>;

  #activeMidiNoteToVoice = new Map<number, Set<SampleVoice>>();

  // todo: clean up and standardize all state management
  // (starting with instrument user adjustable params + defults)
  #loopRampDuration: number = 0.2;

  #macroLoopStart: MacroParam;
  #macroLoopEnd: MacroParam;

  #startOffset: number = 0;
  #endOffset: number = 0;

  #attack: number = 0.01;
  #release: number = 0.1;

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
    this.#messages = createMessageBus<Message>(this.nodeId);

    // Initialize the output bus
    this.#output = new InstrumentMasterBus();

    // Initialize macro params
    this.#macroLoopStart = new MacroParam(context, 0);
    this.#macroLoopEnd = new MacroParam(context, 0);

    // Initialize pool with type only (removed polyphony parameter)
    this.#voicePool = new Pool<SampleVoice>();

    // Pre-create voices, max num voices === polyphony
    this.#preCreateVoices(context, polyphony);

    // Set up voice event handling
    this.#voicePool.applyToAll((voice) => {
      // Connect each voice to the master bus input
      voice.connect(this.#output.input);

      voice.onMessage('voice:ended', (data) => {
        // Handle voice ended in Sampler
        this.#activeMidiNoteToVoice.forEach((voices, midiNote) => {
          if (voices.has(voice)) {
            voices.delete(voice);
            if (voices.size === 0) {
              this.#activeMidiNoteToVoice.delete(midiNote);
            }
          }
        });

        // Return voice to pool
        this.#voicePool.returnNode(voice);

        // Forward position tracking events
        if (this.#mostRecentSource === voice) {
          this.#mostRecentSource = null;
        }
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

  connect(destination: AudioNode): this {
    this.#output.connect(destination);
    return this;
  }

  disconnect(): void {
    this.#output.disconnect();
  }

  #preCreateVoices(context: AudioContext, polyphony: number): void {
    for (let i = 0; i < polyphony; i++) {
      const voice = new SampleVoice(context);
      voice.connect(this.#output.input);
      this.#voicePool.add(voice);
    }
  }

  #connectToMacros(voice: SampleVoice): void {
    this.#macroLoopStart.addTarget(voice.getParam('loopStart')!, 'loopStart');
    this.#macroLoopEnd.addTarget(voice.getParam('loopEnd')!, 'loopEnd');
  }

  #resetMacros(bufferDuration: number = this.#bufferDuration) {
    const lastZero =
      this.#zeroCrossings[this.#zeroCrossings.length - 1] ?? bufferDuration;
    const firstZero = this.#zeroCrossings[0] ?? 0;
    this.#macroLoopEnd.macro.setValueAtTime(lastZero, this.now);
    this.#macroLoopStart.macro.setValueAtTime(firstZero, this.now);

    // consider whether startOffset and endOffset should be macros

    if (this.#useZeroCrossings && this.#zeroCrossings.length > 0) {
      this.#macroLoopStart.setAllowedParamValues(this.#zeroCrossings);
      this.#macroLoopEnd.setAllowedParamValues(this.#zeroCrossings);
    }
    // todo: set scale - allowed durations ...
    return this;
  }

  async loadSample(
    buffer: AudioBuffer,
    modSampleRate?: number
  ): Promise<boolean> {
    assert(isValidAudioBuffer(buffer));

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

    if (this.#useZeroCrossings) {
      const zeroes = findZeroCrossings(buffer);
      // reset start and end offset
      this.#startOffset = zeroes[0] || 0; // or saved value
      const lastZero = zeroes[zeroes.length - 1];
      this.#endOffset = buffer.duration - lastZero || 0;
      // cache zero crossings
      this.#zeroCrossings = zeroes;
    }

    console.debug(
      `use zeroes ? ${this.#useZeroCrossings}, 
      startOffset: ${this.#startOffset}, 
      endOffset: ${this.#endOffset}`
    );

    const allVoices = this.#voicePool.nodes;
    assert(allVoices.length > 0, 'No voices to load sample!');

    const promises = allVoices.map((voice) => voice.loadBuffer(buffer));
    const result = await tryCatch(
      Promise.all(promises),
      'Failed to load sample'
    );
    if (result.error) {
      return false;
    }

    this.#resetMacros(buffer.duration);
    this.#bufferDuration = buffer.duration;
    this.setLoopEnd(buffer.duration); // for now, use saved loopEnd if exists, when implemented

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
    voice.setLoopEnabled(checkGlobalLoopState()); //modifiers.caps ?? this.#loopEnabled); // ? both caps and loopenabled ?

    voice.trigger({
      // consider just passing the loop enabled state here?
      midiNote,
      velocity: safeVelocity,
      attack_sec: this.#attack,
      startOffset: this.#startOffset,
      endOffset: this.#endOffset,
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
      // console.warn(`Could not release note ${midiNote}`);
      return this;
    }

    // Always release the voices regardless of loop state
    voices.forEach((voice) => {
      voice.release({ release_sec: this.#release });
      voice.enablePositionTracking = false;
      if (this.#mostRecentSource === voice) this.#mostRecentSource = null;
    });

    // Note: voice:ended event handler removes voice from activeMidiNoteToVoice

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

  setAttackTime(seconds: number) {
    this.#attack = seconds;
  }

  setReleaseTime(seconds: number) {
    this.#release = seconds;
  }

  setSampleStartOffset(seconds: number) {
    this.#startOffset = seconds;
  }

  setSampleEndOffset(seconds: number) {
    this.#endOffset = seconds;
  }

  // todo: choose global vs passed in 'enabled' AFTER designing state mgmt
  setLoopEnabled(enabled: boolean): this {
    // Skip if no change
    // if (this.#loopEnabled === enabled) return this;

    // Update internal state
    // this.#loopEnabled = enabled;

    // Todo cleanup after test:
    enabled = checkGlobalLoopState();

    // Update all active voices
    this.#voicePool.applyToActive((voice: SampleVoice) => {
      voice.setLoopEnabled(enabled);
    });

    // Notify listeners
    this.sendMessage('loop:state', { enabled });
    return this;
  }
  setLoopStart(targetValue: number, rampTime: number = this.#loopRampDuration) {
    this.setLoopPoint('start', targetValue, this.loopEnd, rampTime);
    return this;
  }

  setLoopEnd(targetValue: number, rampTime: number = this.#loopRampDuration) {
    this.setLoopPoint('end', this.loopStart, targetValue, rampTime);
    return this;
  }

  setLoopPoint(
    loopPoint: 'start' | 'end',
    start: number,
    end: number,
    rampDuration: number = this.#loopRampDuration
  ) {
    if (start < 0 || end > this.#bufferDuration || start >= end) return this;

    const RAMP_FACTOR = 2;
    const scaledRampTime = rampDuration * RAMP_FACTOR;

    if (loopPoint === 'start') {
      this.#macroLoopStart.ramp(start, scaledRampTime, end);
    } else {
      this.#macroLoopEnd.ramp(end, scaledRampTime, start);
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

  startLevelMonitoring(intervalMs?: number) {
    this.#output.startLevelMonitoring(intervalMs);
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
        this.#output.dispose();
        this.#output = null as unknown as InstrumentMasterBus;
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
      this.#loopRampDuration = 0;
      // this.#loopEnabled = false;

      this.#context = null as unknown as AudioContext;

      this.#messages = null as unknown as MessageBus<Message>;
    } catch (error) {
      console.error(`Error disposing Sampler ${this.nodeId}:`, error);
    }
  }

  get now() {
    return getAudioContext().currentTime;
  }

  // set attack_sec(timeSeconds: number) {
  //   this.#state.attackTime = timeSeconds;
  // }

  // set release_sec(timeSeconds: number) {
  //   this.#state.releaseTime = timeSeconds;
  // }

  // get attack_sec(): number {
  //   return this.#state.attackTime;
  // }

  // get release_sec(): number {
  //   return this.#state.releaseTime;
  // }

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
    return this.#output.volume;
  }

  set volume(value: number) {
    this.#output.volume = value;
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
      loopEnabled: checkGlobalLoopState(), // this.#loopEnabled,
      activeVoices: this.#voicePool.activeCount,
      activeNotes: Array.from(this.#activeMidiNoteToVoice.keys()),
      loopStart: this.loopStart,
      loopEnd: this.loopEnd,
    };
  }
}
