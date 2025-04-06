import { NodeID } from '@/types/global';
import { createNodeId } from '@/store/IdStore';

export interface INode {
  readonly nodeId: NodeID;
  readonly type: string;
  initialized: boolean;
  parentId?: NodeID;
  childrenIds?: NodeID[];
  // connections?: Map<NodeID, [output: number, input: number]>; // [output, input]

  dispose(): void;
}

export class Node {
  readonly nodeId: NodeID;

  constructor() {
    this.nodeId = createNodeId();
  }

  dispose(): void {
    console.log(`Disposing node with ID: ${this.nodeId}`);
  }
}
