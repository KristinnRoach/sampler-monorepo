let newestId = -1;

const IDStore: string[] = [newestId + ''];

// todo: add node types
export const createNodeId = (nodeType: string = '') => {
  const id = (++newestId).toString();
  IDStore.push(id + '-' + nodeType);
  return id;
};

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
