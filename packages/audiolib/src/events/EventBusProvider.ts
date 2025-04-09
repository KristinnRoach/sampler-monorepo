// EventBusProvider.ts
import { IEventBus, DefaultEventBus } from '@/events';

// Singleton instances
export const UIUpdateBus = new DefaultEventBus();
export const AudioEventBus = new DefaultEventBus();
export const SystemEventBus = new DefaultEventBus();

export type GlobalEventBusses = 'audio' | 'ui' | 'system';
export type EventBusOption = 'audio' | 'ui' | 'unique' | 'system' | 'none'; // IEventBus |

// overloads for type safety
export function getEventBus(option: 'unique', publisherId: string): IEventBus;
export function getEventBus(option: 'none'): null;
export function getEventBus(
  option: Exclude<EventBusOption, 'unique'>
): IEventBus | null;

// implementation
export function getEventBus(
  option: EventBusOption,
  publisherId?: string
): IEventBus | null {
  if (option === 'none') return null;
  if (option === 'system') return SystemEventBus;
  if (option === 'ui') return UIUpdateBus;
  if (option === 'audio') return AudioEventBus;
  if (option === 'unique') {
    if (!publisherId)
      throw new Error(
        'The associated objects id is required when option is "unique".'
      );
    return new DefaultEventBus();
  }

  return option; // IEventBus
}
