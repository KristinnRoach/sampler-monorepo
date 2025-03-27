import { VoiceNode, createVoice } from '@/nodes/voice/VoiceNode';
import { midiToDetune } from '@/utils/midiUtils';
import { getAudioContext } from '@/context/globalAudioContext';
import {
  createWorkletNode,
  BaseWorkletNode,
} from '@/base/classes/BaseWorkletNode';

// TEMP
import { registry } from '@/store/WorkletRegistry';

export async function createSingleSamplePlayer(
  id: string,
  sampleBuffer: AudioBuffer,
  options?: {
    polyphony?: number;
    rootNote?: number;
  },
  onPositionUpdate?: (position: number, normalized: number) => void,
  output?: AudioNode
): Promise<SingleSamplePlayer> {
  const audioContext = await getAudioContext();
  if (!audioContext) throw new Error('AudioContext is not available');

  if (!output) {
    output = audioContext.destination;
    console.log('Connecting sample player output to AudioContext destination.');
  }

  const shouldTrackPosition = onPositionUpdate !== undefined || false;

  const player = new SingleSamplePlayer(
    id,
    audioContext,
    sampleBuffer,
    options
  );

  await player.init(output, shouldTrackPosition);

  if (onPositionUpdate && player.isInitialized) {
    player.onPositionUpdate(onPositionUpdate);
  }

  return player;
}

// Allocation strategy type - can be expanded in the future
export type VoiceAllocationStrategy = 'oldest-first' | 'quietest-first';

class SingleSamplePlayer extends EventTarget {
  // Core properties
  readonly id: string;
  #context: BaseAudioContext;
  #buffer: AudioBuffer;

  // Voice management
  #voices: VoiceNode[] = [];
  #polyphony: number;
  #rootNote: number;
  #allocationStrategy: VoiceAllocationStrategy = 'oldest-first';

  // Audio routing
  #playerGain: GainNode;
  #loopProcessor: BaseWorkletNode | null = null;

  isInitialized: boolean = false;

  constructor(
    id: string,
    context: BaseAudioContext,
    buffer: AudioBuffer,
    options?: {
      polyphony?: number;
      rootNote?: number;
    }
  ) {
    super();
    this.id = id;
    this.#context = context;
    this.#buffer = buffer;
    this.#polyphony = options?.polyphony || 8;
    this.#rootNote = options?.rootNote || 60;

    // Create the main output gain node
    this.#playerGain = context.createGain();
    this.#playerGain.gain.value = 1.0;
  }

  async init(
    output: AudioNode = this.#context.destination,
    trackPlayPosition: boolean
  ): Promise<void> {
    // TEMP
    if (!this.#context.audioWorklet) {
      throw new Error('AudioWorklet is not supported in this context');
    }

    // Check if the processor is already registered (DEFINED?)
    const processorName = 'loop-processor';
    if (!registry.hasRegistered(processorName)) {
      // Register the processor
      await this.#context.audioWorklet.addModule(
        new URL(`./processors/${processorName}.js`, import.meta.url)
      );
    }

    // Create the loop processor
    this.#loopProcessor = createWorkletNode(this.#context, 'loop-processor');

    if (!this.#loopProcessor) {
      throw new Error('Failed to create loop processor');
    }

