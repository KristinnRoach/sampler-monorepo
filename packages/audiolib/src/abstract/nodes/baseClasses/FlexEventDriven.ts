import {
  EventType,
  IEventBus,
  EventBusOption,
  EventMap,
  getEventBus,
} from '@/events';

// The same as EventDrivenNode, but you can optionally choose to use the GlobalEventBus
// or a bus passed in via the constructor.
// Defaults to creating its own unique event bus.
export abstract class FlexEventDriven {
  #eventBus: IEventBus | null;
  #eventBusOption: EventBusOption;

  constructor(eventBusOption: EventBusOption = 'unique') {
    this.#eventBusOption = eventBusOption;
    this.#eventBus = getEventBus(eventBusOption);
  }

  protected notify<K extends EventType>(type: K, detail: EventMap[K]): void {
    this.#eventBus?.notify(type, detail);
  }

  getEventBus(): IEventBus | null {
    return this.#eventBus;
  }

  hasEventBus(): boolean {
    return this.#eventBus !== null;
  }

  getEventBusOption(): EventBusOption {
    return this.#eventBusOption;
  }
  // dispose(): void {
  //   if (this.#eventBus) {
  //     this.#eventBus.removeAllListeners();
  //     this.#eventBus = null;
  //   }
  // }

  // Add other event methods that check for null first

  // Usage example in VoiceNode:
  // constructor(voiceId: number, ..., eventBusOption: EventBusOption = 'unique')
}
