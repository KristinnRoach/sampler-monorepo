import { NodeID } from '@/types/global';
import { createNodeId } from '@/store/IdStore';

export class Node {
  readonly nodeId: NodeID;

  constructor() {
    this.nodeId = createNodeId();
  }

  dispose(): void {
    console.log(`Disposing node with ID: ${this.nodeId}`);
  }
}
