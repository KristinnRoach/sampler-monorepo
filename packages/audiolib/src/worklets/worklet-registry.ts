const workletStore: string[] = [];

// Note: currently just using the processors path as identifier
function add(processor: string) {
  workletStore.push(processor);
}
function has(processor: string): boolean {
  return workletStore.includes(processor);
}

function getAll() {
  return [...workletStore];
}

function clear(): boolean {
  workletStore.length = 0;

  return workletStore.length === 0;
}

export const registry = {
  has,
  add,
  getAll,
  clear,
};
