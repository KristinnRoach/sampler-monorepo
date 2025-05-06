import { LibNode } from '@/LibNode';
import { createNodeId, NodeID } from '@/state/registry/NodeIDs';
import { getAudioContext } from '@/context';
import { Message, MessageHandler, createMessageBus } from '@/events';
import { LevelMonitor } from '@/utils/monitoring/LevelMonitor';

export class MasterBus implements LibNode {
  readonly nodeId: NodeID;
  readonly nodeType = 'fx';

  #context: AudioContext;
  #input: GainNode;
  #output: GainNode;
  #limiter: DynamicsCompressorNode;
  #messages;
  #limiterEnabled: boolean = true;
  #levelMonitor: LevelMonitor | null = null;

  constructor() {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = getAudioContext();
    this.#messages = createMessageBus<Message>(this.nodeId);

    // Create audio nodes
    this.#input = new GainNode(this.#context, { gain: 1.0 });
    this.#limiter = this.#createLimiter();
    this.#output = new GainNode(this.#context, { gain: 1.0 });

    // Connect nodes
    this.#setupRouting();
  }

  /**
   * Creates a limiter to prevent clipping
   * This is kept as a separate method for easy refactoring later
   */
  #createLimiter(): DynamicsCompressorNode {
    // Using DynamicsCompressorNode as a limiter with more conservative settings
    const limiter = new DynamicsCompressorNode(this.#context, {
      threshold: -3.0, // dB (slightly lower to catch peaks but not too aggressive)
      knee: 1.0, // dB (slight knee for smoother limiting)
      ratio: 12.0, // ratio (high enough for limiting but not extreme)
      attack: 0.005, // seconds (fast attack but not instantaneous)
      release: 0.05, // seconds (faster release to avoid pumping)
    });

    return limiter;
  }

  /**
   * Sets up the audio routing based on whether limiting is enabled
   */
  #setupRouting(): void {
    // Disconnect existing connections, if any
    this.#input.disconnect();
    this.#limiter.disconnect();

    if (this.#limiterEnabled) {
      // Route through limiter
      this.#input.connect(this.#limiter);
      this.#limiter.connect(this.#output);
    } else {
      // Bypass limiter
      this.#input.connect(this.#output);
    }

    // Debug log to verify connections
    console.debug(
      'MasterBus routing set up, limiter enabled:',
      this.#limiterEnabled
    );
  }

  /**
   * Start monitoring input and output levels
   * @param intervalMs How often to log levels (in milliseconds)
   * @param fftSize Size of FFT for analysis (larger = more precise but more CPU)
   */
  startLevelMonitoring(
    intervalMs: number = 1000,
    fftSize: number = 1024
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
    this.#levelMonitor.start(intervalMs);

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
        `MasterBus Levels:
         Input:  RMS ${levels.input.rmsDB.toFixed(1)} dB | Peak ${levels.input.peakDB.toFixed(1)} dB
         Output: RMS ${levels.output.rmsDB.toFixed(1)} dB | Peak ${levels.output.peakDB.toFixed(1)} dB
         Gain Reduction: ${levels.gainChangeDB > 0 ? levels.gainChangeDB.toFixed(1) : '0.0'} dB`
      );
    } else {
      // Use existing monitor
      const levels = this.#levelMonitor.getLevels();
      console.log(
        `MasterBus Levels:
         Input:  RMS ${levels.input.rmsDB.toFixed(1)} dB | Peak ${levels.input.peakDB.toFixed(1)} dB
         Output: RMS ${levels.output.rmsDB.toFixed(1)} dB | Peak ${levels.output.peakDB.toFixed(1)} dB
         Gain Reduction: ${levels.gainChangeDB > 0 ? levels.gainChangeDB.toFixed(1) : '0.0'} dB`
      );
    }
  }

  /**
   * Enable or disable the limiter
   */
  setLimiterEnabled(enabled: boolean): this {
    if (this.#limiterEnabled !== enabled) {
      this.#limiterEnabled = enabled;
      this.#setupRouting();

      // Notify listeners
      this.#messages.sendMessage('limiter:state', { enabled });
    }
    return this;
  }

  /**
   * Get limiter enabled state
   */
  get limiterEnabled(): boolean {
    return this.#limiterEnabled;
  }

  /**
   * Set limiter parameters
   */
  setLimiterParams(params: {
    threshold?: number;
    knee?: number;
    ratio?: number;
    attack?: number;
    release?: number;
  }): this {
    if (params.threshold !== undefined) {
      this.#limiter.threshold.setValueAtTime(params.threshold, this.now);
    }
    if (params.knee !== undefined) {
      this.#limiter.knee.setValueAtTime(params.knee, this.now);
    }
    if (params.ratio !== undefined) {
      this.#limiter.ratio.setValueAtTime(params.ratio, this.now);
    }
    if (params.attack !== undefined) {
      this.#limiter.attack.setValueAtTime(params.attack, this.now);
    }
    if (params.release !== undefined) {
      this.#limiter.release.setValueAtTime(params.release, this.now);
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
    this.#limiter.disconnect();
    this.#input = null as unknown as GainNode;
    this.#limiter = null as unknown as DynamicsCompressorNode;
    this.#output = null as unknown as GainNode;
    this.#context = null as unknown as AudioContext;
  }

  // Getters and setters
  get now(): number {
    return this.#context.currentTime;
  }

  get volume(): number {
    return this.#output.gain.value;
  }

  set volume(value: number) {
    // Ensure value is between 0 and 1
    const safeValue = Math.max(0, Math.min(1, value));
    this.#output.gain.setValueAtTime(safeValue, this.now);
  }

  // Input node for connecting instrument buses
  get input(): AudioNode {
    return this.#input;
  }
}
