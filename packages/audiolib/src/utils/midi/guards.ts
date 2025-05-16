export const isMidiValue = (x?: number) => {
  return typeof x === 'number' && Number.isInteger(x) && x <= 127 && x >= 0;
};
