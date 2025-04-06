import { AudioContextTimeSeconds, NodeID } from '@/types/global';

// All possible event types mapped to EventData
export type EventMap = {
  ready: EventData;
  error: EventData;

  'note:on': EventData;
  'note:off': EventData;
  'note:released': EventData;

  'voice:available': EventData;
  'voice:unavailable': EventData;

  'instrument:silent': EventData;
  'instrument:playing': EventData;

  'instrument:loaded': EventData;
  'sample:loaded': EventData;

  'audiocontext:created': EventData;
  'audiocontext:resumed': EventData;
  'audiocontext:suspended': EventData;
  'audiocontext:destroyed': EventData;
  'audiocontext:error': EventData;
};

export type EventType = keyof EventMap;

// Single event payload type with all possible properties
export type EventData = {
  // Common properties
  publisherId?: NodeID;
  currentTime?: AudioContextTimeSeconds;
  endTime?: AudioContextTimeSeconds;
  message?: string;
  // Playback properties
  note?: number;
  gain?: number;

  // Voice properties
  isAvailable?: boolean;
};

/*

type EventListener = (this: EventTarget, evt: Event) => void;

type EventListenerObject = {
  handleEvent: (evt: Event) => void;
};

type EventListenerOrEventListenerObject = EventListener | EventListenerObject;

*/

// interface EventListenerOptions {
//   once?: boolean;
// }
// interface EventListenerMap {
//   [type: string]: EventListener | EventListenerObject;
// }
// interface EventMap {
//   [type: string]: EventListenerMap;
// }

// interface EventTarget {
//   addEventListener(type: string, listener: EventListener | EventListenerObject, options?: EventListenerOptions): void;
//   removeEventListener(type: string, listener: EventListener | EventListenerObject): void;
//   dispatchEvent(event: Event): boolean;
// }
// interface Event {
//     type: string;
//     target: EventTarget | null;
//     currentTarget: EventTarget | null;
//     eventPhase: number;
//     bubbles: boolean;
//     cancelable: boolean;
//     defaultPrevented: boolean;
//     composedPath(): EventTarget[];
//     stopPropagation(): void;

//     stopImmediatePropagation(): void;
//     preventDefault(): void;
//     isTrusted: boolean;
//     timeStamp: number;
//     composed: boolean;
//     srcElement: EventTarget | null;
//     initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void;
//     initCustomEvent(type: string, bubbles?: boolean, cancelable?: boolean, detail?: any): void;
//     detail: any;
//     composedPath(): EventTarget[];
// }

// EÐA:
// IF i need more specific types for events:
// export type EventMap = {
//     'playback:started': { voiceId: Id; time: number; note: number; gain: number; };
//     'playback:ended': { voiceId: Id; time: number; note?: number; };
//     'playback:released': { voiceId: Id; endReleaseTime: number };
//     'playback:error': { voiceId: Id; message: string };
//     'instrument:all_voices_ended': { instrumentId: Id; time: number; message?: string; };
//     'audiocontext:created'
//     'audiocontext:resumed'
//     'audiocontext:suspended'
//     'audiocontext:destroyed'
//     'audiocontext:error'; // as const;  };

//   export type EventType = keyof EventMap;
