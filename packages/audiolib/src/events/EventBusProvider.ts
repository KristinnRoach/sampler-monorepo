// EventBusProvider.ts
import { IEventBus, DefaultEventBus } from '@/events';

// Singleton instance
export const UIUpdateBus = new DefaultEventBus(); // 'GLOBAL_UI'); // temporary id
export const AudioEventBus = new DefaultEventBus(); // 'GLOBAL_AUDIO'); // temporary id

export type GlobalEventBusses = 'audio' | 'ui';
export type EventBusOption = 'audio' | 'ui' | 'unique' | 'none'; // IEventBus |

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
