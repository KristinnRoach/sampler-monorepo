// InstrumentMasterBus.ts

import { ILibAudioNode, LibAudioNode } from '@/nodes/wrapper';
import { createNodeId, NodeID } from '@/nodes/node-store';
import { getAudioContext } from '@/context';
import {
  Message,
  MessageBus,
  MessageHandler,
  createMessageBus,
} from '@/events';
import { clamp, mapToRange } from '@/utils';

import {
  DEFAULT_COMPRESSOR_SETTINGS,
  DEFAULT_LIMITER_SETTINGS,
} from './defaults';
import { LevelMonitor } from '@/utils/audiodata/monitoring/LevelMonitor';
import { DattorroReverb } from '@/nodes/effects/DattorroReverb';
import { KarplusEffect } from '../effects/KarplusEffect';

import { createDistortion } from '@/worklets/worklet-factory';
import { DistortionWorklet, FbDelayWorklet } from '@/worklets/worklet-types';
import { WorkletNode } from '@/worklets/WorkletNode';

export type BusEffectName =
  | 'distortion'
  | 'feedbackDelay'
  | 'karplus'
  | 'reverb'
  | 'compressor'
  | 'limiter';

interface BusNode {
  node: ILibAudioNode; // Always ILibAudioNode now
  type: 'effect' | 'gain' | 'filter';
  controllable?: boolean;
}

type EffectType =
  | AudioNode
  | ILibAudioNode
  | DistortionWorklet
  | FbDelayWorklet
  | DattorroReverb
  | KarplusEffect;

export class InstrumentMasterBus implements ILibAudioNode {
  readonly nodeId: NodeID;
  readonly nodeType = 'InstrumentBus';
  #messages: MessageBus<Message>;

  #context: AudioContext;
  #destination: AudioNode | null = null;

  #nodes = new Map<string, BusNode>();

  #internalRouting = new Map<string, string[]>();

  #externalConnections = new Set<
    ILibAudioNode | AudioNode | AudioWorkletNode
  >();
  #incoming = new Set<ILibAudioNode>();

  // Effect controls - for send amounts, bypassing, etc.
  #controls = new Map<
    string,
    {
      send?: GainNode;
      bypass?: GainNode;
      enabled: boolean;
    }
  >();

  #initialized = false;

  constructor(context?: AudioContext) {
    this.nodeId = createNodeId(this.nodeType);
    this.#context = context || getAudioContext();
    this.#messages = createMessageBus(this.nodeId);

    this.#setupDefaultRouting();
    this.#initialized = true;
  }

