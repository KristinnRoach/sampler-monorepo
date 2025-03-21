// VoiceNode.ts
import { WorkletNode } from '../worklet/workletFactory';
import { createVoiceProcessor } from './VoiceProcessorFactory';

export class VoiceNode {
  private context: BaseAudioContext;

  // TODO: finish the activeSource and nextSource logic (already in old VoiceNode.txt)
  //private activeSource: AudioBufferSourceNode | null = null;
  private nextSource: AudioBufferSourceNode | null = null;
  private workletNode: WorkletNode | null = null;
  private gainNode: GainNode;
  private isPlaying: boolean = false;

  constructor(context: BaseAudioContext) {
    this.context = context;
    this.gainNode = context.createGain();
  }

  /**
   * Initialize the voice worklet processor
   */
  async init(): Promise<void> {
    // Create the worklet node using the utility function
    this.workletNode = await createVoiceProcessor(
      this.context,
      'voice-processor'
    );

    if (!this.workletNode) {
      throw new Error('Failed to create worklet node');
    }

    // Connect worklet to gain
    this.workletNode.connect(this.gainNode);
  }

  /**
   * Play an audio buffer
   */
  play(buffer: AudioBuffer, startTime?: number): void {
    if (this.isPlaying) {
      this.stop();
    }

    // Create a new source node for the buffer
    this.nextSource = this.context.createBufferSource();
    this.nextSource.buffer = buffer;

    // Connect source -> worklet -> gain
    if (this.workletNode) {
      this.nextSource.connect(this.workletNode);
    } else {
      // Fallback direct connection if worklet not ready
      this.nextSource.connect(this.gainNode);
    }

    // Start playback
    const time = startTime || this.context.currentTime;
    this.nextSource.start(time);
    this.isPlaying = true;

    // Set up cleanup when playback ends
    this.nextSource.onended = () => {
      this.isPlaying = false;
      this.nextSource = null;
    };
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.nextSource && this.isPlaying) {
      this.nextSource.stop();
      this.nextSource.disconnect();
      this.isPlaying = false;
      this.nextSource = null;
    }
  }

  /**
   * Set gain value (0-1)
   */
  setGain(value: number, timeOffset: number = 0): void {
    const time = this.context.currentTime + timeOffset;
    this.gainNode.gain.setValueAtTime(value, time);
  }

  /**
   * Connect the voice node's output to a destination
   */
  connect(destination: AudioNode | AudioParam): VoiceNode {
    this.gainNode.connect(destination as any);
    return this;
  }

  /**
   * Disconnect the voice node from all destinations
   */
  disconnect(): void {
    this.gainNode.disconnect();
  }

  /**
   * Check if the voice is currently playing
   */
  isActive(): boolean {
    return this.isPlaying;
  }
}
