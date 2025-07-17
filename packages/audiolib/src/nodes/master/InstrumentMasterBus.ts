import { Connectable, Destination, LibNode } from '@/nodes/LibNode';
import { createNodeId, NodeID } from '@/nodes/node-store';
import { getAudioContext } from '@/context';
import { Message, MessageHandler, createMessageBus } from '@/events';
import { LevelMonitor } from '@/utils/audiodata/monitoring/LevelMonitor';
import { assert } from '@/utils';

const DEFAULT_COMPRESSOR_SETTINGS = {
  threshold: -12.0, // Start compressing at -12dB to catch loud peaks
  knee: 6.0, // Moderate knee for musical compression
  ratio: 3.0, // Gentle 3:1 ratio for polyphonic material
  attack: 0.003, // Fast attack to catch transients (3ms)
  release: 0.05, // Quick release to avoid pumping (50ms)
} as const;

export class InstrumentMasterBus implements LibNode, Connectable {
  readonly nodeId: NodeID;
  readonly nodeType = 'fx';
  #messages;

  #context: AudioContext;
  #destination: Destination | null = null;
  #input: GainNode;
  #output: GainNode;
  #altOut: GainNode | null = null;
  #levelMonitor: LevelMonitor | null = null;

  #compressor: DynamicsCompressorNode | null = null;
  #reverb: AudioWorkletNode | null = null;

  #compressorEnabled: boolean = true;
  #reverbEnabled: boolean = true;
  #isReady: boolean = false;

  get initialized() {
    return this.#isReady;
  }

  constructor(
    context?: AudioContext,
    options = { useCompressor: true, useReverb: true }
  ) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context || getAudioContext();
    this.#messages = createMessageBus<Message>(this.nodeId);

    const { useCompressor = true, useReverb = true } = options;

    this.#compressorEnabled = useCompressor;
    this.#reverbEnabled = useReverb;

    // Create audio nodes
    this.#input = new GainNode(this.#context, { gain: 1.0 });
    this.#output = new GainNode(this.#context, { gain: 1.0 });

    if (useCompressor) this.#compressor = this.#createCompressor();
    if (useReverb) this.#reverb = this.#createReverb();

    // Connect nodes
    this.#setupRouting();

    this.#isReady = true;
  }

  /**
   * Creates a compressor with default settings
   */
  #createCompressor = (): DynamicsCompressorNode =>
    new DynamicsCompressorNode(this.#context, DEFAULT_COMPRESSOR_SETTINGS);

  /**
   * Creates a compressor with default settings
   */
  #createReverb = (): AudioWorkletNode => {
    return new AudioWorkletNode(this.#context, 'dattorro-reverb-processor', {
      outputChannelCount: [2],
    });
  };

  #setupRouting(): void {
    this.#input.disconnect();
    this.#compressor?.disconnect();
    this.#reverb?.disconnect();

    let currentNode: AudioNode = this.#input;

    if (this.#compressorEnabled && this.#compressor) {
      currentNode.connect(this.#compressor);
      currentNode = this.#compressor;
    }

    if (this.#reverbEnabled && this.#reverb) {
      currentNode.connect(this.#reverb);
      currentNode = this.#reverb;
    }

    currentNode.connect(this.#output);
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
    if (!this.#compressor) return this;

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

  setAltOutVolume(gain: number) {
    this.#altOut?.gain.setValueAtTime(gain, this.now);
    return this;
  }

  mute(output: 'main' | 'alt' | 'all' = 'all') {
    if (output === 'main') this.volume = 0;
    else if (output === 'alt') this.altVolume = 0;
    else {
      this.volume = 0;
      this.altVolume = 0;
    }
  }

  connect(destination: Destination): Destination {
    assert(destination instanceof AudioNode, 'remember to fix this'); // TODO
    this.#destination = destination;
    this.#output.connect(destination);
    return destination;
  }

  connectAltOut(destination: AudioNode) {
    if (!this.#altOut) this.#altOut = new GainNode(this.#context);
    this.#altOut.connect(destination);
    return this;
  }

  disconnect(output: 'main' | 'alt' | 'all' = 'all') {
    switch (output) {
      case 'main':
        this.#output.disconnect();
        break;

      case 'alt':
        this.#altOut?.disconnect();
        break;

      case 'all':
      default:
        this.#output.disconnect();
        this.#altOut?.disconnect();
    }
    return this;
  }

  dispose(): void {
    this.stopLevelMonitoring();
    this.disconnect();
    this.#input.disconnect();
    this.#compressor?.disconnect();
    this.#input = null as unknown as GainNode;
    this.#compressor = null as unknown as DynamicsCompressorNode;
    this.#output = null as unknown as GainNode;
    this.#context = null as unknown as AudioContext;
  }

  // Getters and setters
  get now(): number {
    return this.#context.currentTime;
  }

  get input(): AudioNode {
    return this.#input;
  }

  get output() {
    return this.#output;
  }

  get volume(): number {
    return this.#output.gain.value;
  }

  get altVolume(): number | null {
    return this.#altOut?.gain.value ?? null;
  }

  set altVolume(value: number) {
    this.#altOut?.gain.setValueAtTime(value, this.now);
  }

  set volume(value: number) {
    // Ensure value is between 0 and 1
    const safeValue = Math.max(0, Math.min(1, value));
    this.#output.gain.setValueAtTime(safeValue, this.now);
  }
}
