// VoiceNode.ts
import { WorkletNode } from '../worklet/workletFactory';
import { createVoiceProcessor } from './VoiceProcessorFactory';

export class VoiceNode {
  #context: BaseAudioContext;
  #buffer: AudioBuffer;
  #output: AudioNode;

  // #tuning; {rootMidiNote: number; cents: number, rootPlaybackRate: number};
  #basePlaybackRate: number;
  #rootNote: number; // MIDI note number of the original sample

  // TODO: finish the activeSource and nextSource logic (already in old VoiceNode.txt)
  #activeSource: AudioBufferSourceNode | null;
  #playingSources: boolean[]; // [isActiveSourcePlaying, isNextSourcePlaying]
  #nextSource: AudioBufferSourceNode | null;
  #workletNode: WorkletNode | null;
  #gainNode: GainNode | null;

  constructor(
    context: BaseAudioContext,
    buffer: AudioBuffer,
    output: AudioNode,
    rootNote: number = 60
  ) {
    this.#context = context;
    this.#buffer = buffer;
    this.#output = output;

    // set tuning
    this.#basePlaybackRate = this.midiToPlaybackRate(rootNote); // todo: test
    this.#rootNote = rootNote;

    this.#gainNode = null;
    this.#activeSource = null;
    this.#nextSource = null;
    this.#workletNode = null;

    this.#playingSources = [false, false];
  }

  midiToPlaybackRate(
    midiNote: number,
    baseNote: number = this.#rootNote
  ): number {
    return Math.pow(2, (midiNote - baseNote) / 12);
  }

  midiToDetune(midiNote: number, baseNote: number = this.#rootNote): number {
    return (midiNote - baseNote) * 100;
  }

  async init(): Promise<void> {
    // Create the gain node
    this.#gainNode = this.#context.createGain();
    this.#gainNode.gain.setValueAtTime(0, this.#now());

    // create the worklet node
    this.#workletNode = await createVoiceProcessor(
      this.#context,
      'voice-processor'
    );

    // Create source node
    this.#nextSource = this.prepNextSource(this.#buffer);

    // Connect nodes
    this.#nextSource.connect(this.#workletNode);
    this.#workletNode.connect(this.#gainNode);
    this.#gainNode.connect(this.#output);
  }

  // todo: make the worklet emit an event for this
  // #isPlaying(): boolean {
  //   return true;
  // }

  /**
   * Create and configure a buffer source
   * @param buffer Audio buffer to use
   */
  private prepNextSource(
    buffer: AudioBuffer = this.#buffer
  ): AudioBufferSourceNode {
    const source = new AudioBufferSourceNode(this.#context, {
      buffer: buffer,
    });

    // Set the playback rate
    source.playbackRate.value = this.#basePlaybackRate;

    if (!this.#workletNode) throw new Error('Worklet node not initialized');

    source.connect(this.#workletNode);

    // Handle source ending
    source.onended = () => {
      if (source === this.#activeSource) {
        this.#activeSource = null;
      }
    };

    return source;
  }

  #now(): number {
    return this.#context.currentTime;
  }

  #isPlaying(source: 'active' | 'next' | 'either' = 'either'): boolean {
    switch (source) {
      case 'active':
        return this.#playingSources[0];
      case 'next':
        return this.#playingSources[1];
      case 'either':
        return this.#playingSources[0] || this.#playingSources[1];
    }
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
    when: number = this.#now()
  ): void {
    // if (!this.#canPlay) throw new Error('canPlay is false');

    // Set params not known in advance
    this.#gainNode!.gain.setValueAtTime(voiceGain, when);

    // Swap sources and play
    this.#activeSource = this.#nextSource;
    this.#activeSource!.detune.setValueAtTime(detuneCents, when);
    this.#activeSource!.start(when);

    this.#playingSources[0] = true;

    // prep next source
    this.#nextSource = this.prepNextSource(this.#buffer);
  }

  checkAllNodesDebug(): void {
    // check if they exist and are connected
    if (!this.#gainNode) console.warn('Gain node not initialized');
    if (!this.#workletNode) console.warn('Worklet node not initialized');
    if (!this.#activeSource) console.warn('Active source not initialized');
    if (!this.#nextSource) console.warn('Next source not initialized');

    if (this.#activeSource === this.#nextSource)
      throw new Error('Active source is the same as next source');
  }

  triggerRelease(releaseTime: number = 0.1, when: number = this.#now()): void {
    this.checkAllNodesDebug(); // todo: get rid of this method, just for debugging

    if (!this.#playingSources[0])
      throw new Error('No playing source to release');

    this.#activeSource!.stop(when + releaseTime);

    this.#playingSources[0] = false;
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.#activeSource?.stop();
    this.#playingSources[0] = false;
  }

  /**
   * Set gain value (0-1)
   */
  setGain(value: number, timeOffset: number = 0): void {
    if (!this.#gainNode) throw new Error('Gain node not initialized');
    if (value < 0 || value > 1)
      throw new Error('Gain value out of range (0-1)');
    const time = this.#context.currentTime + timeOffset;
    this.#gainNode.gain.setValueAtTime(value, time);
  }

  /**
   * Get the current gain value
   */
  getGain(): number {
    if (!this.#gainNode) throw new Error('Gain node not initialized');
    return this.#gainNode.gain.value;
  }

  /**
   * Connect the voice node's output to a destination
   */
  connect(destination: AudioNode | AudioParam): VoiceNode {
    if (!this.#gainNode) throw new Error('Gain node not initialized');
    this.#gainNode.connect(destination as any);
    return this;
  }

  /**
   * Disconnect the voice node from all destinations
   */
  disconnect(): void {
    this.#gainNode?.disconnect();
  }

  /**
   * Check if the voice is currently playing
   */
  isAvailable(): boolean {
    return !this.#isPlaying();
  }
}
