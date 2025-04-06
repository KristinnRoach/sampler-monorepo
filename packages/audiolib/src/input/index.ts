// src/input/index.ts
export * from './types';
export * from './keymap';
export * from './KeyboardInputManager';

// Singleton instance for easy global access
import { KeyboardInputManager } from './KeyboardInputManager';
export const globalKeyboardInput = new KeyboardInputManager();
