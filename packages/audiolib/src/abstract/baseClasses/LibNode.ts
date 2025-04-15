import { createNodeId, deleteNodeId } from '@/store/IdStore';

export class LibNode {
  readonly nodeId: NodeID;

  constructor() {
    this.nodeId = createNodeId();
  }

  dispose(): void {
    deleteNodeId(this.nodeId);
  }
}
