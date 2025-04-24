// Pool.ts
import { LibNode } from '@/nodes';
import { createNodeId, deleteNodeId } from '@/store/state/IdStore';

export class Pool<T extends LibNode> implements LibNode {
  readonly nodeId: NodeID = createNodeId();
  readonly nodeType: string;

  #nodes: T[];
  #availableNodes: Set<string>; // nodeIds
  #maxNodes: number;

  constructor(polyphony: number = 16, nodeType: string) {
    this.#nodes = [];
    this.#availableNodes = new Set(); // available nodeIds
    this.#maxNodes = polyphony;
    this.nodeType = `pool:${nodeType}`;
  }

  getAvailableNode(): T | null {
    // Get the first available node
    if (this.#availableNodes.size > 0) {
      const nodeId = this.#availableNodes.values().next().value;
      if (!nodeId) return null;

      this.#availableNodes.delete(nodeId);
      return this.getNodeById(nodeId);
    }
    // todo: implement stealing
    return null;
  }

  markAvailable(nodeId: NodeID) {
    // Mark the node as available
    this.#availableNodes.add(nodeId);

    return this;
  }

  addNodes(nodes: T[]) {
    for (const node of nodes) {
      if (this.#nodes.length < this.#maxNodes) {
        this.#nodes.push(node);
        this.#availableNodes.add(node.nodeId);
      } else {
        console.warn('Max nodes reached, cannot add more.');
      }
    }
    return this;
  }

  addNode(node: T) {
    if (this.#nodes.length < this.#maxNodes) {
      this.#nodes.push(node);
      this.#availableNodes.add(node.nodeId);
    } else {
      console.warn('Max nodes reached, cannot add more.');
    }
    return this;
  }

  getNodeById(nodeId: NodeID): T | null {
    return this.#nodes.find((n) => n.nodeId === nodeId) || null;
  }

  isNodeAvailable(nodeId: NodeID): boolean {
    return this.#availableNodes.has(nodeId);
  }

  connect(destination: AudioNode | AudioParam) {
    for (const node of this.#nodes) {
      node.connect(destination);
    }

    return this;
  }

  disconnect() {
    for (const node of this.#nodes) {
      node.disconnect();
    }

    return this;
  }

  dispose() {
    this.disconnect();
    this.#nodes = [];
    this.#availableNodes.clear();
    deleteNodeId(this.nodeId);
  }

  get nodes(): T[] {
    return this.#nodes;
  }

  get availableCount(): number {
    return this.#availableNodes.size;
  }
}