    if (this.#loopProcessor.port) {
      this.#loopProcessor.port.postMessage({
        type: 'init',
        buffer: this.#buffer,
        trackPlayPosition,
      });
    }

    // Initialize the voice pool
    for (let i = 0; i < this.#polyphony; i++) {
      const voice = await createVoice(
        this.#context,
        this.#buffer,
        this.#rootNote,
        trackPlayPosition
      );
      voice.connect(this.#loopProcessor);

      this.#voices.push(voice);
    }

    this.#loopProcessor.connect(this.#playerGain);
    this.#playerGain.connect(output);

    // this.#loopProcessor.port.postMessage({
    //   type: 'set-voices',
    //   voices: this.#voices.map((voice) => voice.id),
    // });

    this.isInitialized = true;
  }

  /**
   * Play a note using the sample
   * @param midiNote MIDI note number to play
   * @param velocity Note velocity (0-1)
   * @param startTime Time to start playback (defaults to now)
   * @returns The voice being used, or null if no voice was available
   */
  play(
    midiNote: number,
    velocity: number = 1.0,
    startTime?: number
  ): VoiceNode | null {
    const detune = midiToDetune(midiNote, this.#rootNote);
    const voice = this.#allocateVoice();

    if (voice) {
      voice.play(detune, velocity, startTime);
      return voice;
    }

    return null;
  }

  /**
   * Set a callback to receive position updates from all voices
   */
  onPositionUpdate(callback: (position: number, normalized: number) => void) {
    this.#voices.forEach((voice) => {
      voice.setPositionCallback(callback);
    });
  }

  /**
   * Set the voice allocation strategy
   */
  setAllocationStrategy(strategy: VoiceAllocationStrategy): void {
    this.#allocationStrategy = strategy;
  }

  /**
   * Get a voice according to the current allocation strategy
   */
  #allocateVoice(): VoiceNode | null {
    // First try to find an available voice
    const availableVoice = this.#voices.find((v) => v.isAvailable());
    if (availableVoice) {
      // Move to the end of the array (mark as recently used)
      this.#moveVoiceToEnd(availableVoice);
      return availableVoice;
    }

    // If no voices are available, use the allocation strategy to steal one
    if (
      this.#allocationStrategy === 'oldest-first' &&
      this.#voices.length > 0
    ) {
      // Get the oldest voice (first in the array)
      const oldestVoice = this.#voices[0];

      // Reset the voice before reusing it
      oldestVoice.forceMakeAvailable();

      // Move to the end of the array (mark as recently used)
      this.#moveVoiceToEnd(oldestVoice);
      return oldestVoice;
    }

    // Future implementation: quietest-first strategy
    // if (this.#allocationStrategy === 'quietest-first') {
    //   // Find the voice with the lowest current gain
    //   const quietestVoice = this.#findQuietestVoice();
    //   if (quietestVoice) {
    //     this.#moveVoiceToEnd(quietestVoice);
    //     return quietestVoice;
    //   }
    // }

    return null;
  }

  /**
   * Move a voice to the end of the voices array (marking it as most recently used)
   */
  #moveVoiceToEnd(voice: VoiceNode): void {
    const index = this.#voices.indexOf(voice);
    if (index > -1) {
      this.#voices.splice(index, 1);
      this.#voices.push(voice);
    }
  }

  /**
   * Get the number of currently active voices
   */
  getActiveVoiceCount(): number {
    return this.#voices.filter((v) => !v.isAvailable()).length;
  }

  /**
   * Get the total polyphony setting
   */
  get polyphony(): number {
    return this.#polyphony;
  }

  set polyphony(value: number) {
    if (value < 1) {
      throw new Error('Polyphony must be at least 1');
    }
    if (value > 32) {
      throw new Error('Polyphony cannot exceed 32');
    }

    this.#polyphony = value;
  }

  /**
   * Set the master volume of the sample player
   */
  setVolume(value: number): void {
    if (value < 0 || value > 1) {
      throw new Error('Volume value must be between 0 and 1');
    }
    this.#playerGain.gain.value = value;
  }

  /**
   * Get the current master volume
   */
  getVolume(): number {
    return this.#playerGain.gain.value;
  }

  /**
   * Stop all playing voices
   */
  stopAll(releaseTime: number = 0.1): void {
    this.#voices.forEach((voice) => {
      if (!voice.isAvailable()) {
        voice.triggerRelease(releaseTime);
      }
    });
  }

  /**
   * Connect the output to a destination node
   */
  connect(destination?: AudioNode): this {
    if (!destination) {
      destination = this.#context.destination;
    }
    if (!(destination instanceof AudioNode)) {
      throw new Error('Destination must be an AudioNode');
    }
    // Disconnect from the current destination if any
    this.#playerGain.disconnect();

    // Connect to the new destination
    this.#playerGain.connect(destination);
    return this;
  }

  /**
   * Disconnect from all destinations
   */
  disconnect(): void {
    this.#playerGain.disconnect();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAll(0);
    this.disconnect();
    this.#voices.forEach((voice) => voice.disconnect());
    this.#voices = [];
  }
}

export type { SingleSamplePlayer };
