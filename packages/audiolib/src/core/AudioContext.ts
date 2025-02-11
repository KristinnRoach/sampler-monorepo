import { WebAudioConfig } from './config/types';
import { AUDIOLIB_DEFAULTS } from './config/defaults';

function validateArrayBuffer(arrayBuffer: ArrayBuffer): boolean {
  if (!(arrayBuffer instanceof ArrayBuffer)) {
    throw new Error('Invalid ArrayBuffer');
  } else if (arrayBuffer.byteLength === 0) {
    throw new Error('ArrayBuffer is Empty');
  } else {
    return true;
  }
}

class AudioContextManager {
  private static instance: AudioContext | null = null;
  private static resumePromise: Promise<void> | null = null;
  private static config: WebAudioConfig | null = null;

  //   private constructor() {} // not needed ?? static ??

  static async getInstance(config?: WebAudioConfig): Promise<AudioContext> {
    if (!this.instance) {
      this.initialize(config);
    }
    if (this.instance && this.instance.state === 'suspended') {
      this.resumePromise = this.resumePromise || this.setupAutoResume();
      await this.resumePromise;
    }

    if (!this.instance) {
      throw new Error('AudioContext failed to initialize');
    }
    return this.instance;
  }

  static initialize(config: WebAudioConfig = AUDIOLIB_DEFAULTS.audio): void {
    if (this.config && config !== this.config) {
      throw new Error('AudioContext already initialized with different config');
    }

    this.instance = new AudioContext({
      sampleRate: config.sampleRate,
      latencyHint: config.options.latencyHint,
    });

    this.config = config;
  }

  static getConfig(): WebAudioConfig {
    if (!this.config) {
      throw new Error('WebAudioConfig not set');
    }
    return this.config;
  }

  static async arrayToAudioBuffer(
    arrayBuffer: ArrayBuffer
  ): Promise<AudioBuffer> {
    if (!validateArrayBuffer(arrayBuffer)) {
      throw new Error('Invalid ArrayBuffer');
    }

    const context = await this.getInstance();
    return await context.decodeAudioData(arrayBuffer);
  }

  static async blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    return await this.arrayToAudioBuffer(arrayBuffer);
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
    }
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
