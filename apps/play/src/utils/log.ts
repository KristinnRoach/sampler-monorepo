// ponytail: dev-only console.log; add levels/transport only if something needs them.
// Vite inlines import.meta.env.DEV, so these calls are dropped from production builds.
export const log = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};
