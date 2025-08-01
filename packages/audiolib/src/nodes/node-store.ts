// node-store.ts

import { LibNode, NodeType } from '@/nodes';

export type NodeID = string;

let newestId = -1;
const NodeRegistry = new Map<NodeID, LibNode>();

export const registerNode = (nodeType: NodeType, node: LibNode) => {
  const nodeId = `${++newestId}-${nodeType}`;
  NodeRegistry.set(nodeId, node);
  return nodeId;
};

// Combined unregister and delete
export const unregisterNode = (nodeId: NodeID): void => {
  if (!NodeRegistry.delete(nodeId)) {
    console.warn('Node ID not found: ', nodeId);
  }
};

// Node lookup
export const getNodeById = (nodeId: NodeID): LibNode | null => {
  return NodeRegistry.get(nodeId) || null;
};

// Query methods
export const getNodesByType = (type: NodeType): LibNode[] => {
  return Array.from(NodeRegistry.values()).filter(
    (node) => node.nodeType === type
  );
};

export const getAllNodes = (): LibNode[] => Array.from(NodeRegistry.values());
export const getAllNodeIds = (): NodeID[] => Array.from(NodeRegistry.keys());

export const hasNode = (nodeId: NodeID): boolean => NodeRegistry.has(nodeId);

// Converters
export const idToNum = (nodeId: NodeID): number =>
  parseInt(nodeId.split('-')[0]);
export const numToId = (num: number, nodeType: NodeType): NodeID =>
  `${num}-${nodeType}`;

const NodeIDs: string[] = [];

export const createNodeId = (nodeType: string) => {
  const nodeId = `${++newestId}-${nodeType}`;
  NodeIDs.push(nodeId);
  return nodeId;
};

export const deleteNodeId = (nodeId: string) => {
  const index = NodeIDs.indexOf(nodeId);
  if (index > -1) {
    NodeIDs.splice(index, 1);
  } else {
    console.warn('Node ID not found: ', nodeId);
  }
};

// export const getIdsByType = (type: string) => {
//   return NodeIDs.filter((id) => id.includes(type));
// };

// export const getAllIds = () => [...NodeIDs];

// export const hasId = (id: string) => NodeIDs.includes(id);
