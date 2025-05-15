import {
  LibNode,
  LibVoiceNode,
  ContainerType,
  LibContainerNode,
} from '@/LibNode';
import { getAudioContext } from '@/context';
import { createNodeId, deleteNodeId, NodeID } from '@/nodes/node-store';
import { Message, MessageHandler, createMessageBus } from '@/events';
import { RoundRobin } from '@/nodes/helpers/allocation/strategies/RoundRobin';

export class Pool<T extends LibVoiceNode> implements LibContainerNode {
  readonly nodeId: NodeID;
  readonly nodeType: ContainerType = 'pool';

  #nodes: T[] = [];
  #available = new Set<T>();
  #active = new Set<T>();
  #messages;
  #allocationStrategy: RoundRobin;

  constructor() {
    this.nodeId = createNodeId(this.nodeType);
    this.#messages = createMessageBus<Message>(this.nodeId);
    this.#allocationStrategy = new RoundRobin();
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  add(node: T): this {
    this.#nodes.push(node);
    this.#available.add(node);

    // todo - clarify and concentrate in one place
    node.onMessage('voice:ended', () => {
      if (this.#active.has(node)) this.#active.delete(node);
      if (!this.#available.has(node)) this.#available.add(node);
    });

    node.onMessage('voice:started', () => {
      if (this.#available.has(node)) this.#available.delete(node);
      if (!this.#active.has(node)) this.#active.add(node);
    });

    return this;
  }

  remove(child: LibNode): this {
    // TODO
    return this;
  }

  allocateNode(): T | null {
    if (this.#available.size === 0) {
      console.warn(`no available voices in pool, size 0`);
      return null;
    }

    const node = this.#allocationStrategy.allocate(this.#available);
    if (!node) {
      console.debug(
        `unable to allocate node using strategy: ${this.#allocationStrategy}`
      );
      return null;
    }

    this.#available.delete(node as T);
    this.#active.add(node as T);

    return node as T; // as T only for dev debugging
  }

  returnNode(node: T): this {
    if (this.#active.has(node)) {
      this.#active.delete(node);
    }
    if (!this.#available.has(node)) {
      this.#available.add(node);
    }
    return this;
  }

  connect(destination: AudioNode): this {
    this.#nodes.forEach((node) => node.connect(destination));
    return this;
  }

  disconnect(): this {
    this.#nodes.forEach((node) => node.disconnect());
    return this;
  }

  applyToActive(callback: (node: T) => void): this {
    if (this.#active.size === 0) return this;
    this.#active.forEach(callback);
    return this;
  }

  applyToAll(callback: (node: T) => void): this {
    if (this.#nodes.length === 0) return this;
    this.#nodes.forEach(callback);
    return this;
  }

  async asyncApplyToAll(callback: (node: T) => Promise<void>): Promise<void> {
    if (this.#nodes.length === 0) return;
    await Promise.all(this.#nodes.map(callback));
  }

  dispose(): void {
    this.#nodes.forEach((node) => {
      node.dispose();
    });

    this.#nodes = [];
    this.#available.clear();
    this.#active.clear();
    deleteNodeId(this.nodeId);
  }

  // Simple getters

  get now() {
    return getAudioContext().currentTime;
  }

  get nodes(): T[] {
    return [...this.#nodes];
  }

  get activeCount(): number {
    return this.#active.size;
  }

  get availableCount(): number {
    return this.#available.size;
  }
}
