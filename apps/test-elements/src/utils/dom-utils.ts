export const qs = (classOrId: string, container?: Element) =>
  (container || document).querySelector(classOrId);
export const qsa = (classOrId: string, container?: Element) =>
  (container || document).querySelectorAll(classOrId);
