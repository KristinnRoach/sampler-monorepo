import { LibNode } from '@/LibNode';
import { createNodeId, NodeID } from '@/nodes/node-store';
import { getAudioContext } from '@/context';
import { Message, MessageHandler, createMessageBus } from '@/events';
import { LevelMonitor } from '@/utils/monitoring/LevelMonitor';

export class InstrumentMasterBus implements LibNode {
  readonly nodeId: NodeID;
  readonly nodeType = 'fx';

  #context: AudioContext;
  #input: GainNode;
  #compressor: DynamicsCompressorNode;
  #output: GainNode;
  #messages;
  #compressorEnabled: boolean = true;
  #levelMonitor: LevelMonitor | null = null;

  constructor() {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = getAudioContext();
    this.#messages = createMessageBus<Message>(this.nodeId);

    // Create audio nodes
    this.#input = new GainNode(this.#context, { gain: 1.0 });
    this.#compressor = this.#createCompressor();
    this.#output = new GainNode(this.#context, { gain: 1.0 });

    // Connect nodes
    this.#setupRouting();
  }

  /**
   * todo: this is just to equalize the volume for quiet samples rn, re-implement once normalization is achieved
   * Creates a compressor optimized for boosting quiet signals
   * This is kept as a separate method for easy refactoring later
   */
  #createCompressor(): DynamicsCompressorNode {
    const compressor = new DynamicsCompressorNode(this.#context, {
      threshold: -50.0, // Very low threshold to catch quiet signals (dB)
      knee: 12.0, // Soft knee for smooth transition (dB)
      ratio: 4.0, // Moderate compression ratio
      attack: 0.005, // Fast attack to catch transients (seconds)
      release: 0.1, // Quick release (seconds)
    });

    // Set makeup gain to boost the signal after compression
    // We use a post-compressor gain node (this.#output) for this

    return compressor;
  }

  /**
   * Sets up the audio routing based on whether compression is enabled
   */
  #setupRouting(): void {
    // Disconnect existing connections
    this.#input.disconnect();
    this.#compressor.disconnect();

    if (this.#compressorEnabled) {
      // Route through compressor
      this.#input.connect(this.#compressor);
      this.#compressor.connect(this.#output);
    } else {
      // Bypass compressor
      this.#input.connect(this.#output);
    }
  }

  /**
   * Start monitoring input and output levels
   * @param intervalMs How often to log levels (in milliseconds)
   * @param fftSize Size of FFT for analysis (larger = more precise but more CPU)
   */
  startLevelMonitoring(
    intervalMs: number = 1000,
    fftSize: number = 1024,
    logOutput: boolean = false
  ): void {
    // Stop any existing monitoring
    this.stopLevelMonitoring();

    // Create level monitor if it doesn't exist
    this.#levelMonitor = new LevelMonitor(
      this.#context,
      this.#input,
      this.#output,
      fftSize
    );

    // Start monitoring
    this.#levelMonitor.start(intervalMs), fftSize, logOutput;

    console.log('Level monitoring started');
  }

  /**
   * Stop monitoring levels
   */
  stopLevelMonitoring(): void {
    if (this.#levelMonitor) {
      this.#levelMonitor.stop();
      this.#levelMonitor = null;
      console.log('Level monitoring stopped');
    }
  }

  /**
   * Log current levels once (without starting continuous monitoring)
   */
  logLevels(): void {
    if (!this.#levelMonitor) {
      // Create temporary monitor
      const monitor = new LevelMonitor(
        this.#context,
        this.#input,
        this.#output
      );

      // Get and log levels
      const levels = monitor.getLevels();
      console.log(
        `InstrumentMasterBus Levels:
         Input:  RMS ${levels.input.rmsDB.toFixed(1)} dB | Peak ${levels.input.peakDB.toFixed(1)} dB
         Output: RMS ${levels.output.rmsDB.toFixed(1)} dB | Peak ${levels.output.peakDB.toFixed(1)} dB
         Gain Reduction: ${levels.gainChangeDB > 0 ? levels.gainChangeDB.toFixed(1) : '0.0'} dB`
      );
    } else {
      // Use existing monitor
      const levels = this.#levelMonitor.getLevels();
      console.log(
        `InstrumentMasterBus Levels:
         Input:  RMS ${levels.input.rmsDB.toFixed(1)} dB | Peak ${levels.input.peakDB.toFixed(1)} dB
         Output: RMS ${levels.output.rmsDB.toFixed(1)} dB | Peak ${levels.output.peakDB.toFixed(1)} dB
         Gain Reduction: ${levels.gainChangeDB > 0 ? levels.gainChangeDB.toFixed(1) : '0.0'} dB`
      );
    }
  }

  /**
   * Enable or disable the compressor
   */
  setCompressorEnabled(enabled: boolean): this {
    if (this.#compressorEnabled !== enabled) {
      this.#compressorEnabled = enabled;
      this.#setupRouting();

      // Notify listeners
      this.#messages.sendMessage('compressor:state', { enabled });
    }
    return this;
  }

  /**
   * Get compressor enabled state
   */
  get compressorEnabled(): boolean {
    return this.#compressorEnabled;
  }

  /**
   * Set compressor parameters
   */
  setCompressorParams(params: {
    threshold?: number;
    knee?: number;
    ratio?: number;
    attack?: number;
    release?: number;
  }): this {
    if (params.threshold !== undefined) {
      this.#compressor.threshold.setValueAtTime(params.threshold, this.now);
    }
    if (params.knee !== undefined) {
      this.#compressor.knee.setValueAtTime(params.knee, this.now);
    }
    if (params.ratio !== undefined) {
      this.#compressor.ratio.setValueAtTime(params.ratio, this.now);
    }
    if (params.attack !== undefined) {
      this.#compressor.attack.setValueAtTime(params.attack, this.now);
    }
    if (params.release !== undefined) {
      this.#compressor.release.setValueAtTime(params.release, this.now);
    }

    return this;
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  connect(destination: AudioNode): this {
    this.#output.connect(destination);
    return this;
  }

  disconnect(): void {
    this.#output.disconnect();
  }

  dispose(): void {
    this.stopLevelMonitoring();
    this.disconnect();
    this.#input.disconnect();
    this.#compressor.disconnect();
    this.#input = null as unknown as GainNode;
    this.#compressor = null as unknown as DynamicsCompressorNode;
    this.#output = null as unknown as GainNode;
    this.#context = null as unknown as AudioContext;
  }

  // Getters and setters
  get now(): number {
    return this.#context.currentTime;
  }

  get inputNode() {
    return this.#input;
  }

  get outputNode() {
    return this.#output;
  }

  get volume(): number {
    return this.#output.gain.value;
  }

  set volume(value: number) {
    // Ensure value is between 0 and 1
    const safeValue = Math.max(0, Math.min(1, value));
    this.#output.gain.setValueAtTime(safeValue, this.now);
  }

  // Input node for connecting instruments
  get input(): AudioNode {
    return this.#input;
  }
}
