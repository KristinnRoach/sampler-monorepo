// VoiceNode.ts
// import { createVoiceWorklet } from './voiceWorkletFactory';
// import { WorkletNode } from '@/nodes/worklet/base/WorkletNode';

import { midiToPlaybackRate } from '@/utils/midiUtils';
import {
  createPositionTrackingWorklet,
  PositionTrackingWorklet,
} from '@/nodes/worklet/positionTracker/positionTracker';

export async function createVoice(
  context: BaseAudioContext,
  buffer: AudioBuffer,
  rootNote: number = 60
  // trackPlayPosition?: boolean
): Promise<VoiceNode> {
  const voice = new VoiceNode(context, buffer, rootNote);
  const bufferDuration = buffer.duration;

  // Create the tracker worklet node
  const tracker = await createPositionTrackingWorklet(context, bufferDuration);
  await voice.init(tracker);
  return voice;
}

class VoiceNode extends EventTarget {
  #context: BaseAudioContext;
  #buffer: AudioBuffer;

  #basePlaybackRate: number;
  #rootNote: number; // MIDI note number of the original sample

  #activeSource: AudioBufferSourceNode | null;
  #nextSource: AudioBufferSourceNode | null;
  #voiceGain: GainNode;
  #positionTracker: PositionTrackingWorklet | null;

  // #workletNode: WorkletNode | null;

  #onPositionCallback: ((position: number, normalized: number) => void) | null =
    null;

  constructor(
    context: BaseAudioContext,
    buffer: AudioBuffer,
    rootNote: number = 60
  ) {
    super();
    this.#context = context;
    this.#buffer = buffer;

    // set tuning
    this.#basePlaybackRate = midiToPlaybackRate(rootNote); // todo: test
    this.#rootNote = rootNote;

    this.#voiceGain = context.createGain();
    this.#nextSource = context.createBufferSource();

    this.#activeSource = null;
    this.#positionTracker = null;
  }

  async init(tracker?: PositionTrackingWorklet): Promise<void> {
    // Create the gain node
    this.#voiceGain = this.#context.createGain();
    this.#voiceGain.gain.setValueAtTime(0, this.now());

    // Set the worklet node
    this.#positionTracker = tracker || null;

    // Create source node
    this.#nextSource = this.#prepNextSource(this.#buffer);

    // Connect nodes
    if (this.#positionTracker) {
      this.#positionTracker.setBufferInfo(this.#buffer.length);
      this.#positionTracker.setReportInterval(4);

      // Set up callback if already assigned
      this.#onPositionCallback
        ? this.#positionTracker.onPositionUpdate(this.#onPositionCallback)
        : null; // null?

      this.#nextSource.connect(this.#positionTracker);
      this.#positionTracker.connect(this.#voiceGain);
    } else {
      this.#nextSource.connect(this.#voiceGain);
    }
  }

  setPositionCallback(
    callback: (position: number, normalized: number) => void
  ): void {
    this.#onPositionCallback = callback;

    if (this.#positionTracker) {
      this.#positionTracker.onPositionUpdate(callback);
    }
  }

  #resetPosition(): void {
    if (this.#positionTracker) {
      this.#positionTracker.resetPosition();
    }
  }

  /**
   * Create and configure a buffer source
   * @param buffer Audio buffer to use
   */
  #prepNextSource(buffer: AudioBuffer = this.#buffer): AudioBufferSourceNode {
    const source = new AudioBufferSourceNode(this.#context, {
      buffer: buffer,
    });

    // Set the playback rate
    source.playbackRate.value = this.#basePlaybackRate;

    if (!this.#positionTracker) throw new Error('Worklet node not initialized');

    source.connect(this.#positionTracker);

    // Handle source ending
    source.onended = () => {
      if (source === this.#activeSource) {
        this.#activeSource = null;
      } else if (this.#activeSource !== null) {
        console.warn(
          'check VoiceNode source onended logic, source: ',
          source,
          'activeSource: ',
          this.#activeSource,
          'nextSource: ',
          this.#nextSource
        );
      }
    };

    return source;
  }

  isPlaying(): boolean {
    return this.#activeSource !== null;
  }

  isAvailable(): boolean {
    return this.#activeSource === null && this.#nextSource !== null;
  }

  now(): number {
    return this.#context.currentTime;
  }

  setRootNote(midiNote: number): void {
    this.#rootNote = midiNote;
  }

  getRootNote(): number {
    return this.#rootNote;
  }

  /**
   * Play an audio buffer
   */
  play(
    detuneCents: number = 0,
    voiceGain: number = 1,
    when: number = this.now()
  ): void {
    if (this.isPlaying())
      console.warn('Voice already playing when play() called');

    // Set params not known in advance
    this.#voiceGain!.gain.setValueAtTime(voiceGain, when);

    // Swap sources and play
    this.#activeSource = this.#nextSource;
    this.#activeSource!.detune.setValueAtTime(detuneCents, when);
    this.#activeSource!.start(when);

    // prep next source
    this.#nextSource = this.#prepNextSource(this.#buffer);
    this.#resetPosition();
  }

  forceMakeAvailable(): void {
    // Stop any active source if it's playing
    if (this.#activeSource) {
      try {
        this.#activeSource.stop();
      } catch (e) {
        // Handle the case where it might have already stopped
      }
      this.#activeSource = null;
    }

    // Prepare a fresh source for the next play
    this.#nextSource = this.#prepNextSource(this.#buffer);
  }

  #ensureAllNodesExist(): void {
    // check if they exist and are connected
    if (!this.#voiceGain) console.warn('Gain node not initialized');
    if (!this.#positionTracker) console.warn('Worklet node not initialized');
    if (!this.#activeSource) console.warn('Active source not initialized');
    if (!this.#nextSource) console.warn('Next source not initialized');

    if (this.#activeSource === this.#nextSource)
      throw new Error('Active source is the same as next source');
  }

  triggerRelease(releaseTime: number = 0.1, when: number = this.now()): void {
    this.#ensureAllNodesExist(); // todo: get rid of this method, just for debugging

    if (!this.isPlaying()) throw new Error('No playing source to release');

    this.#activeSource!.stop(when + releaseTime);
  }

  /**
   * Set gain value (0-1)
   */
  setGain(value: number, timeOffset: number = 0): void {
    if (!this.#voiceGain) throw new Error('Gain node not initialized');
    if (value < 0 || value > 1)
      throw new Error('Gain value out of range (0-1)');
    const time = this.#context.currentTime + timeOffset;
    this.#voiceGain.gain.setValueAtTime(value, time);
  }

  /**
   * Get the current gain value
   */
  getGain(): number {
    if (!this.#voiceGain) throw new Error('Gain node not initialized');
    return this.#voiceGain.gain.value;
  }

  /**
   * Connect the voice node's output to a destination
   */
  connect(destination: AudioNode | AudioParam): VoiceNode {
    if (!this.#voiceGain) throw new Error('Gain node not initialized');
    this.#voiceGain.connect(destination as any);
    return this;
  }

  /**
   * Disconnect the voice node from all destinations
   */
  disconnect(): void {
    this.#voiceGain?.disconnect();
  }
}

export type { VoiceNode };
