import { LoopWorklet } from '@/nodes/loop/LoopWorklet';
import { isValidAudioBuffer } from '@/utils/validation-utils';
import {
  createAmpEnvNode,
  AmpEnvelopeNode,
  EnvelopeType,
  EnvelopeParams,
} from '../envelope/EnvelopeFactory';

// A map of AudioContext -> LoopWorklet to ensure a single worklet per context
const sharedLoopWorklets = new WeakMap<AudioContext, LoopWorklet>();

/**
 * VoiceNode provides playback functionality for a single voice
 * with amplitude envelope control and optional looping
 */
export class VoiceNode {
  // Audio nodes
  #context: AudioContext;
  #output: AudioNode | null = null;
  #activeSource: AudioBufferSourceNode | null = null;
  #nextSource: AudioBufferSourceNode;
  #ampEnvNode: AmpEnvelopeNode;
  #gainNode: GainNode;
  #loopWorklet: LoopWorklet | null = null;

  // State tracking
  #isPlaying: boolean = false;
  #isReleasing: boolean = false;
  #releaseMsEndTime: number = 0;
  #currentBuffer: AudioBuffer | null = null;

  // Loop settings
  #loop: boolean = false;
  #loopStart: number = 0;
  #loopEnd: number = 0;

  /**
   * Creates a new VoiceNode
   * @param context The audio context to use
   */
  constructor(
    context: AudioContext,
    buffer: AudioBuffer,
    output: AudioNode,
    envelopeOptions: {
      type: EnvelopeType;
      params: EnvelopeParams;
    } = { type: 'AR', params: { attackMs: 0.01, releaseMs: 0.2 } }
  ) {
    this.#context = context;
    this.#output = output;
    this.#gainNode = new GainNode(context, { gain: 0 });

    // Validate the buffer
    if (!isValidAudioBuffer(buffer)) {
      console.warn('Cannot initialize Voice: Invalid buffer');
      throw new Error('Invalid buffer');
    }
    this.#currentBuffer = buffer;

    // Initialize the next source
    this.#nextSource = this.createBufferSource(buffer);

    this.#ampEnvNode = createAmpEnvNode(
      context,
      envelopeOptions.type,
      envelopeOptions.params
    );

