import { LoopWorklet } from '../processors/loop/LoopWorklet';

/**
 * Amplitude envelope types supported by VoiceNode
 */
export enum EnvelopeType {
  AR, // Attack-Release
  ADSR, // Attack-Decay-Sustain-Release
}

/**
 * Envelope parameters for controlling amplitude shape
 */
export interface EnvelopeParams {
  attack: number; // Attack time in seconds
  decay?: number; // Decay time in seconds (ADSR only)
  sustain?: number; // Sustain level 0-1 (ADSR only)
  release: number; // Release time in seconds
}

/**
 * VoiceNode provides playback functionality for a single voice
 * with amplitude envelope control and optional looping
 */
export class VoiceNode {
  // Audio nodes
  private context: BaseAudioContext;
  private activeSource: AudioBufferSourceNode | null = null;
  private nextSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private loopProcessor: LoopWorklet | null = null;

  // State tracking
  private isPlaying: boolean = false;
  private isPrepared: boolean = false;
  private isReleasing: boolean = false;
  private currentBuffer: AudioBuffer | null = null;
  private envelopeType: EnvelopeType = EnvelopeType.AR;
  private envelopeParams: EnvelopeParams = {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.7,
    release: 0.3,
  };

  // Scheduling state
  private startTime: number = 0;
  private releaseStartTime: number = 0;
  private releaseEndTime: number = 0;

  // TEMP QUICK FIX for ts errors
  st = this.startTime;
  rlsSt = this.releaseStartTime;

  // Loop settings
  private loop: boolean = false;
  private loopStart: number = 0;
  private loopEnd: number = 0;

  /**
   * Creates a new VoiceNode
   * @param context The audio context to use
   */
  constructor(context: BaseAudioContext) {
    this.context = context;
    this.gainNode = new GainNode(context, { gain: 0 });

    // Initialize the next source
    this.prepareNextSource();
  }

  /**
   * Initialize the LoopWorklet for looping functionality
   * This is done lazily only when looping is requested
   */
  private async initLoopProcessor(): Promise<void> {
    if (!this.loopProcessor) {
      this.loopProcessor = new LoopWorklet(this.context);
      await this.loopProcessor.initialise();
    }
  }

  /**
   * Set the audio buffer to play
   * @param buffer The audio buffer
   */
  setBuffer(buffer: AudioBuffer): void {
    this.currentBuffer = buffer;

    // Prepare the next source with this buffer
    if (!this.isPlaying) {
      this.prepareNextSource();
    }
  }

  /**
   * Set the amplitude envelope type and parameters
   * @param type The envelope type (AR or ADSR)
   * @param params The envelope parameters
   */
  setEnvelope(type: EnvelopeType, params: Partial<EnvelopeParams>): void {
    this.envelopeType = type;

    // Update only the provided parameters
    if (params.attack !== undefined) this.envelopeParams.attack = params.attack;
    if (params.decay !== undefined) this.envelopeParams.decay = params.decay;
    if (params.sustain !== undefined)
      this.envelopeParams.sustain = params.sustain;
    if (params.release !== undefined)
      this.envelopeParams.release = params.release;
  }

  /**
   * Start playback of the current buffer
   * @param when When to start playback (default: now)
   * @param offset Offset in the buffer to start from
   */
  start(when: number = this.context.currentTime, offset: number = 0): void {
    if (!this.currentBuffer) {
      console.warn('Cannot start VoiceNode: No buffer set');
      return;
    }

    // Cancel any ongoing release
    if (this.isReleasing) {
      this.gainNode.gain.cancelScheduledValues(when);
      this.isReleasing = false;
    }

    // Use the prepared next source as the active source
    if (this.isPrepared && this.nextSource) {
      this.activeSource = this.nextSource;
      this.nextSource = null;
      this.isPrepared = false;
    } else {
      // Create a new source if nextSource isn't prepared
      this.activeSource = this.createBufferSource(this.currentBuffer);
    }

    // Connect the source to the gain node
    if (this.loop && this.loopProcessor) {
      // If looping: source -> loop processor -> gain node
      this.activeSource.connect(this.loopProcessor.workletNode);
      this.loopProcessor.connectToSource(this.activeSource);
      this.loopProcessor.workletNode.connect(this.gainNode);
    } else {
      // If not looping: source -> gain node
      this.activeSource.connect(this.gainNode);
    }

    // Apply the attack phase of the envelope
    this.applyAttackPhase(when);

    // Start the source
    this.activeSource.start(when, offset);
    this.startTime = when;
    this.isPlaying = true;

    // Prepare the next source for future use
    this.prepareNextSource();
  }

  /**
   * Release the current note (begin release phase)
   * @param when When to start the release phase
   */
  release(when: number = this.context.currentTime): void {
    if (!this.isPlaying || this.isReleasing) return;

    this.isReleasing = true;
    this.releaseStartTime = when;
    this.releaseEndTime = when + this.envelopeParams.release;

    // Apply release phase
    this.applyReleasePhase(when);
  }

