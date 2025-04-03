// @events/store.ts

// track wrapped listeners
const listenerMap = new WeakMap<
  EventTarget,
  Map<string, Map<Function, EventListener>>
>();

// Helper to get or create listener maps
function getListenerMap(
  target: EventTarget,
  type: string
): Map<Function, EventListener> {
  if (!listenerMap.has(target)) {
    listenerMap.set(target, new Map());
  }

  const targetMap = listenerMap.get(target)!;
  if (!targetMap.has(type)) {
    targetMap.set(type, new Map());
  }

  return targetMap.get(type)!;
}

export { listenerMap, getListenerMap };
