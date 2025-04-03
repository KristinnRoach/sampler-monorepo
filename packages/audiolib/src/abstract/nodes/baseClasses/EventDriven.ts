// EventDrivenNode.ts
import { DefaultEventBus, EventType } from '@/events';
import { Id } from '@/types/global';

export abstract class EventDriven extends DefaultEventBus {
  readonly id: Id;
  protected isDisposed: boolean = false;

  constructor(id: Id) {
    super(id);
    this.id = id;
  }

  protected disposeEvents(types: EventType[]): void {
    if (!this.isDisposed) {
      types.forEach((type) => this.removeAllListeners(type));
      this.isDisposed = true;
    }
  }
}
