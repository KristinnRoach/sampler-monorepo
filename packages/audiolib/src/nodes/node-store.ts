export type NodeID = string;

let newestId = -1;

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

export const getIdsByType = (type: string) => {
  return NodeIDs.filter((id) => id.includes(type));
};

export const getAllIds = () => [...NodeIDs];

export const hasId = (id: string) => NodeIDs.includes(id);

// Converters
export const idToNum = (nodeId: string) => parseInt(nodeId.split('-')[0]);
export const numToId = (num: number, nodeType: string) => `${num}-${nodeType}`;
