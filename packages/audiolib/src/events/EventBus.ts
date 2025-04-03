// EventBus.ts
import { EventType, EventMap } from './types';
import { listenerMap, getListenerMap } from './store';
import { Id } from '@/types/global';

export interface IEventBus extends EventTarget {
  readonly ownerId: Id;

  notify<K extends EventType>(type: K, detail: EventMap[K]): void;

  addListener<K extends EventType>(
    type: K,
    handler: (detail: EventMap[K]) => void,
    options?: AddEventListenerOptions
  ): () => void;

  removeListener<K extends EventType>(
    type: K,
    handler: (detail: EventMap[K]) => void
  ): void;

  removeAllListeners<K extends EventType>(type: K): void;

  listenOnce<K extends EventType>(
    type: K,
    handler: (detail: EventMap[K]) => void
  ): () => void;
}

export class DefaultEventBus extends EventTarget implements IEventBus {
  readonly ownerId: Id;

  constructor(ownerId: Id) {
    super();
    this.ownerId = ownerId;
  }

  notify<K extends EventType>(type: K, detail: EventMap[K]): void {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  addListener<K extends EventType>(
    type: K,
    handler: (detail: EventMap[K]) => void,
    options?: AddEventListenerOptions
  ): () => void {
    const listenerMap = getListenerMap(this, type);

    // If this handler is already mapped, use the existing listener
    if (listenerMap.has(handler)) {
      return () => this.removeListener(type, handler);
    }

    // Create and store the wrapped listener
    const listener = (e: Event) => {
      handler((e as CustomEvent<EventMap[K]>).detail);
    };

    listenerMap.set(handler, listener);
    this.addEventListener(type, listener, options);

    // Return unsubscribe function
    return () => this.removeListener(type, handler);
  }

  removeListener<K extends EventType>(
    type: K,
    handler: (detail: EventMap[K]) => void
  ): void {
    const listenerMap = getListenerMap(this, type);
    const listener = listenerMap.get(handler);

    if (listener) {
      this.removeEventListener(type, listener);
      listenerMap.delete(handler);
    }
  }

  removeAllListeners<K extends EventType>(type: K): void {
    const targetMap = listenerMap.get(this);
    if (!targetMap) return;

    const typeListeners = targetMap.get(type);
    if (!typeListeners) return;

    // Remove all listeners for this type
    for (const [handler, listener] of typeListeners.entries()) {
      this.removeEventListener(type, listener);
      typeListeners.delete(handler);
    }

    // Clean up the map
    targetMap.delete(type);
  }

  dispose(): void {
    // Remove all listeners from the event target
    const targetMap = listenerMap.get(this);
    if (targetMap) {
      for (const [type, typeListeners] of targetMap.entries()) {
        for (const [handler, listener] of typeListeners.entries()) {
          this.removeEventListener(type, listener);
          typeListeners.delete(handler);
        }
        targetMap.delete(type);
      }
      listenerMap.delete(this);
    }
  }

  listenOnce<K extends EventType>(
    type: K,
    handler: (detail: EventMap[K]) => void
  ): () => void {
    return this.addListener(type, handler, { once: true });
  }
}

/* Inheritance usage example:
class Synthesizer extends DefaultEventBus {
  // No need to implement EventBus methods - they're inherited!

  // Example method that emits an event
  playNote(note: number, gain: number): void {
    this.notify('playback:started', {
      note,
      gain,
      currentTime: audioContext.currentTime
    });
  }
}
  */
/* Composition usage example:
class Synthesizer implements EventBus {
  #eventBus = new DefaultEventBus();

  // Delegate to the DefaultEventBus instance
  notify<K extends EventType>(type: K, detail: EventMap[K]): void {
    this.#eventBus.notify(type, detail);
  }

  addListener<K extends EventType>(
    type: K, 
    handler: (detail: EventMap[K]) => void,
    options?: AddEventListenerOptions
  ): () => void {
    return this.#eventBus.addListener(type, handler, options);
  }

  removeListener<K extends EventType>(
    type: K,
    handler: (detail: EventMap[K]) => void
  ): void {
    this.#eventBus.removeListener(type, handler);
  }

  removeAllListeners<K extends EventType>(type: K): void {
    this.#eventBus.removeAllListeners(type);
  }

  listenOnce<K extends EventType>(
    type: K,
    handler: (detail: EventMap[K]) => void
  ): () => void {
    return this.#eventBus.listenOnce(type, handler);
  }

  // Example method that emits an event
  playNote(note: number, gain: number): void {
    this.notify('playback:started', {
      note,
      gain,
      currentTime: audioContext.currentTime
    });
  }
}
  */
