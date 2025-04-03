// EventBusProvider.ts
import { IEventBus, DefaultEventBus, GlobalEventBus } from '@/events';

export type EventBusOption = IEventBus | 'global' | 'unique' | 'none';

export function getEventBus(option: EventBusOption): IEventBus | null {
  if (option === 'none') return null;
  if (option === 'global') return GlobalEventBus;
  if (option === 'unique') return new DefaultEventBus('TEMP_ID'); // temporary id
  return option; // IEventBus
}
