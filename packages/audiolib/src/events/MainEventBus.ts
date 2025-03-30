// MainEventBus.ts - A centralized event handling system

export const EVENTS = {
  VOICE: {
    STARTED: 'voice:started',
    ENDED: 'voice:ended',
    RELEASED: 'voice:released',
    ERROR: 'voice:error',
  },
  INSTRUMENT: {
    ALL_VOICES_ENDED: 'instrument:all_voices_ended',
  },
  SYSTEM: {
    CONTEXT_CREATED: 'system:context_created',
    CONTEXT_RESUMED: 'system:context_resumed',
  },
} as const;

// Type definitions for event payloads
export interface VoiceEventDetail {
  voiceId: number;
  note?: number;
  gain?: number;
  time?: number;
  sampleId?: string;
  message?: string;
}

export interface SampleEventDetail {
  sampleId: string;
  time: number;
}

export interface SystemEventDetail {
  context: BaseAudioContext;
  message?: string;
}

// A single event bus instance to handle all audio events
const MainEventBus = new EventTarget();

// Helper functions to publish events
export function notifyListeners(type: string, detail: any): void {
  MainEventBus.dispatchEvent(new CustomEvent(type, { detail }));
}

// Helper functions for adding/removing listeners
export function on(
  type: string,
  listener: EventListenerOrEventListenerObject
): void {
  MainEventBus.addEventListener(type, listener);
}

export function off(
  type: string,
  listener: EventListenerOrEventListenerObject
): void {
  MainEventBus.removeEventListener(type, listener);
}

export function once(
  type: string,
  listener: EventListenerOrEventListenerObject
): void {
  MainEventBus.addEventListener(type, listener, { once: true });
}

export default MainEventBus;
