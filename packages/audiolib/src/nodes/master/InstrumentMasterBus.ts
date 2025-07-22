import { Connectable, Destination, FxType, LibNode } from '@/nodes/LibNode';
import { createNodeId, NodeID } from '@/nodes/node-store';
import { getAudioContext } from '@/context';
import {
  Message,
  MessageBus,
  MessageHandler,
  createMessageBus,
} from '@/events';
import { assert } from '@/utils';

import {
  DEFAULT_COMPRESSOR_SETTINGS,
  DEFAULT_LIMITER_SETTINGS,
} from './defaults';
import { LevelMonitor } from '@/utils/audiodata/monitoring/LevelMonitor';
import { DattorroReverb } from '@/nodes/effects/DattorroReverb';
import { KarplusEffect } from '../effects/KarplusEffect';

export type BusEffectName = 'karplus' | 'reverb' | 'compressor' | 'limiter';

export class InstrumentMasterBus implements LibNode, Connectable {
  readonly nodeId: NodeID;
  readonly nodeType = 'InstrumentBus';
  #messages: MessageBus<Message>;

  #context: AudioContext;
  #destination: AudioNode | null = null;

  #input: GainNode;

  #dryMix: GainNode;
  #wetMix: GainNode;
  #mainOutput: GainNode;
  #altOut: GainNode | null = null;
  // #outputCompressor: DynamicsCompressorNode | null = null;

  #effects: Map<
    string,
    {
      effect: any;
      send: GainNode | null;
      return: GainNode | null;
      enabled: boolean;
      insert: boolean;
    }
  > = new Map();

  #initialized = false;

  constructor(context?: AudioContext) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context || getAudioContext();
    this.#messages = createMessageBus(this.nodeId);

    this.#input = new GainNode(this.#context, { gain: 0.75 });
    this.#dryMix = new GainNode(this.#context, { gain: 1.0 });
    this.#wetMix = new GainNode(this.#context, { gain: 1.0 });
    this.#mainOutput = new GainNode(this.#context, { gain: 1.0 });

    // Start with direct connection (will be rewired when insert effects are added)
    this.#input.connect(this.#mainOutput);

