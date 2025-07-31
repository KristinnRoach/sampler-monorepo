import { LibNode, NodeType } from './LibNode';
import { createNodeId, NodeID, deleteNodeId } from './node-store';
import { MidiController } from '@/io';
import {
  MessageBus,
  MessageHandler,
  Message,
  createMessageBus,
} from '@/events';
import { InstrumentMasterBus } from './master/InstrumentMasterBus';

/** Adapter interface for web native and Audiolib's custom audio nodes */
export interface ILibAudioNode extends LibNode {
  // Connection interface
  connect(destination: ILibAudioNode | AudioNode): void;
  disconnect(destination?: ILibAudioNode | AudioNode): void;

  // Parameter interface
  setParam(name: string, value: number, time?: number): void;
  getParam(name: string): AudioParam | null;

  // Messaging
  onMessage?(type: string, handler: MessageHandler<Message>): () => void;

  // Convenience getters
  readonly now: number;
  readonly audioNode: AudioNode | AudioWorkletNode | ILibAudioNode;
  readonly context: AudioContext | BaseAudioContext;
  readonly connections: {
    outgoing: (AudioNode | AudioWorkletNode | ILibAudioNode)[];
    incoming?: ILibAudioNode[];
  };

  // Input/output access
  readonly input?: AudioNode;
  readonly output: AudioNode;
}

/** Extends ILibAudioNode with core Instrument features */
export interface ILibInstrumentNode extends ILibAudioNode {
  // Core instrument capabilities
  play(midiNote: MidiValue, velocity?: number): MidiValue | null;
  release(note: MidiValue): this;
  releaseAll(fadeOut_sec?: number): this;

  enableMIDI(controller: MidiController): Promise<this>;

  outBus?: InstrumentMasterBus;
}

export interface AdapterOptions {
  createIOGains?: boolean;
}

export class LibAudioNode implements ILibAudioNode {
  readonly nodeId: NodeID;
  readonly nodeType: NodeType;
  #messages: MessageBus<Message>;
  #initialized = false;

  #audioNode: AudioNode | AudioWorkletNode;

  #inputNode: AudioNode | AudioWorkletNode;
  #outputNode: AudioNode | AudioWorkletNode;

  #connections = new Set<ILibAudioNode | AudioNode | AudioWorkletNode>();
  #incoming = new Set<ILibAudioNode>();

  constructor(
    node: AudioNode | AudioWorkletNode,
    context: AudioContext,
    nodeType: NodeType,
    options: AdapterOptions = {}
  ) {
    this.nodeType = nodeType;
    this.nodeId = createNodeId(nodeType);
    this.#messages = createMessageBus<Message>(this.nodeId);

    this.#audioNode = node;

    if (options.createIOGains) {
      this.#inputNode = new GainNode(context, { gain: 1 });
      this.#outputNode = new GainNode(context, { gain: 1 });
      this.#inputNode.connect(this.#audioNode);
      this.#audioNode.connect(this.#outputNode);
    } else {
      this.#inputNode = node;
      this.#outputNode = node;
    }

    this.#initialized = true;
  }

  // === MESSAGING ===

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  sendUpstreamMessage(type: string, data: any): this {
    this.#messages.sendMessage(type, data);
    return this;
  }

  // === CONNECTIONS ===

  connect(destination: ILibAudioNode | AudioNode): void {
    const target = 'input' in destination ? destination.input : destination;
    this.#outputNode.connect(target as AudioNode); // Use outputNode, not #node

    // Track the connection
    this.#connections.add(destination);

    // If destination is also a LibAudioNode, let it track incoming
    if ('nodeId' in destination) {
      (destination as any).addIncoming?.(this);
    }
  }

  disconnect(destination?: ILibAudioNode | AudioNode): void {
    if (destination) {
      const target = 'input' in destination ? destination.input : destination;
      this.#outputNode.disconnect(target as AudioNode);
      this.#connections.delete(destination);

      if ('nodeId' in destination) {
        (destination as any).removeIncoming?.(this);
      }
    } else {
      // Disconnect all
      this.#outputNode.disconnect();
      this.#connections.clear();
    }
  }

  addIncoming(source: ILibAudioNode): void {
    this.#incoming.add(source);
  }

  removeIncoming(source: ILibAudioNode): void {
    this.#incoming.delete(source);
  }

  get connections() {
    return {
      outgoing: Array.from(this.#connections),
      incoming: Array.from(this.#incoming),
    };
  }

  // === PARAMS ===

  setParam(name: string, value: number, timestamp = this.now): void {
    // Try AudioWorkletNode parameters first
    if ('parameters' in this.#audioNode) {
      const param = (this.#audioNode as AudioWorkletNode).parameters.get(name);
      if (param) {
        param.setValueAtTime(value, timestamp);
        return;
      }
    }

    // Try direct AudioNode properties
    const param = (this.#audioNode as any)[name];
    if (param?.setValueAtTime) {
      param.setValueAtTime(value, timestamp);
      return;
    }

    console.warn(`Parameter '${name}' not found on node`);
  }

  getParam(name: string): AudioParam | null {
    return (this.#audioNode as any)[name] || null;
  }

  // === CONVENIANCE GETTERS ===

  get audioNode() {
    return this.#audioNode;
  }
  get input() {
    return this.#inputNode;
  }
  get output() {
    return this.#outputNode;
  }
  get context() {
    return this.#audioNode.context;
  }
  get now() {
    return this.#audioNode.context.currentTime;
  }
  get initialized() {
    return this.#initialized;
  }

  dispose() {
    this.disconnect();
    deleteNodeId(this.nodeId);
  }
}
