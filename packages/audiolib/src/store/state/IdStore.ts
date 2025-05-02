export type NodeID = string;

let newestId = -1;

const IDStore: string[] = [];

export const createNodeId = (nodeType: string) => {
  const nodeId = `${++newestId}-${nodeType}`;
  IDStore.push(nodeId);
  return nodeId;
};

export const idToNum = (nodeId: string) => parseInt(nodeId.split('-')[0]);

export const numToId = (num: number, nodeType: string) => `${num}-${nodeType}`;

export const deleteNodeId = (nodeId: string) => {
  const index = IDStore.indexOf(nodeId);
  if (index > -1) {
    IDStore.splice(index, 1);
  } else {
    console.warn('Node ID not found: ', nodeId);
  }
};

export const getIdsByType = (type: string) => {
  return IDStore.filter((id) => id.includes(type));
};

export const getAllIds = () => [...IDStore];

export const hasId = (id: string) => IDStore.includes(id);
