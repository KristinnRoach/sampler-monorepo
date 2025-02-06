// packages/audiolib/src/lib/AudioContext.ts
import type { AudioConfig } from './types';

class AudioContextManager {
  private static instance: AudioContext | null = null;
  private static resumePromise: Promise<void> | null = null;

  static async getInstance(config?: AudioConfig): Promise<AudioContext> {
    if (!this.instance) {
      this.instance = new AudioContext({
        sampleRate: config?.sampleRate,
        latencyHint: config?.latencyHint || 'interactive',
      });
    }

    if (this.instance.state === 'suspended') {
      this.resumePromise = this.resumePromise || this.setupAutoResume();
      await this.resumePromise;
    }

    return this.instance;
  }

  private static async setupAutoResume(): Promise<void> {
    const resumeEvents = ['click', 'touchstart', 'keydown'];

    return new Promise((resolve) => {
      const handler = async () => {
        if (this.instance) {
          await this.instance.resume();
          resumeEvents.forEach((event) =>
            document.removeEventListener(event, handler)
          );
          resolve();
        }
      };

      resumeEvents.forEach((event) =>
        document.addEventListener(event, handler, { once: true })
      );
    });
  }

  static async createBufferFromArrayBuffer(
    arrayBuffer: ArrayBuffer
  ): Promise<AudioBuffer> {
    const context = await this.getInstance();
    return context.decodeAudioData(arrayBuffer);
  }
}

export { AudioContextManager };
