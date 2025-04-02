import { getAudioContext } from '@/context/globalAudioContext';
import { VoiceNode } from '@/nodes/voice/VoiceNode';
import { createLoopControllerNode } from '@/processors/loop/createLoopController';
import { DefaultEventBus } from '@/events';

export async function createSingleSamplePlayer(
  id: string,
  sampleBuffer: AudioBuffer,
  options?: {
    polyphony?: number;
    rootNote?: number;
  },
  outputDestination?: AudioNode
): Promise<SingleSamplePlayer> {
  try {
    const audioContext = await getAudioContext();
    outputDestination = outputDestination || audioContext.destination;

    // Register, if not already registered
    // await registerLoopControlProcessor();

    // Create the worklet node
    const loopController = await createLoopControllerNode(
      audioContext,
      'loop-control-processor'
    );

    if (!loopController) {
      throw new Error('Could not create processor node');
    }

    // Initialize the player
    const player = new SingleSamplePlayer(
      id,
      audioContext,
      sampleBuffer,
      options
    );

    player.init(outputDestination, loopController);

    console.log('SingleSamplePlayer initialized successfully');

    return player;
  } catch (error) {
    console.error('Failed to initialize player:', error);
    throw error;
  }
}

// Allocation strategy type - can be expanded in the future
export type VoiceAllocationStrategy = 'oldest-first' | 'quietest-first';

export class SingleSamplePlayer {
  // Core properties
  readonly id: string;
  #context: BaseAudioContext;
  #buffer: AudioBuffer;

  // Voice management
  #voices: VoiceNode[] = [];
  #polyphony: number;
  #rootNote: number;
  #allocationStrategy: VoiceAllocationStrategy = 'oldest-first';

  #outputGain: GainNode;
  #loopController: AudioWorkletNode | null = null;

  isInitialized: boolean = false;

  // Track handlers using a Map instead of storing on voice objects
  private voiceEventHandlersMap = new Map<
    number,
    {
      started: EventListener;
      ended: EventListener;
    }
  >();

  constructor(
    id: string,
    context: BaseAudioContext,
    buffer: AudioBuffer,
    options?: {
      polyphony?: number;
      rootNote?: number;
    }
  ) {
    this.id = id;
    this.#context = context;
    this.#buffer = buffer;
    this.#polyphony = options?.polyphony || 8;
    this.#rootNote = options?.rootNote || 60;

    // Create the main output gain node
    this.#outputGain = context.createGain();
    this.#outputGain.gain.value = 1.0;
  }

  init(
    destinationNode: AudioNode = this.#context.destination,
    processor: AudioWorkletNode | null = null
  ): boolean {
    // TEMP
    if (!this.#context.audioWorklet) {
      throw new Error('AudioWorklet is not supported in this context');
    }

    // Initialize and connect the processor if provided
    if (processor) {
      processor.connect(this.#outputGain);
      this.#loopController = processor;
    }

    // Initialize the voice pool and connect to processor or output
    const voiceDestination = processor || this.#outputGain;
    for (let voiceIdx = 0; voiceIdx < this.#polyphony; voiceIdx++) {
      const voice = new VoiceNode(
        voiceIdx, // this id does not change (should be string or number?)
        this.#context,
        this.#buffer,
        this.#rootNote
      );

      voice.connect(voiceDestination);
      this.#voices.push(voice);
    }

    this.#outputGain.connect(destinationNode);
    this.isInitialized = true;

    return true;
  }

  /**
   * Play a note using the sample
   * @param midiNote MIDI note number to play
   * @param velocity Note velocity (0-1)
   * @param startTime Time to start playback (defaults to now)
   * @returns The voice being used, or null if no voice was available
   */
  play(midiNote: number, velocity: number = 1.0, startTime?: number): boolean {
    const voice = this.#allocateVoice();
    if (!voice) {
      console.warn('No available voices to play the note');
      return false;
    }

    const success = voice.play(midiNote, velocity, startTime);
    // console.log('Playing note:', midiNote, 'on voice:', voice);

    if (success && this.#loopController?.port) {
      // send event to processor if it exists
      this.#loopController?.port?.postMessage({
        type: 'play',
        id: voice.getId(),
        note: midiNote,
        velocity: velocity,
      });

      return true;
    }

    return false;
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
    this.#outputGain.gain.value = value;
  }

  /**
   * Get the current master volume
   */
  getVolume(): number {
    return this.#outputGain.gain.value;
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
    this.#outputGain.disconnect();

    // Connect to the new destination
    this.#outputGain.connect(destination);
    return this;
  }

  /**
   * Disconnect from all destinations
   */
  disconnect(): void {
    this.#outputGain.disconnect();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAll(0);
    this.disconnect();

    this.#voices.forEach((voice) => {
      voice.dispose();
    });

    this.#voices = [];
    this.#outputGain.disconnect();
    this.#outputGain = null as unknown as GainNode;
    this.#loopController?.disconnect();
    this.#loopController = null;
    this.#context = null as unknown as BaseAudioContext;
    this.#buffer = null as unknown as AudioBuffer;
    this.isInitialized = false;
  }
}
