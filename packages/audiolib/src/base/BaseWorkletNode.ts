import {
  initializeAudioWorklet,
  sendWorkletMessage,
  setWorkletParams,
  WorkletMessage,
} from '../utils/worklet-utils.js';

/**
 * BaseWorkletNode - Abstract base class for audio worklet wrappers
 * Provides common functionality for all audio worklet nodes
 */
export abstract class BaseWorkletNode {
  protected audioContext: AudioContext;
  protected workletNode: AudioWorkletNode | null = null;
  protected gainNode: GainNode;
  protected isInitialized = false;

  /**
   * Creates a new BaseWorkletNode
   * @param audioContext The AudioContext to use
   * @param outputDestination Optional destination to connect to (defaults to audioContext.destination)
   */
  constructor(audioContext: AudioContext, outputDestination?: AudioNode) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();

    if (outputDestination) {
      this.gainNode.connect(outputDestination);
    } else {
      this.gainNode.connect(this.audioContext.destination);
    }
  }

  /**
   * Abstract method to get the processor name
   * Must be implemented by subclasses
   */
  protected abstract getProcessorName(): string;

  /**
   * Optional method to get the embedded processor code
   * Can be overridden by subclasses
   */
  protected getEmbeddedCode(): string | undefined {
    return undefined;
  }

  /**
   * Handle messages from the worklet
   * Can be overridden by subclasses
   */
  protected handleMessage(event: MessageEvent<WorkletMessage>): void {
    // Default implementation does nothing
  }

  /**
   * Initialize the AudioWorklet processor
   * @param processorPath Optional path to the processor file
   */
  async init(processorPath?: string): Promise<void> {
    try {
      this.workletNode = await initializeAudioWorklet(
        this.audioContext,
        this.getProcessorName(),
        {
          embeddedCode: processorPath ? undefined : this.getEmbeddedCode(),
          processorPath,
          messageHandler: this.handleMessage.bind(this),
          outputNode: this.gainNode,
        }
      );

      this.isInitialized = true;
      return Promise.resolve();
    } catch (error) {
      console.error(`Failed to initialize ${this.getProcessorName()}:`, error);
      return Promise.reject(error);
    }
  }

  /**
   * Send a message to the worklet
   * @param type Message type
   * @param data Optional data to include with the message
   * @param transferables Optional transferable objects
   */
  protected sendMessage<T = any>(
    type: string,
    data?: T,
    transferables?: Transferable[]
  ): void {
    if (!this.workletNode) {
      throw new Error(
        `${this.getProcessorName()} not initialized. Call init() first.`
      );
    }

    sendWorkletMessage(this.workletNode, type, data, transferables);
  }

  /**
   * Set a parameter value
   * @param params Record of parameter names and values
   */
  setParameters(params: Record<string, number>): void {
    if (!this.workletNode) {
      throw new Error(
        `${this.getProcessorName()} not initialized. Call init() first.`
      );
    }

    setWorkletParams(this.workletNode, params, this.audioContext);
  }

  /**
   * Set volume (0-1)
   * @param volume Volume level (0-1)
   */
  setVolume(volume: number): void {
    this.gainNode.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this.audioContext.currentTime
    );
  }

  /**
   * Connect to an AudioNode
   * @param destination The destination AudioNode
   */
  connect(destination: AudioNode): void {
    this.gainNode.disconnect();
    this.gainNode.connect(destination);
  }

  /**
   * Dispose and clean up resources
   */
  dispose(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    this.gainNode.disconnect();
    this.isInitialized = false;
  }
}
