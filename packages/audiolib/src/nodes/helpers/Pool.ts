import { LibNode, LibSourceNode } from '@/nodes';
import { createNodeId, deleteNodeId, NodeID } from '@/store/state/IdStore';
import { Message, MessageHandler, createMessageBus } from '@/events';

export class Pool<T extends LibSourceNode> implements LibNode {
  readonly nodeId: NodeID;
  readonly nodeType: string;

  #nodes: T[] = [];
  #available = new Set<T>();
  #active = new Set<T>();
  #messages;

  constructor(nodeType: string) {
    this.nodeType = `pool:${nodeType}`;
    this.nodeId = createNodeId(this.nodeType);
    this.#messages = createMessageBus<Message>(this.nodeId);
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  addNode(node: T): this {
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

  allocateNode(): T | null {
    if (this.#available.size === 0) {
      console.warn(`no available voices in pool, size 0`);
      return null;
    }

    const node = this.#available.values().next().value;
    if (!node) {
      console.debug(`unable to get available.values().next().value `);
      return null;
    }
    this.#available.delete(node);
    this.#active.add(node);

    return node;
  }

  connect(destination: AudioNode): this {
    this.#nodes.forEach((node) => node.connect(destination));
    return this;
  }

  disconnect(): this {
    this.#nodes.forEach((node) => node.disconnect());
    return this;
  }

  applyToAllActiveNodes(callback: (node: T) => void): this {
    this.#active.forEach(callback);
    return this;
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
