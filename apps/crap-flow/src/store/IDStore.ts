let newestId = -1;

const IDStore: string[] = [newestId + ''];

export const createNodeId = (nodeType: string = '') => {
  const id = (++newestId).toString();
  IDStore.push(id + '-' + nodeType);
  return id;
};

export const deleteNodeId = (nodeId: string) => {
  const index = IDStore.indexOf(nodeId);
  if (index > -1) {
    IDStore.splice(index, 1);
    console.log('Node ID deleted: ', nodeId);
  } else {
  }
};

export const getIdsByType = (type: string) => {
  return IDStore.filter((id) => id.includes(type));
};

export const getAllIds = () => [...IDStore];

export const hasId = (id: string) => IDStore.includes(id);
export const resetIdStore = () => {
  IDStore.length = 0;
  newestId = -1;
};

export const getIdStore = () => IDStore;

export default {
  createNodeId,
  deleteNodeId,
  getIdsByType,
  getAllIds,
  hasId,
  resetIdStore,
  getIdStore,
};
