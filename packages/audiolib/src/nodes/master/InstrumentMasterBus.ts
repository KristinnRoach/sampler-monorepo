import { LibNode } from '@/nodes/LibNode';
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
import {
  DistortionWorklet,
  FbDelayWorklet,
  DattorroReverbWorklet,
} from '@/worklets/types';

export type BusEffectName =
  | 'distortion'
  | 'feedbackDelay'
  | 'karplus'
  | 'reverb'
  | 'compressor'
  | 'limiter';

interface BusNode {
  node: AudioNode;
  type: 'effect' | 'gain' | 'filter';
  controllable?: boolean; // Can be bypassed/controlled
}

type EffectType =
  | AudioNode
  | DistortionWorklet
  | FbDelayWorklet
  | DattorroReverb
  | KarplusEffect;

export class InstrumentMasterBus implements LibNode {
  readonly nodeId: NodeID;
  readonly nodeType = 'InstrumentBus';
  #messages: MessageBus<Message>;

  #context: AudioContext;
  #destination: AudioNode | null = null;

  // Node registry - all audio nodes live here
  #nodes = new Map<string, BusNode>();

  // Connection map - tracks routing
  #connections = new Map<string, string[]>();

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
    // Create core nodes
    this.addNode('input', new GainNode(this.#context, { gain: 0.75 }), 'gain');
    this.addNode(
      'lpf',
      new BiquadFilterNode(this.#context, { Q: 0.707 }),
      'filter'
    );
    this.addNode(
      'hpf',
      new BiquadFilterNode(this.#context, { type: 'highpass', Q: 0.5 }),
      'filter'
    );
    this.addNode('dryMix', new GainNode(this.#context, { gain: 1.0 }), 'gain');
    this.addNode('wetMix', new GainNode(this.#context, { gain: 1.0 }), 'gain');
    this.addNode('output', new GainNode(this.#context, { gain: 1.0 }), 'gain');

    // Add effects with automatic send/bypass setup
    this.addEffect(
      'compressor',
      new DynamicsCompressorNode(this.#context, DEFAULT_COMPRESSOR_SETTINGS)
    );

    this.addEffect(
      'limiter',
      new DynamicsCompressorNode(this.#context, DEFAULT_LIMITER_SETTINGS)
    );

    const reverb = new DattorroReverb(this.#context);
    this.addEffect('reverb', reverb);

    const karplus = new KarplusEffect(this.#context);
    this.addEffect('karplus', karplus);

    const distortion = createDistortion(this.#context);

    this.addEffect('distortion', distortion);

    // Set up default routing - recreate current behavior
    this.connectFromTo('input', 'hpf');
    this.connectFromTo('hpf', 'lpf');
    this.connectFromTo('lpf', 'compressor');

    // Set up reverb as send effect
    this.connectFromTo('compressor', 'dryMix');
    this.connectSend('compressor', 'reverb', 'wetMix');

    // Main output chain
    this.connectFromTo('dryMix', 'limiter');
    this.connectFromTo('wetMix', 'limiter');

    this.connectFromTo('limiter', 'karplus');
    this.connectFromTo('karplus', 'distortion');
    this.connectFromTo('distortion', 'output');

    // Enable effects by default
    this.setEffectEnabled('karplus', true);
    this.setEffectEnabled('compressor', true);
    this.setEffectEnabled('limiter', true);
    this.setEffectEnabled('reverb', true);

    this.debugRouting();
    this.debugChannelCounts();
  }

  /**
   * Add any audio node to the bus
   */
  addNode(
    name: string,
    node: AudioNode,
    type: 'effect' | 'gain' | 'filter' = 'effect'
  ): this {
    this.#nodes.set(name, { node, type });
    this.#connections.set(name, []);
    return this;
  }

  /**
   * Add an effect with automatic send/bypass controls
   */
  addEffect(name: string, effect: EffectType): this {
    // Add the effect node
    this.addNode(name, effect as AudioNode, 'effect'); //  TODO: replace as AudioNode with proper typing!

    // Create send control (for parallel routing)
    const send = new GainNode(this.#context, { gain: 0.0 });
    this.addNode(`${name}_send`, send, 'gain');

    // Create bypass control (for series routing)
    const bypass = new GainNode(this.#context, { gain: 1.0 }); // 1.0 = bypassed
    this.addNode(`${name}_bypass`, bypass, 'gain');

    this.#controls.set(name, {
      send,
      bypass,
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

    // Handle different effect interface patterns
    const fromOutput = (fromNode as any).out || fromNode;
    const toInput = (toNode as any).in || toNode;

    fromOutput.connect(toInput);

    // Track connection
    const connections = this.#connections.get(from) || [];
    if (!connections.includes(to)) {
      connections.push(to);
      this.#connections.set(from, connections);
    }

    return this;
  }

  /**
   * Set up a send effect (parallel routing)
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
    const sendNode = this.#nodes.get(`${effect}_send`)?.node as GainNode;

    if (!fromNode || !effectNode || !toNode || !sendNode) {
      console.warn(`Cannot setup send routing: missing nodes`);
      return this;
    }

    // Route: from -> send -> effect -> to
    const fromOutput = (fromNode as any).out || fromNode;
    const effectInput = (effectNode as any).in || effectNode;
    const effectOutput = (effectNode as any).out || effectNode;
    const toInput = (toNode as any).in || toNode;

    fromOutput.connect(sendNode);
    sendNode.connect(effectInput);
    effectOutput.connect(toInput);

    sendNode.gain.setValueAtTime(sendAmount, this.now);

    // Track the send connections
    const fromConnections = this.#connections.get(from) || [];
    if (!fromConnections.includes(`${effect}_send`)) {
      fromConnections.push(`${effect}_send`);
      this.#connections.set(from, fromConnections);
    }

    const sendConnections = this.#connections.get(`${effect}_send`) || [];
    if (!sendConnections.includes(effect)) {
      sendConnections.push(effect);
      this.#connections.set(`${effect}_send`, sendConnections);
    }

    const effectConnections = this.#connections.get(effect) || [];
    if (!effectConnections.includes(to)) {
      effectConnections.push(to);
      this.#connections.set(effect, effectConnections);
    }

    return this;
  }

  /**
   * Disconnect a connection
   */
  disconnectFromTo(from: string, to?: string): this {
    const fromNode = this.#nodes.get(from)?.node;
    if (!fromNode) return this;

    if (to) {
      const toNode = this.#nodes.get(to)?.node;
      if (toNode) {
        const fromOutput = (fromNode as any).out || fromNode;
        const toInput = (toNode as any).in || toNode;
        fromOutput.disconnect(toInput);

        // Update tracking
        const connections = this.#connections.get(from) || [];
        const index = connections.indexOf(to);
        if (index > -1) {
          connections.splice(index, 1);
          this.#connections.set(from, connections);
        }
      }
    } else {
      // Disconnect all
      const fromOutput = (fromNode as any).out || fromNode;
      fromOutput.disconnect();
      this.#connections.set(from, []);
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
      for (const [fromName, connections] of this.#connections) {
        const index = connections.indexOf(name);
        if (index > -1) {
          connections.splice(index, 1);
          this.#connections.set(fromName, connections);
        }
      }

      // Clean up
      this.#nodes.delete(name);
      this.#connections.delete(name);
      this.#controls.delete(name);
    }
    return this;
  }

  /**
   * Get a node by name
   */
  getNode<T extends EffectType = AudioNode>(name: string): T | null {
    return (this.#nodes.get(name)?.node as T) || null;
  }

  /**
   * Get an effect node (convenience method)
   */
  getEffect<T extends EffectType = AudioNode>(effect: BusEffectName): T | null {
    return this.getNode<T>(effect);
  }

  /**
   * Set send amount for an effect
   */
  send(effect: BusEffectName, amount: number): this {
    const control = this.#controls.get(effect);
    if (control?.send) {
      const safeValue = Math.max(0, Math.min(1, amount));
      control.send.gain.setValueAtTime(safeValue, this.now);
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
  noteOn(midiNote: number, velocity: number = 100, secondsFromNow = 0): this {
    const karplus = this.getEffect<AudioNode>('karplus');
    if (karplus && (karplus as any).trigger) {
      (karplus as any).trigger(midiNote, velocity, secondsFromNow);
    }
    return this;
  }

  // === CONVENIENCE METHODS FOR COMPATIBILITY ===

  setDryWetMix(mix: { dry: number; wet: number }): this {
    const dryMix = this.getNode<GainNode>('dryMix');
    const wetMix = this.getNode<GainNode>('wetMix');

    if (dryMix && mix.dry !== undefined) {
      const safeDry = Math.max(0, Math.min(1, mix.dry));
      dryMix.gain.setValueAtTime(safeDry, this.now);
    }

    if (wetMix && mix.wet !== undefined) {
      const safeWet = Math.max(0, Math.min(1, mix.wet));
      wetMix.gain.setValueAtTime(safeWet, this.now);
    }

    return this;
  }

  setReverbAmount(amount: number): this {
    this.send('reverb', amount);
    const reverb = this.getEffect<AudioNode>('reverb');
    if (reverb && (reverb as any).setAmountMacro) {
      (reverb as any).setAmountMacro(amount);
    }

    return this;
  }

  setReverbDecay(decay: number) {
    const effect = this.getEffect<AudioNode>('reverb');

    if (effect && (effect as any).setParam) {
      (effect as any).setParam('decay', decay);
    }

    return this;
  }

  setDrive(amount: number) {
    const effect = this.getEffect<DistortionWorklet>('distortion');
    if (effect) {
      effect.setParam('distortionDrive', amount);
    }

    return this;
  }

  setClippingMacro(amount: number) {
    const effect = this.getEffect<DistortionWorklet>('distortion');
    if (effect) {
      const safeAmount = clamp(amount, 0, 1);
      effect.setParam('clippingAmount', safeAmount);

      const clipThreshold = mapToRange(safeAmount, 0, 1, 0.5, 0.1);
      effect.setParam('clippingThreshold', clipThreshold);
    }
    return this;
  }

  setClippingMode(mode: 'soft-clipping' | 'hard-clipping') {
    const effect = this.getEffect<DistortionWorklet>('distortion');
    if (effect) {
      effect.send({ type: 'setLimitingMode', mode: mode });
    }
  }

  setPitchMultiplier(value: number) {
    const effect = this.getEffect<AudioNode>('karplus');
    if (effect && (effect as any).setPitchMultiplier) {
      (effect as any).setPitchMultiplier(value);
    }
    return this;
  }

  setKarplusAmount(amount: number): this {
    const effect = this.getEffect<AudioNode>('karplus');
    if (effect && (effect as any).setAmountMacro) {
      (effect as any).setAmountMacro(amount);
    }
    return this;
  }

  setHpfCutoff(hz: number): this {
    const hpf = this.getNode<BiquadFilterNode>('hpf');
    if (hpf) {
      hpf.frequency.setValueAtTime(hz, this.now);
    }
    return this;
  }

  setLpfCutoff(hz: number): this {
    const lpf = this.getNode<BiquadFilterNode>('lpf');
    if (lpf) {
      lpf.frequency.setValueAtTime(hz, this.now);
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

  // === DEBUG AND INSPECTION ===

  /**
   * Get current routing map
   */
  getRoutingMap(): Record<string, string[]> {
    const routing: Record<string, string[]> = {};
    for (const [from, connections] of this.#connections) {
      routing[from] = [...connections];
    }
    return routing;
  }

  /**
   * Debug: Print current routing
   */
  debugRouting(): void {
    console.log('=== Bus Routing Map ===');
    for (const [from, connections] of this.#connections) {
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

  // === CORE AUDIO GRAPH METHODS ===

  connect(destination: AudioNode): AudioNode {
    this.#destination = destination;
    const output = this.getNode('output');
    if (output) {
      output.connect(destination);
    }
    return destination;
  }

  disconnect(): this {
    const output = this.getNode('output');
    if (output) {
      output.disconnect();
    }
    return this;
  }

  dispose(): void {
    // Disconnect all nodes
    for (const [name] of this.#nodes) {
      this.disconnectFromTo(name);
    }

    // Clear all maps
    this.#nodes.clear();
    this.#connections.clear();
    this.#controls.clear();
  }

  // === ACCESSORS ===

  get input(): GainNode {
    return this.getNode<GainNode>('input')!;
  }

  get output(): GainNode {
    return this.getNode<GainNode>('output')!;
  }

  get now(): number {
    return this.#context.currentTime;
  }

  set outputLevel(level: number) {
    const output = this.getNode<GainNode>('output');
    if (output) {
      const safeValue = Math.max(0, Math.min(1, level));
      output.gain.setValueAtTime(safeValue, this.now);
    }
  }

  get outputLevel(): number {
    const output = this.getNode<GainNode>('output');
    return output?.gain.value || 0;
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
    const dryMix = this.getNode<GainNode>('dryMix');
    const wetMix = this.getNode<GainNode>('wetMix');
    return {
      dry: dryMix?.gain.value || 0,
      wet: wetMix?.gain.value || 0,
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
        input,
        output,
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
      const monitor = new LevelMonitor(this.#context, input, output);
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
