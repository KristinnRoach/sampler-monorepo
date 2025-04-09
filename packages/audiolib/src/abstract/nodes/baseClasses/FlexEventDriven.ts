import { LibNode } from './LibNode';
import {
  EventType,
  IEventBus,
  EventBusOption,
  EventMap,
  getEventBus,
} from '@/events';

// The same as EventDrivenNode's unique bus, but adding all possible EventBus options:
// GlobalAudio, GlobalUI, unique (for each instance), or none.
export abstract class FlexEventDriven extends LibNode {
  #eventBus: IEventBus | null = null;
  #eventBusOption: EventBusOption;
  // // Track listeners added by this instance
  // #ownListeners: Map<EventType, Set<Function>> = new Map();

  constructor(eventBusOption: EventBusOption) {
    super();

    this.#eventBusOption = eventBusOption;
    eventBusOption === 'unique'
      ? (this.#eventBus = getEventBus(eventBusOption, this.nodeId))
      : (this.#eventBus = getEventBus(eventBusOption));
  }

  protected notify<K extends EventType>(type: K, detail: EventMap[K]): void {
    if (!this.#eventBus) throw new Error('Event bus not initialized');

    this.#eventBus.notify(type, detail);
  }

  addListener<K extends EventType>(
    type: K,
    listener: (detail: EventMap[K]) => void
  ): () => void {
    if (!this.#eventBus) throw new Error('Event bus not initialized');

    return this.#eventBus.addListener(type, listener);
  }

  removeListener<K extends EventType>(
    type: K,
    listener: (detail: EventMap[K]) => void
  ): void {
    if (!this.#eventBus) throw new Error('Event bus not initialized');

    this.#eventBus.removeListener(type, listener);
  }

  // protected disposeAll() {
  //   if (!this.#eventBus) {
  //     throw new Error('Event bus not initialized');
  //   }
  //   this.#eventBus.dispose();
  // }

  // protected removeAllListeners(): void {
  //   if (!this.#eventBus) {
  //     throw new Error('Event bus not initialized');
  //   }
  //   this.#eventBus.removeAllListeners();
  // }

  getEventBus(): IEventBus {
    if (!this.#eventBus) throw new Error('Event bus not initialized');

    return this.#eventBus;
  }

  hasEventBus(): boolean {
    return this.#eventBus !== null;
  }

  getEventBusOption(): EventBusOption {
    return this.#eventBusOption;
  }

  dispose(): void {
    super.dispose();

    if (this.#eventBus) {
      this.#eventBus.clearAllListeners();
      this.#eventBus = null;
    }
  }
}

// Methods need to check for null bus first
// if (!this.#eventBus) throw new Error('Event bus not initialized');

// Usage example in VoiceNode:
// constructor(voiceId: number, ..., eventBusOption: EventBusOption = 'unique')
