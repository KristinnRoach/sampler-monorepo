// VoicePool.ts
import { VoiceNode } from './VoiceNode';

export class VoicePool {
  private context: BaseAudioContext;
  private voices: VoiceNode[] = [];
  private destination: AudioNode;

  constructor(context: BaseAudioContext, voiceCount: number = 8) {
    this.context = context;
    this.destination = context.destination;

    // Initialize with inactive voices
    for (let i = 0; i < voiceCount; i++) {
      this.createVoice();
    }
  }

  /**
   * Create a new voice and add it to the pool
   */
  private async createVoice(): Promise<VoiceNode> {
    const voice = new VoiceNode(this.context);
    await voice.init();
    voice.connect(this.destination);
    this.voices.push(voice);
    return voice;
  }

  /**
   * Play a buffer on the next available voice
   * @returns The voice being used for playback, or null if no voices are available
   */
  play(buffer: AudioBuffer, startTime?: number): VoiceNode | null {
    // Find an inactive voice
    let voice = this.voices.find((v) => !v.isActive());

    // If no inactive voice is found, steal the oldest one
    if (!voice && this.voices.length > 0) {
      voice = this.voices[0];
    }

    if (voice) {
      voice.play(buffer, startTime);

      // Move this voice to the end of the array (newest used)
      const index = this.voices.indexOf(voice);
      if (index > -1) {
        this.voices.splice(index, 1);
        this.voices.push(voice);
      }

      return voice;
    }

    return null;
  }

  /**
   * Stop all playing voices
   */
  stopAll(): void {
    this.voices.forEach((voice) => {
      voice.stop();
    });
  }

  /**
   * Set the output destination for all voices
   */
  setDestination(destination: AudioNode): void {
    this.destination = destination;

    // Reconnect all voices
    this.voices.forEach((voice) => {
      voice.disconnect();
      voice.connect(destination);
    });
  }

  /**
   * Get the number of active voices
   */
  activeVoiceCount(): number {
    return this.voices.filter((v) => v.isActive()).length;
  }

  /**
   * Get the total number of voices in the pool
   */
  totalVoiceCount(): number {
    return this.voices.length;
  }
}