  #setupDefaultRouting(): void {
    // Adapt native nodes using LibAudioNode
    const inputAdapter = new LibAudioNode(
      new GainNode(this.#context, { gain: 0.75 }),
      this.#context,
      'gain'
    );

    const lpfAdapter = new LibAudioNode(
      new BiquadFilterNode(this.#context, { Q: 0.707 }),
      this.#context,
      'filter'
    );

    const hpfAdapter = new LibAudioNode(
      new BiquadFilterNode(this.#context, { type: 'highpass', Q: 0.5 }),
      this.#context,
      'filter'
    );

    const dryMixAdapter = new LibAudioNode(
      new GainNode(this.#context, { gain: 1.0 }),
      this.#context,
      'gain'
    );

    const wetMixAdapter = new LibAudioNode(
      new GainNode(this.#context, { gain: 1.0 }),
      this.#context,
      'gain'
    );

    const outputAdapter = new LibAudioNode(
      new GainNode(this.#context, { gain: 1.0 }),
      this.#context,
      'gain'
    );

    // Adapt worklet nodes
    const compressorAdapter = new LibAudioNode(
      new DynamicsCompressorNode(this.#context, DEFAULT_COMPRESSOR_SETTINGS),
      this.#context,
      'compressor'
    );

    const limiterAdapter = new LibAudioNode(
      new DynamicsCompressorNode(this.#context, DEFAULT_LIMITER_SETTINGS),
      this.#context,
      'limiter'
    );

    const distortionAdapter = new LibAudioNode(
      createDistortion(this.#context),
      this.#context,
      'distortion'
    );

    // Custom nodes (already implement ILibAudioNode)
    const reverb = new DattorroReverb(this.#context);
    const karplus = new KarplusEffect(this.#context);

    // Store all nodes with unified interface
    this.addNode('input', inputAdapter, 'gain');
    this.addNode('lpf', lpfAdapter, 'filter');
    this.addNode('hpf', hpfAdapter, 'filter');
    this.addNode('dryMix', dryMixAdapter, 'gain');
    this.addNode('wetMix', wetMixAdapter, 'gain');
    this.addNode('output', outputAdapter, 'gain');

    this.addEffect('compressor', compressorAdapter);
    this.addEffect('limiter', limiterAdapter);
    this.addEffect('distortion', distortionAdapter);
    this.addEffect('reverb', reverb);
    this.addEffect('karplus', karplus);

    // Now all connections use the same interface!
    this.connectFromTo('input', 'hpf');
    this.connectFromTo('hpf', 'lpf');
    this.connectFromTo('lpf', 'compressor');
    this.connectFromTo('compressor', 'karplus');

    // Set up reverb as send effect
    this.connectFromTo('karplus', 'dryMix');
    this.connectSend('karplus', 'reverb', 'wetMix');

    // Main output chain
    this.connectFromTo('dryMix', 'distortion');
    this.connectFromTo('wetMix', 'distortion');
    this.connectFromTo('distortion', 'limiter');
    this.connectFromTo('limiter', 'output');

    // Enable effects by default
    this.setEffectEnabled('karplus', true);
    this.setEffectEnabled('compressor', true);
    this.setEffectEnabled('limiter', true);
    this.setEffectEnabled('reverb', true);
  }

  addNode(
    name: string,
    node: ILibAudioNode,
    type: 'effect' | 'gain' | 'filter' = 'effect'
  ): this {
    this.#nodes.set(name, { node, type });
    this.#internalRouting.set(name, []);
    return this;
  }

  addEffect(name: string, effect: ILibAudioNode): this {
    this.addNode(name, effect, 'effect');

    // Create send control (for parallel routing) - also adapted
    const send = new LibAudioNode(
      new GainNode(this.#context, { gain: 0.0 }),
      this.#context,
      'gain'
    );
    this.addNode(`${name}_send`, send, 'gain');

    // Create bypass control (for series routing) - also adapted
    const bypass = new LibAudioNode(
      new GainNode(this.#context, { gain: 1.0 }),
      this.#context,
      'gain'
    );
    this.addNode(`${name}_bypass`, bypass, 'gain');

    this.#controls.set(name, {
      send: send.audioNode as GainNode, // Store the underlying GainNode for direct access
      bypass: bypass.audioNode as GainNode,
      enabled: false,
    });

    return this;
  }

  /**
   * Connect two nodes directly
   */
  connectFromTo(from: string, to: string): this {
    const fromNode = this.#nodes.get(from)?.node;
    const toNode = this.#nodes.get(to)?.node;

    if (!fromNode || !toNode) {
      console.warn(`Cannot connect ${from} -> ${to}: node not found`);
      return this;
    }

    fromNode.connect(toNode);

    // Track connection
    const connections = this.#internalRouting.get(from) || [];
    if (!connections.includes(to)) {
      connections.push(to);
      this.#internalRouting.set(from, connections);
    }

    return this;
  }

  /**
   * Set up a send effect (parallel routing) - now using unified interface
   */
  connectSend(
    from: string,
    effect: string,
    to: string,
    sendAmount: number = 0.0
  ): this {
    const fromNode = this.#nodes.get(from)?.node;
    const effectNode = this.#nodes.get(effect)?.node;
    const toNode = this.#nodes.get(to)?.node;
    const sendNode = this.#nodes.get(`${effect}_send`)?.node;

    if (!fromNode || !effectNode || !toNode || !sendNode) {
      console.warn(`Cannot setup send routing: missing nodes`);
      return this;
    }

    // Route: from -> send -> effect -> to
    fromNode.connect(sendNode);
    sendNode.connect(effectNode);
    effectNode.connect(toNode);

    sendNode.setParam('gain', sendAmount);

    // Track the send connections
    const fromConnections = this.#internalRouting.get(from) || [];
    if (!fromConnections.includes(`${effect}_send`)) {
      fromConnections.push(`${effect}_send`);
      this.#internalRouting.set(from, fromConnections);
    }

    const sendConnections = this.#internalRouting.get(`${effect}_send`) || [];
    if (!sendConnections.includes(effect)) {
      sendConnections.push(effect);
      this.#internalRouting.set(`${effect}_send`, sendConnections);
    }

    const effectConnections = this.#internalRouting.get(effect) || [];
    if (!effectConnections.includes(to)) {
      effectConnections.push(to);
      this.#internalRouting.set(effect, effectConnections);
    }

    return this;
  }

  /**
   * Simplified disconnect - also using unified interface
   */
  disconnectFromTo(from: string, to?: string): this {
    const fromNode = this.#nodes.get(from)?.node;
    if (!fromNode) return this;

    if (to) {
      const toNode = this.#nodes.get(to)?.node;
      if (toNode) {
        // Simple unified disconnect!
        fromNode.disconnect(toNode);

        // Update tracking
        const connections = this.#internalRouting.get(from) || [];
        const index = connections.indexOf(to);
        if (index > -1) {
          connections.splice(index, 1);
          this.#internalRouting.set(from, connections);
        }
      }
    } else {
      // Disconnect all
      fromNode.disconnect();
      this.#internalRouting.set(from, []);
    }

    return this;
  }

  /**
   * Remove a node completely
   */
  removeNode(name: string): this {
    const node = this.#nodes.get(name);
    if (node) {
      // Disconnect everything
      this.disconnectFromTo(name);

      // Remove from other connections
      for (const [fromName, connections] of this.#internalRouting) {
        const index = connections.indexOf(name);
        if (index > -1) {
          connections.splice(index, 1);
          this.#internalRouting.set(fromName, connections);
        }
      }

      // Clean up
      this.#nodes.delete(name);
      this.#internalRouting.delete(name);
      this.#controls.delete(name);
    }
    return this;
  }

  getNode(name: string): ILibAudioNode | null {
    return this.#nodes.get(name)?.node || null;
  }

  getEffect(effect: BusEffectName): ILibAudioNode | null {
    return this.getNode(effect);
  }

  // /**
  //  * Set send amount for an effect
  //  */
  // send(effect: BusEffectName, amount: number): this {
  //   const control = this.#controls.get(effect);
  //   if (control?.send) {
  //     const safeValue = Math.max(0, Math.min(1, amount));
  //     control.send.gain.setValueAtTime(safeValue, this.now);
  //   }
  //   return this;
  // }

  /**
   * Set send amount for an effect - now using unified interface
   */
  send(effect: BusEffectName, amount: number): this {
    const sendNode = this.#nodes.get(`${effect}_send`)?.node;
    if (sendNode) {
      const safeValue = Math.max(0, Math.min(1, amount));
      sendNode.setParam('gain', safeValue);
    }
    return this;
  }

  /**
   * Enable/disable an effect
   */
  setEffectEnabled(effect: BusEffectName, enabled: boolean): this {
    const control = this.#controls.get(effect);
    if (control) {
      control.enabled = enabled;

      // For send effects, control the send amount
      if (control.send) {
        const currentAmount = control.send.gain.value;
        control.send.gain.setValueAtTime(enabled ? currentAmount : 0, this.now);
      }

      // For insert effects, use bypass (TODO: implement bypass routing)
      if (control.bypass) {
        control.bypass.gain.setValueAtTime(enabled ? 0 : 1, this.now);
      }
    }
    return this;
  }

  /**
   * Trigger effects that can be triggered
   */
  noteOn(
    midiNote: number,
    velocity: number = 100,
    secondsFromNow = 0,
    glideTime = 0
  ): this {
    const karplus = this.getEffect('karplus');
    if (karplus && (karplus as KarplusEffect).trigger) {
      (karplus as KarplusEffect).trigger(midiNote, {
        velocity,
        secondsFromNow,
        glideTime,
      });
    }
    return this;
  }

  // === CONVENIENCE METHODS FOR COMPATIBILITY ===

  setDryWetMix(mix: { dry: number; wet: number }): this {
    const dryMix = this.getNode('dryMix');
    const wetMix = this.getNode('wetMix');

    if (dryMix && mix.dry !== undefined) {
      const safeDry = Math.max(0, Math.min(1, mix.dry));
      dryMix.setParam('gain', safeDry);
    }

    if (wetMix && mix.wet !== undefined) {
      const safeWet = Math.max(0, Math.min(1, mix.wet));
      wetMix.setParam('gain', safeWet);
    }

    return this;
  }

  setReverbAmount(amount: number): this {
    this.send('reverb', amount);
    const reverb = this.getEffect('reverb');
    if (reverb && (reverb as any).setAmountMacro) {
      (reverb as any).setAmountMacro(amount);
    }
    return this;
  }

  setReverbDecay(decay: number) {
    const effect = this.getEffect('reverb');
    if (effect) {
      effect.setParam('decay', decay); // Use unified interface
    }
    return this;
  }

  setDrive(amount: number) {
    const effect = this.getEffect('distortion');
    if (effect) {
      effect.setParam('distortionDrive', amount); // Use unified interface
    }
    return this;
  }

  setClippingMacro(amount: number) {
    const effect = this.getNode('distortion');
    if (effect) {
      const safeAmount = clamp(amount, 0, 1);
      effect.setParam('clippingAmount', safeAmount);

      const clipThreshold = mapToRange(safeAmount, 0, 1, 0.5, 0.1);
      effect.setParam('clippingThreshold', clipThreshold);
    }
    return this;
  }

  setClippingMode(mode: 'soft-clipping' | 'hard-clipping') {
    const effect = this.getEffect('distortion');
    if (effect instanceof WorkletNode) {
      effect.sendProcessorMessage({ type: 'setLimitingMode', mode: mode });
    }
  }

  setFeedbackPitchScale(value: number) {
    const effect = this.getEffect('karplus');
    if (effect && (effect as KarplusEffect).setDelayMultiplier) {
      (effect as KarplusEffect).setDelayMultiplier(value);
    }
    return this;
  }

  setKarplusAmount(amount: number): this {
    const effect = this.getEffect('karplus');
    if (effect && (effect as any).setAmountMacro) {
      (effect as any).setAmountMacro(amount);
    }
    return this;
  }

  setHpfCutoff(hz: number): this {
    const hpf = this.getNode('hpf');
    if (hpf) {
      hpf.setParam('frequency', hz);
    }
    return this;
  }

  setLpfCutoff(hz: number): this {
    const lpf = this.getNode('lpf');
    if (lpf) {
      lpf.setParam('frequency', hz);
    }
    return this;
  }

  setCompressorParams(params: {
    threshold?: number;
    knee?: number;
    ratio?: number;
    attack?: number;
    release?: number;
  }): this {
    const compressor = this.getEffect('compressor');
    if (!compressor) return this;

    // Use unified interface
    if (params.threshold !== undefined) {
      compressor.setParam('threshold', params.threshold);
    }
    if (params.knee !== undefined) {
      compressor.setParam('knee', params.knee);
    }
    if (params.ratio !== undefined) {
      compressor.setParam('ratio', params.ratio);
    }
    if (params.attack !== undefined) {
      compressor.setParam('attack', params.attack);
    }
    if (params.release !== undefined) {
      compressor.setParam('release', params.release);
    }

    return this;
  }

  // === DEBUG AND INSPECTION ===

  /**
   * Get current routing map
   */
  getRoutingMap(): Record<string, string[]> {
    const routing: Record<string, string[]> = {};
    for (const [from, connections] of this.#internalRouting) {
      routing[from] = [...connections];
    }
    return routing;
  }

  /**
   * Debug: Print current routing
   */
  debugRouting(): void {
    console.log('=== Bus Routing Map ===');
    for (const [from, connections] of this.#internalRouting) {
      if (connections.length > 0) {
        console.log(`${from} -> ${connections.join(', ')}`);
      }
    }
    console.log('======================');
  }

  /**
   * Debug: Check channel counts at each stage
   */
  debugChannelCounts(): void {
    const nodes = ['reverb', 'wetMix', 'limiter', 'karplus'];

    nodes.forEach((nodeName) => {
      const node = this.getNode(nodeName);
      if (node) {
        console.log(`${nodeName}:`, {
          numberOfInputs: (node as any).numberOfInputs || 'unknown',
          numberOfOutputs: (node as any).numberOfOutputs || 'unknown',
          channelCount: (node as any).channelCount || 'unknown',
          channelCountMode: (node as any).channelCountMode || 'unknown',
        });
        if ((node as any).workletInfo !== undefined) {
          console.log(
            `processor info for ${nodeName}:`,
            (node as any).workletInfo
          );
        }
      }
    });
  }

  /**
   * List all available nodes
   */
  listNodes(): string[] {
    return Array.from(this.#nodes.keys());
  }

  // === CORE LibAudioNode INTERFACE METHODS ===

  connect(destination: ILibAudioNode | AudioNode): void {
    const output = this.getNode('output');
    if (!output) return;

    output.connect(destination);

    // Track external connections
    this.#externalConnections.add(destination);

    if ('nodeId' in destination) {
      (destination as any).addIncoming?.(this);
    }
  }

  disconnect(destination?: ILibAudioNode | AudioNode): void {
    const output = this.getNode('output');
    if (!output) return;

    output.disconnect(destination);

    if (destination) {
      this.#externalConnections.delete(destination);

      if ('nodeId' in destination) {
        (destination as any).removeIncoming?.(this);
      }
    } else {
      this.#externalConnections.clear();
    }
  }

  addIncoming(source: ILibAudioNode): void {
    this.#incoming.add(source);
  }

  removeIncoming(source: ILibAudioNode): void {
    this.#incoming.delete(source);
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'outputLevel':
        this.outputLevel = value;
        break;
      case 'reverbAmount':
        this.setReverbAmount(value);
        break;
      case 'karplusAmount':
        this.setKarplusAmount(value);
        break;
      case 'drive':
        this.setDrive(value);
        break;
      case 'hpfCutoff':
        this.setHpfCutoff(value);
        break;
      case 'lpfCutoff':
        this.setLpfCutoff(value);
        break;
      default:
        console.warn(
          `Parameter '${name}' not recognized on InstrumentMasterBus`
        );
        break;
    }
  }

  getParam(name: string): AudioParam | null {
    switch (name) {
      case 'outputLevel':
        return this.getNode('output')?.getParam('gain') || null;
      case 'hpfCutoff':
        return this.getNode('hpf')?.getParam('frequency') || null;
      case 'lpfCutoff':
        return this.getNode('lpf')?.getParam('frequency') || null;
      default:
        return null;
    }
  }

  dispose(): void {
    // Disconnect all nodes
    for (const [name] of this.#nodes) {
      this.disconnectFromTo(name);
    }

    // Clear all maps
    this.#nodes.clear();
    this.#internalRouting.clear();
    this.#controls.clear();
  }

  // === ACCESSORS ===

  get audioNode(): AudioNode | AudioWorkletNode | ILibAudioNode {
    return this.getNode('output')!; // To comply with interface (not applicable?)
  }

  get context(): AudioContext {
    return this.#context;
  }

  get connections() {
    return {
      outgoing: Array.from(this.#externalConnections),
      incoming: Array.from(this.#incoming),
    };
  }

  get input(): GainNode {
    return this.getNode('input')!.input as GainNode;
  }

  get output(): GainNode {
    return this.getNode('output')!.output as GainNode;
  }

  get now(): number {
    return this.#context.currentTime;
  }

  set outputLevel(level: number) {
    const output = this.getNode('output');
    if (output) {
      const safeValue = Math.max(0, Math.min(1, level));
      output.setParam('gain', safeValue);
    }
  }

  get outputLevel(): number {
    const output = this.getNode('output');
    const param = output?.getParam('gain');
    return param?.value || 0;
  }

  // === COMPATIBILITY GETTERS ===

  get compressorEnabled(): boolean {
    return this.#controls.get('compressor')?.enabled ?? false;
  }

  get reverbEnabled(): boolean {
    return this.#controls.get('reverb')?.enabled ?? false;
  }

  get karplusFxEnabled(): boolean {
    return this.#controls.get('karplus')?.enabled ?? false;
  }

  get initialized(): boolean {
    return this.#initialized;
  }

  get reverbSend(): number {
    return this.#controls.get('reverb')?.send?.gain.value || 0;
  }

  get dryWetMix(): { dry: number; wet: number } {
    const dryMix = this.getNode('dryMix');
    const wetMix = this.getNode('wetMix');
    return {
      dry: dryMix?.getParam('gain')?.value || 0,
      wet: wetMix?.getParam('gain')?.value || 0,
    };
  }

  // === LEVEL MONITORING ===

  #levelMonitor: LevelMonitor | null = null;

  startLevelMonitoring(
    intervalMs: number = 1000,
    fftSize: number = 1024,
    logOutput: boolean = false
  ): void {
    this.stopLevelMonitoring();

    const input = this.getNode('input');
    const output = this.getNode('output');

    if (input && output) {
      this.#levelMonitor = new LevelMonitor(
        this.#context,
        input.input,
        output.output,
        fftSize
      );
      this.#levelMonitor.start(intervalMs, undefined, logOutput);
      console.log('Level monitoring started');
    }
  }

  stopLevelMonitoring(): void {
    if (this.#levelMonitor) {
      this.#levelMonitor.stop();
      this.#levelMonitor = null;
      console.log('Level monitoring stopped');
    }
  }

  logLevels(): void {
    const input = this.getNode('input');
    const output = this.getNode('output');

    if (!this.#levelMonitor && input && output) {
      const monitor = new LevelMonitor(
        this.#context,
        input.input,
        output.output
      );
      const levels = monitor.getLevels();
      console.log(
        `Levels: Input RMS ${levels.input.rmsDB.toFixed(1)} dB | Output RMS ${levels.output.rmsDB.toFixed(1)} dB`
      );
    } else if (this.#levelMonitor) {
      const levels = this.#levelMonitor.getLevels();
      console.log(
        `Levels: Input RMS ${levels.input.rmsDB.toFixed(1)} dB | Output RMS ${levels.output.rmsDB.toFixed(1)} dB`
      );
    }
  }

  // === MESSAGE HANDLING ===

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }
}

// #setupDefaultRouting(): void {
//   // Create core nodes
//   this.addNode('input', new GainNode(this.#context, { gain: 0.75 }), 'gain');
//   this.addNode(
//     'lpf',
//     new BiquadFilterNode(this.#context, { Q: 0.707 }),
//     'filter'
//   );
//   this.addNode(
//     'hpf',
//     new BiquadFilterNode(this.#context, { type: 'highpass', Q: 0.5 }),
//     'filter'
//   );
//   this.addNode('dryMix', new GainNode(this.#context, { gain: 1.0 }), 'gain');
//   this.addNode('wetMix', new GainNode(this.#context, { gain: 1.0 }), 'gain');
//   this.addNode('output', new GainNode(this.#context, { gain: 1.0 }), 'gain');

//   // Add effects with automatic send/bypass setup
//   this.addEffect(
//     'compressor',
//     new DynamicsCompressorNode(this.#context, DEFAULT_COMPRESSOR_SETTINGS)
//   );

//   this.addEffect(
//     'limiter',
//     new DynamicsCompressorNode(this.#context, DEFAULT_LIMITER_SETTINGS)
//   );

//   const reverb = new DattorroReverb(this.#context);
//   this.addEffect('reverb', reverb);

//   const karplus = new KarplusEffect(this.#context);
//   this.addEffect('karplus', karplus);

//   const distortion = createDistortion(this.#context);
//   this.addEffect('distortion', distortion);

//   // Set up default routing - recreate current behavior
//   this.connectFromTo('input', 'hpf');
//   this.connectFromTo('hpf', 'lpf');
//   this.connectFromTo('lpf', 'compressor');
//   this.connectFromTo('compressor', 'karplus');

//   // Set up reverb as send effect
//   this.connectFromTo('karplus', 'dryMix');
//   this.connectSend('karplus', 'reverb', 'wetMix');

//   // Main output chain
//   this.connectFromTo('dryMix', 'distortion');
//   this.connectFromTo('wetMix', 'distortion');
//   this.connectFromTo('distortion', 'limiter');
//   this.connectFromTo('limiter', 'output');

//   // Enable effects by default
//   this.setEffectEnabled('karplus', true);
//   this.setEffectEnabled('compressor', true);
//   this.setEffectEnabled('limiter', true);
//   this.setEffectEnabled('reverb', true);

//   this.debugRouting();
//   this.debugChannelCounts();
// }

// /**
//  * Add any audio node to the bus
//  */
// addNode(
//   name: string,
//   node: AudioNode,
//   type: 'effect' | 'gain' | 'filter' = 'effect'
// ): this {
//   this.#nodes.set(name, { node, type });
//   this.#internalRouting.set(name, []);
//   return this;
// }

// /**
//  * Add an effect with automatic send/bypass controls
//  */
// addEffect(name: string, effect: EffectType): this {
//   // Add the effect node
//   this.addNode(name, effect as AudioNode, 'effect'); //  TODO: replace as AudioNode with proper typing!

//   // Create send control (for parallel routing)
//   const send = new GainNode(this.#context, { gain: 0.0 });
//   this.addNode(`${name}_send`, send, 'gain');

//   // Create bypass control (for series routing)
//   const bypass = new GainNode(this.#context, { gain: 1.0 }); // 1.0 = bypassed
//   this.addNode(`${name}_bypass`, bypass, 'gain');

//   this.#controls.set(name, {
//     send,
//     bypass,
//     enabled: false,
//   });

//   return this;
// }

// /**
//  * Get a node by name
//  */
// getNode<T extends EffectType = AudioNode>(name: string): T | null {
//   return (this.#nodes.get(name)?.node as T) || null;
// }

// /**
//  * Get an effect node (convenience method)
//  */
// getEffect<T extends EffectType = AudioNode>(effect: BusEffectName): T | null {
//   return this.getNode<T>(effect);
// }

// /**
//  * Set up a send effect (parallel routing)
//  */
// connectSend(
//   from: string,
//   effect: string,
//   to: string,
//   sendAmount: number = 0.0
// ): this {
//   const fromNode = this.#nodes.get(from)?.node;
//   const effectNode = this.#nodes.get(effect)?.node;
//   const toNode = this.#nodes.get(to)?.node;
//   const sendNode = this.#nodes.get(`${effect}_send`)?.node as GainNode;

//   if (!fromNode || !effectNode || !toNode || !sendNode) {
//     console.warn(`Cannot setup send routing: missing nodes`);
//     return this;
//   }

//   // Route: from -> send -> effect -> to
//   const fromOutput = (fromNode as any).out || fromNode;
//   const effectInput = (effectNode as any).in || effectNode;
//   const effectOutput = (effectNode as any).out || effectNode;
//   const toInput = (toNode as any).in || toNode;

//   fromOutput.connect(sendNode);
//   sendNode.connect(effectInput);
//   effectOutput.connect(toInput);

//   sendNode.gain.setValueAtTime(sendAmount, this.now);

//   // Track the send connections
//   const fromConnections = this.#internalRouting.get(from) || [];
//   if (!fromConnections.includes(`${effect}_send`)) {
//     fromConnections.push(`${effect}_send`);
//     this.#internalRouting.set(from, fromConnections);
//   }

//   const sendConnections = this.#internalRouting.get(`${effect}_send`) || [];
//   if (!sendConnections.includes(effect)) {
//     sendConnections.push(effect);
//     this.#internalRouting.set(`${effect}_send`, sendConnections);
//   }

//   const effectConnections = this.#internalRouting.get(effect) || [];
//   if (!effectConnections.includes(to)) {
//     effectConnections.push(to);
//     this.#internalRouting.set(effect, effectConnections);
//   }

//   return this;
// }

// /**
//  * Disconnect a connection
//  */
// disconnectFromTo(from: string, to?: string): this {
//   const fromNode = this.#nodes.get(from)?.node;
//   if (!fromNode) return this;

//   if (to) {
//     const toNode = this.#nodes.get(to)?.node;
//     if (toNode) {
//       const fromOutput = (fromNode as any).out || fromNode;
//       const toInput = (toNode as any).in || toNode;
//       fromOutput.disconnect(toInput);

//       // Update tracking
//       const connections = this.#internalRouting.get(from) || [];
//       const index = connections.indexOf(to);
//       if (index > -1) {
//         connections.splice(index, 1);
//         this.#internalRouting.set(from, connections);
//       }
//     }
//   } else {
//     // Disconnect all
//     const fromOutput = (fromNode as any).out || fromNode;
//     fromOutput.disconnect();
//     this.#internalRouting.set(from, []);
//   }

//   return this;
// }
