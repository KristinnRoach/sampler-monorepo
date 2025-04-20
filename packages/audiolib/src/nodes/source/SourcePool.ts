// SourcePool.ts
import { SourceNode } from './SourceNode';

export class SourcePool {
  #nodes: SourceNode[];
  #availableNodes: Set<string>; // available nodeIds
  #maxNodes: number;

  constructor(polyphony: number = 16) {
    this.#nodes = [];
    this.#availableNodes = new Set();
    this.#maxNodes = polyphony;
  }

  getAvailableNode(): SourceNode | null {
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

  releaseNode(nodeId: NodeID): void {
    // Mark the node as available
    this.#availableNodes.add(nodeId);
  }

  stopAll(): void {
    for (const node of this.#nodes) {
      node.stop();
      this.#availableNodes.add(node.nodeId);
    }
  }

  addNodes(nodes: SourceNode[]) {
    for (const node of nodes) {
      if (this.#nodes.length < this.#maxNodes) {
        this.#nodes.push(node);
        this.#availableNodes.add(node.nodeId);
      } else {
        console.warn('Max nodes reached, cannot add more.');
      }
    }
  }

  addNode(node: SourceNode) {
    if (this.#nodes.length < this.#maxNodes) {
      this.#nodes.push(node);
      this.#availableNodes.add(node.nodeId);
    } else {
      console.warn('Max nodes reached, cannot add more.');
    }
  }

  getNodeById(nodeId: NodeID): SourceNode | null {
    return this.#nodes.find((n) => n.nodeId === nodeId) || null;
  }

  isNodeAvailable(nodeId: NodeID): boolean {
    return this.#availableNodes.has(nodeId);
  }

  disconnect() {
    for (const node of this.#nodes) {
      node.disconnect();
    }
  }

  dispose() {
    this.disconnect();
    this.#nodes = [];
    this.#availableNodes.clear();
  }

  get nodes(): SourceNode[] {
    return this.#nodes;
  }

  get availableCount(): number {
    return this.#availableNodes.size;
  }
}