  /**
   * Immediately stop playback without release phase
   */
  stop(when: number = this.context.currentTime): void {
    if (!this.isPlaying) return;

    // Cancel any scheduled envelope changes
    this.gainNode.gain.cancelScheduledValues(when);

    // Set gain to 0 immediately
    this.gainNode.gain.setValueAtTime(0, when);

    // Stop the source
    if (this.activeSource) {
      try {
        this.activeSource.stop(when);
      } catch (e) {
        // Source might already be stopped
      }
      this.activeSource = null;
    }

    this.isPlaying = false;
    this.isReleasing = false;
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
    this.loop = shouldLoop;

    if (shouldLoop) {
      // Initialize the loop processor if needed
      if (!this.loopProcessor) {
        await this.initLoopProcessor();
      }

      // Set loop points
      if (this.currentBuffer) {
        // Validate loop points
        this.loopStart = Math.max(
          0,
          Math.min(loopStart, this.currentBuffer.duration)
        );
        this.loopEnd =
          loopEnd <= 0
            ? this.currentBuffer.duration
            : Math.min(loopEnd, this.currentBuffer.duration);

        // Update active source if playing
        if (this.loopProcessor && this.activeSource) {
          this.loopProcessor.setLoopStart(this.loopStart);
          this.loopProcessor.setLoopEnd(this.loopEnd);
        }
      }
    } else if (this.activeSource) {
      // Turn off looping on active source
      this.activeSource.loop = false;
    }
  }

  /**
   * Connect the VoiceNode to a destination node
   * @param destination The destination AudioNode
   */
  connect(destination: AudioNode): void {
    this.gainNode.connect(destination);
  }

  /**
   * Disconnect the VoiceNode
   */
  disconnect(): void {
    this.gainNode.disconnect();
  }

  /**
   * Check if the voice is currently active
   */
  isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Check if the voice is in release phase
   */
  isInRelease(): boolean {
    return this.isReleasing;
  }

  /**
   * Check if the voice is available for new playback
   */
  isAvailable(): boolean {
    return (
      !this.isPlaying ||
      (this.isReleasing && this.context.currentTime >= this.releaseEndTime)
    );
  }

  /**
   * Create and configure a buffer source
   * @param buffer Audio buffer to use
   */
  private createBufferSource(buffer: AudioBuffer): AudioBufferSourceNode {
    const source = new AudioBufferSourceNode(this.context, {
      buffer: buffer,
      loop: this.loop && !this.loopProcessor, // Only use native looping if not using the processor
    });

    // Handle source ending
    source.onended = () => {
      if (source === this.activeSource) {
        this.isPlaying = false;
        this.isReleasing = false;
        this.activeSource = null;
      }
    };

    return source;
  }

  /**
   * Prepare the next source for quick playback
   */
  private prepareNextSource(): void {
    if (!this.currentBuffer) return;

    this.nextSource = this.createBufferSource(this.currentBuffer);
    this.isPrepared = true;
  }

  /**
   * Apply the attack phase of the envelope
   * @param when When to start the attack phase
   */
  private applyAttackPhase(when: number): void {
    // Reset gain to 0 at start
    this.gainNode.gain.cancelScheduledValues(when);
    this.gainNode.gain.setValueAtTime(0, when);

    if (this.envelopeType === EnvelopeType.AR) {
      // Simple AR envelope
      this.gainNode.gain.linearRampToValueAtTime(
        1,
        when + this.envelopeParams.attack
      );
    } else {
      // ADSR envelope
      // Attack phase
      this.gainNode.gain.linearRampToValueAtTime(
        1,
        when + this.envelopeParams.attack
      );

      // Decay phase to sustain level
      const sustainLevel = this.envelopeParams.sustain ?? 0.7;
      const decayTime = this.envelopeParams.decay ?? 0.1;
      this.gainNode.gain.exponentialRampToValueAtTime(
        Math.max(0.001, sustainLevel), // Avoid 0 for exponentialRamp
        when + this.envelopeParams.attack + decayTime
      );
    }
  }

  /**
   * Apply the release phase of the envelope
   * @param when When to start the release phase
   */
  private applyReleasePhase(when: number): void {
    // Get current gain value
    const currentGain = this.gainNode.gain.value;
    this.gainNode.gain.cancelScheduledValues(when);
    this.gainNode.gain.setValueAtTime(currentGain, when);

    // Apply release ramp
    this.gainNode.gain.exponentialRampToValueAtTime(
      0.0001, // Near zero (can't be exactly 0 for exponentialRamp)
      when + this.envelopeParams.release
    );

    // Schedule automatic cleanup and source stop
    if (this.activeSource) {
      const releaseEnd = when + this.envelopeParams.release + 0.01; // Small buffer
      try {
        this.activeSource.stop(releaseEnd);
      } catch (e) {
        // Source might already be scheduled to stop
      }
    }
  }
}