    // Initialize the loop processor asynchronously before connecting
    this.initLoopProcessor().then(() => {
      this.#connectVoiceChain();
    });
  }

  #connectVoiceChain = () => {
    if (!this.#nextSource) throw new Error('No next source');
    if (!this.#ampEnvNode) throw new Error('No amp env node');
    if (!this.#gainNode) throw new Error('No gain node');
    if (!this.#loopWorklet) throw new Error('No loop worklet');
    if (!this.#output) throw new Error('No output');

    // Connect nodes one by one to ensure proper connections
    //this.#nextSource.connect(this.#ampEnvNode.getGainNode());
    this.#loopWorklet.connectToSource(this.#nextSource);
    //this.#loopWorklet.workletNode.connect(this.#output); // todo: standardize
    this.#ampEnvNode.getGainNode().connect(this.#gainNode);
    this.#gainNode.connect(this.#output);

    console.log('voice output: ', this.#output);
  };

  setVolume(gain: number): boolean {
    if (!this.#gainNode.gain) return false;
    this.#gainNode.gain.setTargetAtTime(gain, 0, 0.05);

    if (!this.#ampEnvNode.getGainNode())
      console.error('No Amp Envelope Gain Node!');
    return true;
  }

  getVolume(): number {
    return this.#gainNode.gain.value;
  }

  /**
   * Initialize the LoopWorklet for looping functionality
   * This is done lazily only when looping is requested
   */
  private async initLoopProcessor(): Promise<void> {
    if (!this.#loopWorklet) {
      // Check if a shared LoopWorklet already exists for this context
      let worklet = sharedLoopWorklets.get(this.#context);

      if (!worklet) {
        // Create a new LoopWorklet and store it for future use
        worklet = new LoopWorklet(this.#context);
        await worklet.initialise();
        sharedLoopWorklets.set(this.#context, worklet);
      }

      this.#loopWorklet = worklet;
    }
  }

  /**
   * Set the audio buffer to play
   * @param buffer The audio buffer
   */
  setBuffer(buffer: AudioBuffer): void {
    if (!isValidAudioBuffer(buffer)) {
      console.warn('Cannot set buffer: Invalid buffer');
      return;
    }
    // todo: ensure no glitches if playing and no memory leaks

    this.#currentBuffer = buffer;

    // Prepare the next source with this buffer
    if (!this.#isPlaying) {
      this.prepareNextSource();
    }
  }

  getPlaybackRateFromMidiNote = (midiNote: number, baseNote: number = 60) => {
    return Math.pow(2, (midiNote - baseNote) / 12);
  };

  /**
   * Start playback of the current buffer
   * @param when When to start playback (default: now)
   * @param offset Offset in the buffer to start from
   */
  play(midiNote: number, when: number = this.#context.currentTime): void {
    if (!this.#currentBuffer) {
      console.warn('Cannot start VoiceNode: No buffer set');
      return;
    }
    // Set params not predefined (only playbackRate for now)
    this.#nextSource.playbackRate.value =
      this.getPlaybackRateFromMidiNote(midiNote);

    // Apply amp envelope
    this.#ampEnvNode.triggerAttack(when);

    // Start the source
    this.#nextSource.start(when);
    this.#isPlaying = true;

    // Swap the sources
    this.#activeSource = this.#nextSource;

    // Prepare the next source for future use
    this.prepareNextSource();
  }

  /**
   * ReleaseMs the current note (begin releaseMs phase)
   * @param when When to start the releaseMs phase
   */
  release(when: number = this.#context.currentTime): void {
    if (!this.#isPlaying || this.#isReleasing) return;

    this.#ampEnvNode.triggerRelease(when);

    this.#isReleasing = true; // should be handled by the envelope?
    this.#releaseMsEndTime = when + this.#ampEnvNode.params.releaseMs / 1000;
  }

  /**
   * Configure looping behavior
   * @param shouldLoop Whether to loop playback
   * @param loopStart Loop start point in seconds
   * @param loopEnd Loop end point in seconds
   */
  async setLoop(
    shouldLoop: boolean,
    loopStart: number = 0,
    loopEnd: number = 0
  ): Promise<void> {
    this.#loop = shouldLoop;

    if (shouldLoop) {
      // Initialize the loop processor if needed
      if (!this.#loopWorklet) {
        await this.initLoopProcessor();
      }

      // Set loop points
      if (this.#currentBuffer) {
        // Validate loop points
        this.#loopStart = Math.max(
          0,
          Math.min(loopStart, this.#currentBuffer.duration)
        );
        this.#loopEnd =
          loopEnd <= 0
            ? this.#currentBuffer.duration
            : Math.min(loopEnd, this.#currentBuffer.duration);

        // Update active source if playing
        if (this.#loopWorklet && this.#activeSource) {
          this.#loopWorklet.setLoopStart(this.#loopStart);
          this.#loopWorklet.setLoopEnd(this.#loopEnd);
        }
      }
    } else if (this.#activeSource) {
      // Turn off looping on active source
      this.#activeSource.loop = false;
    }
  }

  /**
   * Connect the VoiceNode to a destination node
   * @param destination The destination AudioNode
   */
  connect(destination: AudioNode): void {
    this.#gainNode.connect(destination);
  }

  /**
   * Disconnect the VoiceNode
   */
  disconnect(): void {
    if (this.#output) this.#loopWorklet?.disconnect(this.#output);
    this.#gainNode.disconnect();
    this.#ampEnvNode.disconnect();
    if (this.#activeSource) this.#activeSource.disconnect();
    if (this.#nextSource) this.#nextSource.disconnect();
  }

  /**
   * Check if the voice is currently active
   */
  isActive(): boolean {
    return this.#isPlaying;
  }

  /**
   * Check if the voice is in releaseMs phase
   */
  isReleasing(): boolean {
    return this.#isReleasing;
  }

  /**
   * Check if the voice is available for new playback
   */
  isAvailable(): boolean {
    return (
      !this.#isPlaying ||
      (this.#isReleasing && this.#context.currentTime >= this.#releaseMsEndTime)
    );
  }

  /**
   * Create and configure a buffer source
   * @param buffer Audio buffer to use
   */
  private createBufferSource(buffer: AudioBuffer): AudioBufferSourceNode {
    const source = new AudioBufferSourceNode(this.#context, {
      buffer: buffer,
      loop: this.#loop && !this.#loopWorklet, // Only use native looping if not using the processor
    });

    // Handle source ending
    source.onended = () => {
      if (source === this.#activeSource) {
        this.#isPlaying = false; // emit
        this.#isReleasing = false; // emit
        this.#activeSource = null;
      }
    };

    return source;
  }

  /**
   * Prepare the next source for quick playback
   */
  private prepareNextSource(): void {
    // should be async?
    if (!isValidAudioBuffer(this.#currentBuffer)) {
      console.warn('Cannot prepare VoiceNode: Invalid buffer');
      return;
    }
    this.#nextSource = this.createBufferSource(this.#currentBuffer!);
    this.#nextSource.playbackRate.value = this.#activeSource
      ? this.#activeSource.playbackRate.value
      : 1;
    this.#nextSource.connect(this.#ampEnvNode.getGainNode());
  }
}

// this.#nextSource
//   .connect(this.#ampEnvNode.getGainNode())
//   .connect(this.#gainNode)
//   .connect(this.#loopWorklet!.workletNode)
//   .connect(this.#output);
