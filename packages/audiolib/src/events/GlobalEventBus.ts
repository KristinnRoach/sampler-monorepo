// GlobalEventBus.ts
import { DefaultEventBus } from './EventBus';

// Singleton instance
export const GlobalEventBus = new DefaultEventBus('1'); // temporary id

// Usage example:
/*
// Listen for global events
const unsubscribe = MainEventBus.addListener('audiocontext:created', (detail) => {
  console.log(`AudioContext created at ${detail.currentTime}`);
});

// Notify globally
MainEventBus.notify('audiocontext:created', { 
  currentTime: audioContext.currentTime 
});

// Clean up
unsubscribe();
*/