    // Add insert effect first (affects dry signal)
    this.addEffect('karplus', new KarplusEffect(this.#context), {
      insert: true,
    });
    this.addEffect(
      'compressor',
      new DynamicsCompressorNode(this.#context, DEFAULT_COMPRESSOR_SETTINGS),
      { insert: true }
    );
    this.addEffect(
      'limiter',
      new DynamicsCompressorNode(this.#context, DEFAULT_LIMITER_SETTINGS),
      { insert: true }
    );

    // Add send effects
    this.addEffect('reverb', new DattorroReverb(this.#context));

    this.#initialized = true;
  }

  /**
   * Trigger effects
   */
  noteOn(midiNote: number, velocity: number = 100, secondsFromNow = 0): this {
    const karplus = this.getEffect<KarplusEffect>('karplus');
    if (karplus && karplus.trigger) {
      karplus.trigger(midiNote, velocity, secondsFromNow);
    }
    return this;
  }

  /**
   * Add any effect with automatic send/return creation and optional routing
   */
  addEffect(
    name: string,
    effect: any,
    options?: { routeTo?: string; insert?: boolean }
  ): this {
    const { routeTo, insert = false } = options || {};

    if (insert) {
      // Insert effect: goes directly in the signal chain
      this.#effects.set(name, {
        effect,
        send: null, // No send/return for inserts
        return: null,
        enabled: true,
        insert: true,
      });

      this.#rewireInsertChain();
    } else {
      const send = new GainNode(this.#context, { gain: 0.0 });
      const ret = new GainNode(this.#context, { gain: 1.0 });

      this.#effects.set(name, {
        effect,
        send,
        return: ret,
        enabled: true,
        insert: false,
      });

      // Wire up send path
      this.#getInsertChainOutput().connect(send);

      // Handle different effect input/output patterns
      if (effect.in && effect.out) {
        send.connect(effect.in);
        effect.out.connect(ret);
      } else {
        send.connect(effect);
        effect.connect(ret);
      }

      // Connect to specified effect or output
      if (routeTo && this.#effects.has(routeTo)) {
        const targetEffect = this.#effects.get(routeTo)!;
        if (targetEffect.effect.in) {
          ret.connect(targetEffect.effect.in);
        } else {
          ret.connect(targetEffect.effect);
        }
      } else {
        ret.connect(this.#wetMix); // ? Is this always correct, what about dry effects ?
      }
    }

    return this;
  }

  #rewireInsertChain(): void {
    // Disconnect everything first
    this.#input.disconnect();

    // Get all insert effects
    const insertEffects = Array.from(this.#effects.entries())
      .filter(([_, fx]) => fx.insert)
      .map(([name, fx]) => ({ name, effect: fx.effect }));

    let currentNode: AudioNode = this.#input;

    // Chain insert effects in order they were added
    for (const { effect } of insertEffects) {
      if (effect.in && effect.out) {
        currentNode.connect(effect.in);
        currentNode = effect.out;
      } else {
        currentNode.connect(effect);
        currentNode = effect;
      }
    }

    // CHANGE: Route through dry/wet mix instead of direct to main output
    currentNode.connect(this.#dryMix);
    this.#dryMix.connect(this.#mainOutput);

    // Reconnect all send effects to the end of insert chain
    for (const [_, fx] of this.#effects) {
      if (!fx.insert && fx.send) {
        currentNode.connect(fx.send);
      }
    }

    // CHANGE: Route wet returns through wetMix
    for (const [_, fx] of this.#effects) {
      if (!fx.insert && fx.return) {
        fx.return.disconnect();
        fx.return.connect(this.#wetMix);
      }
    }
    this.#wetMix.connect(this.#mainOutput);
  }

  /**
   * Get the output of the insert chain (for connecting sends)
   */
  #getInsertChainOutput(): AudioNode {
    const insertEffects = Array.from(this.#effects.values()).filter(
      (fx) => fx.insert
    );

    if (insertEffects.length === 0) {
      return this.#input;
    }

    // Return the output of the last insert effect
    const lastInsert = insertEffects[insertEffects.length - 1];
    return lastInsert.effect.out || lastInsert.effect;
  }

  /**
   * Get current routing configuration
   */
  getRoutingMap(): Record<string, string | 'output'> {
    const routing: Record<string, string | 'output'> = {};

    for (const [effectName, fx] of this.#effects) {
      // Check what this effect's return is connected to
      let routesTo = 'output';

      for (const [targetName, targetFx] of this.#effects) {
        if (targetName === effectName) continue;

        // This is a simplified check - in practice you might want to track connections more explicitly
        if (fx.return && fx.return.numberOfOutputs > 0) {
          // Assume it routes to another effect if not directly to output
          // You could make this more robust by tracking connections
          routesTo = 'unknown'; // Placeholder - you'd implement proper connection tracking
        }
      }

      routing[effectName] = routesTo;
    }

    return routing;
  }

  /**
   * Get the actual effect instance for direct control
   */
  getEffect<T = any>(effect: BusEffectName): T | null {
    return this.#effects.get(effect)?.effect || null;
  }

  /**
   * Get current send level
   */
  getSend(effect: BusEffectName): number {
    return this.#effects.get(effect)?.send?.gain.value || 0;
  }

  /**
   * Get current return level
   */
  getReturn(effect: BusEffectName): number {
    return this.#effects.get(effect)?.return?.gain.value || 0;
  }

  // === SETTERS ===

  setDryWetMix(mix: { dry: number; wet: number }): this {
    this.#dryMix.gain.setValueAtTime(mix.dry, this.now);
    this.#wetMix.gain.setValueAtTime(mix.wet, this.now);
    return this;
  }

  /**
   * Set up a complete routing chain in order
   */
  setRoutingChain(...effectNames: BusEffectName[]): this {
    // Disconnect all effects first
    for (const name of effectNames) {
      this.setEffectRoute(name); // Routes to output
    }

    // Chain them in order
    for (let i = 0; i < effectNames.length - 1; i++) {
      this.setEffectRoute(effectNames[i], effectNames[i + 1]);
    }

    return this;
  }

  /**
   * Change where an effect routes to after initialization
   */
  setEffectRoute(effect: BusEffectName, routeTo?: string): this {
    const fx = this.#effects.get(effect);
    if (!fx?.return) return this;

    // Disconnect current routing
    fx.return.disconnect();

    // Connect to new destination
    if (routeTo && this.#effects.has(routeTo)) {
      const targetEffect = this.#effects.get(routeTo)!;
      if (targetEffect.effect.in) {
        fx.return.connect(targetEffect.effect.in);
      } else {
        fx.return.connect(targetEffect.effect);
      }
    } else {
      // No routeTo or invalid target = connect to output // ! or wetMix ?
      fx.return.connect(this.#wetMix);
    }

    return this;
  }

  /**
   * Remove an effect completely
   */
  removeEffect(name: string): this {
    const fx = this.#effects.get(name);
    if (fx) {
      fx.send?.disconnect();
      fx.return?.disconnect();
      fx.effect.disconnect?.();
      this.#effects.delete(name);
    }
    return this;
  }

  /**
   * Set send amount for any effect (0.0 = none, 1.0 = full)
   */
  send(effect: BusEffectName, amount: number): this {
    const fx = this.#effects.get(effect);
    if (fx?.send && fx.enabled) {
      const safeValue = Math.max(0, Math.min(1, amount));
      fx.send.gain.setValueAtTime(safeValue, this.now);
    }
    return this;
  }

  /**
   * Set return level for any effect (0.0 = silent, 1.0 = full)
   */
  return(effect: BusEffectName, level: number): this {
    const fx = this.#effects.get(effect);
    if (fx?.return) {
      const safeValue = Math.max(0, Math.min(1, level));
      fx.return.gain.setValueAtTime(safeValue, this.now);
    }
    return this;
  }

  /**
   * Enable/disable an effect (bypasses send when disabled)
   */
  setEffectEnabled(effect: BusEffectName, enabled: boolean): this {
    const fx = this.#effects.get(effect);
    if (fx) {
      fx.enabled = enabled;
      if (!enabled && fx.send) {
        fx.send.gain.setValueAtTime(0, this.now);
      }
    }
    return this;
  }

  /**
   * Set's reverb send amount as well as adjusting internal params
   */
  setReverbAmount(amount: number): this {
    this.send('reverb', amount);

    const reverb = this.getEffect<DattorroReverb>('reverb');
    if (reverb && reverb.setAmountMacro) {
      reverb.setAmountMacro(amount);
    }
    return this;
  }

  /**
   * Set's effects wet/dry mix as well as adjusting internal params
   */
  setKarplusAmount(amount: number): this {
    const effect = this.getEffect<KarplusEffect>('karplus');
    if (effect && effect.setAmountMacro) {
      effect.setAmountMacro(amount);
    }
    return this;
  }

  // === CORE AUDIO GRAPH METHODS ===

  connect(destination: AudioNode): AudioNode {
    this.#destination = destination;
    this.#mainOutput.connect(destination);
    return destination;
  }

  disconnect(): this {
    this.#mainOutput.disconnect();
    return this;
  }

  dispose(): void {
    this.disconnect();
    this.#input.disconnect();

    // Clean up all effects
    for (const [name] of this.#effects) {
      this.removeEffect(name);
    }
  }

  // === SIMPLE ACCESSORS ===

  get input(): GainNode {
    return this.#input;
  }

  get output(): GainNode {
    return this.#mainOutput;
  }

  get now(): number {
    return this.#context.currentTime;
  }

  /**
   * Set overall output level
   */
  set outputLevel(level: number) {
    const safeValue = Math.max(0, Math.min(1, level));
    this.#mainOutput.gain.setValueAtTime(safeValue, this.now);
  }

  get outputLevel(): number {
    return this.#mainOutput.gain.value;
  }

  #levelMonitor: LevelMonitor | null = null;

  /**
   * Start monitoring input and output levels
   */
  startLevelMonitoring(
    intervalMs: number = 1000,
    fftSize: number = 1024,
    logOutput: boolean = false
  ): void {
    this.stopLevelMonitoring();

    this.#levelMonitor = new LevelMonitor(
      this.#context,
      this.#input,
      this.#mainOutput,
      fftSize
    );

    this.#levelMonitor.start(intervalMs, undefined, logOutput);
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
   * Log current levels once
   */
  logLevels(): void {
    if (!this.#levelMonitor) {
      const monitor = new LevelMonitor(
        this.#context,
        this.#input,
        this.#mainOutput
      );
      const levels = monitor.getLevels();
      console.log(
        `Levels: Input RMS ${levels.input.rmsDB.toFixed(1)} dB | Output RMS ${levels.output.rmsDB.toFixed(1)} dB`
      );
    } else {
      const levels = this.#levelMonitor.getLevels();
      console.log(
        `Levels: Input RMS ${levels.input.rmsDB.toFixed(1)} dB | Output RMS ${levels.output.rmsDB.toFixed(1)} dB`
      );
    }
  }

  /**
   * Message handling
   */
  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  /**
   * Set compressor parameters directly
   */
  setCompressorParams(params: {
    threshold?: number;
    knee?: number;
    ratio?: number;
    attack?: number;
    release?: number;
  }): this {
    const compressor = this.getEffect<DynamicsCompressorNode>('compressor');
    if (!compressor) return this;

    if (params.threshold !== undefined) {
      compressor.threshold.setValueAtTime(params.threshold, this.now);
    }
    if (params.knee !== undefined) {
      compressor.knee.setValueAtTime(params.knee, this.now);
    }
    if (params.ratio !== undefined) {
      compressor.ratio.setValueAtTime(params.ratio, this.now);
    }
    if (params.attack !== undefined) {
      compressor.attack.setValueAtTime(params.attack, this.now);
    }
    if (params.release !== undefined) {
      compressor.release.setValueAtTime(params.release, this.now);
    }

    return this;
  }

  /**
   * Alternative output support
   */
  connectAltOut(destination: AudioNode): this {
    if (!this.#altOut) {
      this.#altOut = new GainNode(this.#context);
      this.#mainOutput.connect(this.#altOut); // Alt out gets the same mixed signal
    }
    this.#altOut.connect(destination);
    return this;
  }

  setAltOutVolume(gain: number): this {
    this.#altOut?.gain.setValueAtTime(gain, this.now);
    return this;
  }

  get altVolume(): number | null {
    return this.#altOut?.gain.value ?? null;
  }

  set altVolume(value: number) {
    this.#altOut?.gain.setValueAtTime(value, this.now);
  }

  /**
   * Mute functionality
   */
  mute(output: 'main' | 'alt' | 'all' = 'all'): this {
    if (output === 'main' || output === 'all') {
      this.#mainOutput.gain.linearRampToValueAtTime(0, this.now + 0.1);
    }
    if (output === 'alt' || output === 'all') {
      this.#altOut?.gain.linearRampToValueAtTime(0, this.now + 0.1);
    }
    return this;
  }

  /**
   * Getters for compatibility with original interface
   */
  get compressorEnabled(): boolean {
    return this.#effects.get('compressor')?.enabled ?? false;
  }

  get reverbEnabled(): boolean {
    return this.#effects.get('reverb')?.enabled ?? false;
  }

  get karplusFxEnabled(): boolean {
    return this.#effects.get('karplus')?.enabled ?? false;
  }

  get initialized(): boolean {
    return this.#initialized;
  }

  /**
   * Setters for compatibility
   */
  setCompressorEnabled(enabled: boolean): this {
    return this.setEffectEnabled('compressor', enabled);
  }

  setReverbEnabled(enabled: boolean): this {
    return this.setEffectEnabled('reverb', enabled);
  }

  setKarplusFxEnabled(enabled: boolean): this {
    return this.setEffectEnabled('karplus', enabled);
  }

  /**
   * Legacy getters for send/return values
   */
  get reverbSend(): number {
    return this.getSend('reverb');
  }

  get karplusSend(): number {
    return this.getSend('karplus');
  }

  get reverbReturn(): number {
    return this.getReturn('reverb');
  }

  get karplusReturn(): number {
    return this.getReturn('karplus');
  }

  /**
   * Legacy setters
   */
  setReverbReturn(level: number): this {
    return this.return('reverb', level);
  }

  setKarplusReturn(level: number): this {
    return this.return('karplus', level);
  }
}

// /**
//  * Rebuild the insert effect chain
//  */
// #rewireInsertChain(): void {
//   // Disconnect everything first
//   this.#input.disconnect();

//   // Get all insert effects
//   const insertEffects = Array.from(this.#effects.entries())
//     .filter(([_, fx]) => fx.insert)
//     .map(([name, fx]) => ({ name, effect: fx.effect }));

//   let currentNode: AudioNode = this.#input;

//   // Chain insert effects in order they were added
//   for (const { effect } of insertEffects) {
//     if (effect.in && effect.out) {
//       currentNode.connect(effect.in);
//       currentNode = effect.out;
//     } else {
//       currentNode.connect(effect);
//       currentNode = effect;
//     }
//   }

//   // Connect final insert output to dry path and send effects
//   currentNode.connect(this.#mainOutput);

//   // Reconnect all send effects to the end of insert chain
//   for (const [_, fx] of this.#effects) {
//     if (!fx.insert && fx.send) {
//       currentNode.connect(fx.send);
//     }
//   }
// }

// export class InstrumentMasterBus implements LibNode, Connectable {
//   readonly nodeId: NodeID;
//   readonly nodeType = 'fx';
//   #messages;

//   #context: AudioContext;
//   #destination: Destination | null = null;
//   #levelMonitor: LevelMonitor | null = null;

//   #input: GainNode;
//   #output: GainNode;
//   #altOut: GainNode | null = null;

//   // SEND/RETURN NODES
//   #sends: {
//     reverb: GainNode;
//     karplus: GainNode;
//   };

//   #returns: {
//     reverb: GainNode;
//     karplus: GainNode;
//   };

//   // EFFECTS
//   #compressor: DynamicsCompressorNode | null = null;
//   #reverb: DattorroReverb | null = null;
//   #karplusEffect: KarplusEffect | null = null;
//   #compressorEnabled: boolean = true;
//   #reverbEnabled: boolean = true;
//   #karplusFxEnabled: boolean = true;

//   #isReady: boolean = false;

//   get initialized() {
//     return this.#isReady;
//   }

//   constructor(
//     context?: AudioContext,
//     options = { useCompressor: true, useReverb: true, useKarplus: true }
//   ) {
//     this.nodeId = createNodeId(this.nodeType);
//     this.#context = context || getAudioContext();
//     this.#messages = createMessageBus<Message>(this.nodeId);

//     const {
//       useCompressor = true,
//       useReverb = true,
//       useKarplus = true,
//     } = options;

//     this.#compressorEnabled = useCompressor;
//     this.#reverbEnabled = useReverb;

//     // Create audio nodes
//     this.#input = new GainNode(this.#context, { gain: 1.0 });
//     this.#output = new GainNode(this.#context, { gain: 1.0 });

//     //     this.#wetInput = new GainNode(this.#context, { gain: 1.0 });
//     // this.#wetOutput = new GainNode(this.#context, { gain: 1.0 });

//     this.#sends = {
//       reverb: new GainNode(this.#context, { gain: 0.0 }),
//       karplus: new GainNode(this.#context, { gain: 0.0 }),
//     };

//     this.#returns = {
//       reverb: new GainNode(this.#context, { gain: 1.0 }),
//       karplus: new GainNode(this.#context, { gain: 1.0 }),
//     };

//     if (useCompressor) this.#compressor = this.#createCompressor();
//     if (useReverb) {
//       this.#reverb = this.#createReverb();
//       this.setReverbReturn(1);
//     }
//     if (useKarplus) {
//       this.#karplusEffect = this.#createKarplusEffect();
//       this.setKarplusReturn(0.8); // default
//     }

//     // Connect nodes
//     this.#setupRouting();

//     this.#isReady = true;
//   }

//   /**
//    * Creates a compressor with default settings
//    */
//   #createCompressor = (): DynamicsCompressorNode =>
//     new DynamicsCompressorNode(this.#context, DEFAULT_COMPRESSOR_SETTINGS);

//   /**
//    * Creates a reverb with default settings
//    */
//   #createReverb = () => {
//     return new DattorroReverb(this.#context);
//   };

//   #createKarplusEffect = () => {
//     const effect = new KarplusEffect(this.#context);

//     // effect.setDelay(0.1);
//     // effect.setFeedback(0.7);

//     return effect;
//   };

//   noteOn(
//     midiNote: MidiValue,
//     velocity: MidiValue = 100,
//     secondsFromNow = 0
//   ): this {
//     if (this.#karplusEffect && this.#karplusFxEnabled) {
//       this.#karplusEffect.trigger(midiNote, velocity, secondsFromNow);
//     }
//     return this;
//   }

//   #setupRouting(): void {
//     // Disconnect everything first
//     this.#disconnectAll();

//     /*
//     ROUTING DIAGRAM:

//     Input Signal
//          |
//     ┌─dryInput─┐
//     │          │
//     │    ┌─────┴─── dryOutput ──────┐
//     │    │                          │
//     │    ├─── reverbSend ──→ reverb ──→ reverbReturn ──┐
//     │    │                                             │
//     │    └─── karplusSend ──→ karplus ──→ karplusReturn ──┘
//     │                                                  │
//     └──────────────── DESTINATION ←───────────────────-┘
//     */

//     // Main dry path
//     this.#input.connect(this.#output);

//     // Reverb send path
//     this.#input.connect(this.#sends.reverb);
//     if (this.#reverbEnabled && this.#reverb) {
//       this.#sends.reverb.connect(this.#reverb.input);
//       this.#reverb.connect(this.#returns.reverb);
//     }

//     // Karplus send path
//     this.#input.connect(this.#sends.karplus);
//     if (this.#karplusFxEnabled && this.#karplusEffect) {
//       this.#sends.karplus.connect(this.#karplusEffect.in);
//       this.#karplusEffect.out.connect(this.#returns.karplus);
//     }

//     // Connect to final destination
//     if (this.#destination instanceof AudioNode) {
//       this.#output.connect(this.#destination);
//       this.#returns.reverb.connect(this.#destination);
//       this.#returns.karplus.connect(this.#destination);
//     }
//   }

//   #disconnectAll(): void {
//     this.#input.disconnect();
//     this.#output.disconnect();

//     // Disconnect all sends/returns
//     Object.values(this.#sends).forEach((node) => node.disconnect());
//     Object.values(this.#returns).forEach((node) => node.disconnect());

//     // Disconnect effects
//     this.#reverb?.disconnect();
//     this.#karplusEffect?.disconnect();
//   }

//   /**
//    * Start monitoring input and output levels
//    * @param intervalMs How often to log levels (in milliseconds)
//    * @param fftSize Size of FFT for analysis (larger = more precise but more CPU)
//    */
//   startLevelMonitoring(
//     intervalMs: number = 1000,
//     fftSize: number = 1024,
//     logOutput: boolean = false
//   ): void {
//     // Stop any existing monitoring
//     this.stopLevelMonitoring();

//     // Create level monitor if it doesn't exist
//     this.#levelMonitor = new LevelMonitor(
//       this.#context,
//       this.#input,
//       this.#output,
//       fftSize
//     );

//     // Start monitoring
//     this.#levelMonitor.start(intervalMs), fftSize, logOutput;

//     console.log('Level monitoring started');
//   }

//   /**
//    * Stop monitoring levels
//    */
//   stopLevelMonitoring(): void {
//     if (this.#levelMonitor) {
//       this.#levelMonitor.stop();
//       this.#levelMonitor = null;
//       console.log('Level monitoring stopped');
//     }
//   }

//   /**
//    * Log current levels once (without starting continuous monitoring)
//    */
//   logLevels(): void {
//     if (!this.#levelMonitor) {
//       // Create temporary monitor
//       const monitor = new LevelMonitor(
//         this.#context,
//         this.#input,
//         this.#output
//       );

//       // Get and log levels
//       const levels = monitor.getLevels();
//       console.log(
//         `InstrumentMasterBus Levels:
//          Input:  RMS ${levels.input.rmsDB.toFixed(1)} dB | Peak ${levels.input.peakDB.toFixed(1)} dB
//          Output: RMS ${levels.output.rmsDB.toFixed(1)} dB | Peak ${levels.output.peakDB.toFixed(1)} dB
//          Gain Reduction: ${levels.gainChangeDB > 0 ? levels.gainChangeDB.toFixed(1) : '0.0'} dB`
//       );
//     } else {
//       // Use existing monitor
//       const levels = this.#levelMonitor.getLevels();
//       console.log(
//         `InstrumentMasterBus Levels:
//          Input:  RMS ${levels.input.rmsDB.toFixed(1)} dB | Peak ${levels.input.peakDB.toFixed(1)} dB
//          Output: RMS ${levels.output.rmsDB.toFixed(1)} dB | Peak ${levels.output.peakDB.toFixed(1)} dB
//          Gain Reduction: ${levels.gainChangeDB > 0 ? levels.gainChangeDB.toFixed(1) : '0.0'} dB`
//       );
//     }
//   }

//   /**
//    * Enable or disable the compressor
//    */
//   setCompressorEnabled(enabled: boolean): this {
//     if (this.#compressorEnabled !== enabled) {
//       this.#compressorEnabled = enabled;
//       this.#setupRouting();

//       this.#messages.sendMessage('compressor:state', { enabled });
//     }
//     return this;
//   }

//   /**
//    * Enable or disable the reverb
//    */
//   setReverbEnabled(enabled: boolean): this {
//     if (this.#reverbEnabled !== enabled) {
//       this.#reverbEnabled = enabled;
//       this.#setupRouting();

//       this.#messages.sendMessage('reverb:state', { enabled });
//     }
//     return this;
//   }

//   /**
//    * Enable or disable karplus effect
//    */
//   setKarplusFxEnabled(enabled: boolean): this {
//     if (this.#karplusFxEnabled !== enabled) {
//       this.#karplusFxEnabled = enabled;
//       this.#setupRouting();

//       this.#messages.sendMessage('karplus-fx:state', { enabled });
//     }
//     return this;
//   }

//   /**
//    * Set compressor parameters
//    */
//   setCompressorParams(params: {
//     threshold?: number;
//     knee?: number;
//     ratio?: number;
//     attack?: number;
//     release?: number;
//   }): this {
//     if (!this.#compressor) return this;

//     if (params.threshold !== undefined) {
//       this.#compressor.threshold.setValueAtTime(params.threshold, this.now);
//     }
//     if (params.knee !== undefined) {
//       this.#compressor.knee.setValueAtTime(params.knee, this.now);
//     }
//     if (params.ratio !== undefined) {
//       this.#compressor.ratio.setValueAtTime(params.ratio, this.now);
//     }
//     if (params.attack !== undefined) {
//       this.#compressor.attack.setValueAtTime(params.attack, this.now);
//     }
//     if (params.release !== undefined) {
//       this.#compressor.release.setValueAtTime(params.release, this.now);
//     }

//     return this;
//   }

//   onMessage(type: string, handler: MessageHandler<Message>): () => void {
//     return this.#messages.onMessage(type, handler);
//   }

//   setAltOutVolume(gain: number) {
//     this.#altOut?.gain.setValueAtTime(gain, this.now);
//     return this;
//   }

//   mute(output: 'main' | 'alt' | 'all' = 'all') {
//     if (output === 'main') {
//       this.#output.gain.linearRampToValueAtTime(0, this.now + 0.1);
//       // this.#wetOutput.gain.linearRampToValueAtTime(0, this.now + 0.1)
//     } else if (output === 'alt')
//       this.#altOut?.gain.linearRampToValueAtTime(0, this.now + 0.1);
//     // else {
//     //   this.outVolume = 0;
//     //   this.altVolume = 0;
//     // }
//   }

//   connect(
//     destination: Destination,
//     output: 'dry' | 'wet' | 'alt' = 'dry'
//   ): Destination {
//     assert(destination instanceof AudioNode, 'remember to fix this'); // TODO
//     this.#destination = destination;

//     if (output === 'dry') this.#output.connect(destination);
//     // else if (output === 'wet') this.#wetOutput.connect(destination);
//     else if (output === 'alt' && this.#altOut) {
//       this.#altOut.connect(destination);
//     }

//     return destination;
//   }

//   connectAltOut(destination: AudioNode) {
//     if (!this.#altOut) this.#altOut = new GainNode(this.#context);
//     this.#altOut.connect(destination);
//     return this;
//   }

//   disconnect(output: 'dry' | 'wet' | 'alt' = 'dry') {
//     switch (output) {
//       case 'dry':
//         this.#output.disconnect();
//         break;

//       case 'wet':
//         // this.#wetOutput.disconnect();
//         break;

//       case 'alt':
//         this.#altOut?.disconnect();

//       default:
//         this.#output.disconnect();
//     }
//     return this;
//   }

//   dispose(): void {
//     this.stopLevelMonitoring();
//     this.disconnect();
//     this.#input.disconnect();
//     this.#output.disconnect();
//     // this.#wetInput.disconnect();
//     // this.#wetOutput.disconnect();
//     // this.#altOut?.disconnect();
//     this.#compressor?.disconnect();
//     this.#reverb?.disconnect();
//     // this.#wetOutput?.disconnect();

//     this.#input = null as unknown as GainNode;
//     this.#output = null as unknown as GainNode;
//     this.#output = null as unknown as GainNode;
//     // this.#wetOutput = null as unknown as GainNode;
//     // this.#altOut = null as unknown as GainNode;
//     this.#compressor = null as unknown as DynamicsCompressorNode;
//     this.#reverb = null as unknown as DattorroReverb;
//     // this.#wetOutput = null as unknown as GainNode;
//     this.#context = null as unknown as AudioContext;
//   }

//   // === GETTERS ===

//   get now(): number {
//     return this.#context.currentTime;
//   }

//   get dryInput() {
//     return this.#input;
//   }

//   // get wetInput() {
//   //   return this.#wetInput;
//   // }

//   get dryOutput() {
//     return this.#output;
//   }

//   // get wetOutput() {
//   //   return this.#wetOutput;
//   // }

//   get compressorEnabled(): boolean {
//     return this.#compressorEnabled;
//   }

//   get reverbEnabled(): boolean {
//     return this.#reverbEnabled;
//   }

//   get outVolume(): number {
//     return this.#output.gain.value;
//   }

//   get altVolume(): number | null {
//     return this.#altOut?.gain.value ?? null;
//   }

//   // === GETTERS FOR CURRENT VALUES ===

//   get reverbSend(): number {
//     return this.#sends.reverb.gain.value;
//   }

//   get karplusSend(): number {
//     return this.#sends.karplus.gain.value;
//   }

//   get reverbReturn(): number {
//     return this.#returns.reverb.gain.value;
//   }

//   get karplusReturn(): number {
//     return this.#returns.karplus.gain.value;
//   }

//   get dryLevel(): number {
//     return this.#output.gain.value;
//   }

//   // === INPUT/OUTPUT ACCESS ===

//   get input() {
//     return this.#input; // Main input point
//   }

//   get output() {
//     return this.#destination; // Where everything goes
//   }

//   // === SETTERS ===

//   /**
//    * Set how much signal goes to reverb (0.0 = none, 1.0 = full)
//    */
//   setReverbSend(amount: number): this {
//     const safeValue = Math.max(0, Math.min(1, amount));
//     this.#sends.reverb.gain.setValueAtTime(safeValue, this.now);
//     return this;
//   }

//   /**
//    * Set how much signal goes to karplus effect (0.0 = none, 1.0 = full)
//    */
//   setKarplusSend(amount: number): this {
//     const safeValue = Math.max(0, Math.min(1, amount));
//     this.#sends.karplus.gain.setValueAtTime(safeValue, this.now);
//     return this;
//   }

//   /**
//    * Set reverb output level in final mix (0.0 = silent, 1.0 = full)
//    */
//   setReverbReturn(level: number): this {
//     const safeValue = Math.max(0, Math.min(1, level));
//     this.#returns.reverb.gain.setValueAtTime(safeValue, this.now);
//     return this;
//   }

//   /**
//    * Set karplus output level in final mix (0.0 = silent, 1.0 = full)
//    */
//   setKarplusReturn(level: number): this {
//     const safeValue = Math.max(0, Math.min(1, level));
//     this.#returns.karplus.gain.setValueAtTime(safeValue, this.now);
//     return this;
//   }

//   setReverbAmount(amount: number): this {
//     if (!this.#reverbEnabled || !this.#reverb) return this;

//     this.setReverbSend(amount);
//     this.#reverb.setAmountMacro(amount);

//     return this;
//   }

//   /**
//    * Set karplus amount (controls both send and return for typical use)
//    */
//   setKarplusAmount(amount: number): this {
//     if (!this.#karplusFxEnabled || !this.#karplusEffect) return this;
//     this.setKarplusSend(amount);
//     return this;
//   }

//   set altVolume(value: number) {
//     this.#altOut?.gain.setValueAtTime(value, this.now);
//   }

//   set outVolume(value: number) {
//     const safeValue = Math.max(0, Math.min(1, value));
//     this.#output.gain.setValueAtTime(safeValue, this.now);
//   }

//   // set wetOutVolume(value: number) {
//   //   const safeValue = Math.max(0, Math.min(1, value));
//   //   this.#wetOutput.gain.setValueAtTime(safeValue, this.now);
//   // }
// }
