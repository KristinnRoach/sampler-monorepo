import { sourceProcessorCode } from './worklet-code.js';

/**
 * SourceNode - TypeScript wrapper for source-processor AudioWorklet
 */
export class SourceNode {
  private audioContext: AudioContext;
  private sourceProcessor: AudioWorkletNode | null = null;
  private gainNode: GainNode;
  private isLoaded = false;
  private isPlaying = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  /**
   * Initialize the AudioWorklet processor
   */
  async init(processorPath?: string): Promise<void> {
    try {
      if (processorPath) {
        // Use provided path if available
        await this.audioContext.audioWorklet.addModule(processorPath);
      } else {
        // Use the embedded code with Blob URL
        const blob = new Blob([sourceProcessorCode], {
          type: 'application/javascript',
        });
        const workletUrl = URL.createObjectURL(blob);

        try {
          await this.audioContext.audioWorklet.addModule(workletUrl);
        } finally {
          // Always clean up the URL to avoid memory leaks
          URL.revokeObjectURL(workletUrl);
        }
      }
      // Create the processor node
      this.sourceProcessor = new AudioWorkletNode(
        this.audioContext,
        'source-processor'
      );

      // Connect the processor to the gain node
      this.sourceProcessor.connect(this.gainNode);

      // Set up message handling from the processor
      this.sourceProcessor.port.onmessage = (event) => {
        if (event.data.type === 'update') {
          // Handle parameter updates
          this.isPlaying = event.data.isPlaying;
        } else if (event.data.type === 'positionUpdate') {
          // Handle position updates if needed
        }
      };

      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize SourceNode:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Load audio buffer into the processor
   */
  async loadBuffer(audioBuffer: AudioBuffer): Promise<void> {
    if (!this.sourceProcessor) {
      throw new Error('SourceNode not initialized. Call init() first.');
    }

    // Extract the channel data from the audio buffer
    const bufferData: Float32Array[] = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      bufferData.push(audioBuffer.getChannelData(i));
    }

    // Send the buffer data to the processor
    this.sourceProcessor.port.postMessage(
      {
        type: 'setBuffer',
        buffer: bufferData,
        sampleRate: audioBuffer.sampleRate,
      },
      bufferData.map((array) => array.buffer)
    );

    this.isLoaded = true;
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.sourceProcessor || !this.isLoaded) {
      throw new Error('Audio buffer not loaded. Call loadBuffer() first.');
    }

    if (!this.isPlaying) {
      this.sourceProcessor.port.postMessage({ type: 'play' });
      this.isPlaying = true;
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.sourceProcessor && this.isPlaying) {
      this.sourceProcessor.port.postMessage({ type: 'stop' });
      this.isPlaying = false;
    }
  }

  /**
   * Set playback parameters
   */
  setParameters(params: {
    start?: number;
    end?: number;
    loopStart?: number;
    loopEnd?: number;
    playbackRate?: number;
    interpolationSpeed?: number;
  }): void {
    if (!this.sourceProcessor) return;

    const { start, end, loopStart, loopEnd, playbackRate, interpolationSpeed } =
      params;

    if (start !== undefined) {
      this.sourceProcessor.parameters
        .get('targetStart')
        ?.setValueAtTime(start, this.audioContext.currentTime);
    }

    if (end !== undefined) {
      this.sourceProcessor.parameters
        .get('targetEnd')
        ?.setValueAtTime(end, this.audioContext.currentTime);
    }

    if (loopStart !== undefined) {
      this.sourceProcessor.parameters
        .get('targetLoopStart')
        ?.setValueAtTime(loopStart, this.audioContext.currentTime);
    }

    if (loopEnd !== undefined) {
      this.sourceProcessor.parameters
        .get('targetLoopEnd')
        ?.setValueAtTime(loopEnd, this.audioContext.currentTime);
    }

    if (playbackRate !== undefined) {
      this.sourceProcessor.parameters
        .get('targetPlaybackRate')
        ?.setValueAtTime(playbackRate, this.audioContext.currentTime);
    }

    if (interpolationSpeed !== undefined) {
      this.sourceProcessor.parameters
        .get('interpolationSpeed')
        ?.setValueAtTime(interpolationSpeed, this.audioContext.currentTime);
    }
  }

  /**
   * Enable or disable looping
   */
  setLooping(enabled: boolean): void {
    if (!this.sourceProcessor) return;

    this.sourceProcessor.port.postMessage({
      type: enabled ? 'enableLooping' : 'disableLooping',
    });
  }

  /**
   * Enable position streaming
   */
  enablePositionStreaming(interval: number = 5): void {
    if (!this.sourceProcessor) return;

    this.sourceProcessor.port.postMessage({
      type: 'streamPosition',
      enabled: true,
      interval,
    });
  }

  /**
   * Disable position streaming
   */
  disablePositionStreaming(): void {
    if (!this.sourceProcessor) return;

    this.sourceProcessor.port.postMessage({
      type: 'streamPosition',
      enabled: false,
    });
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.gainNode.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this.audioContext.currentTime
    );
  }

  /**
   * Connect to an AudioNode
   */
  connect(destination: AudioNode): void {
    this.gainNode.disconnect();
    this.gainNode.connect(destination);
  }

  /**
   * Dispose and clean up resources
   */
  dispose(): void {
    this.stop();
    if (this.sourceProcessor) {
      this.sourceProcessor.disconnect();
      this.sourceProcessor = null;
    }
    this.gainNode.disconnect();
    this.isLoaded = false;
    this.isPlaying = false;
  }
}
