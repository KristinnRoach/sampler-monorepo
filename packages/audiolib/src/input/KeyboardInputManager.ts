// src/input/KeyboardInputManager.ts
import { InputHandler, KeyMap, PressedModifiers, ModifierKey } from './types';
import { isKeyboardAPISupported, isModifierStateSupported } from '@/utils';
import { defaultKeymap } from './keymap';

export class KeyboardInputManager {
  static #instance: KeyboardInputManager;
  #handlers: Set<InputHandler> = new Set();

  #pressedKeys: Set<string> = new Set();
  #capsLockOn: boolean = false;
  #isModifierStateSupported: boolean = false;
  #isListening: boolean = false;
  #keymap: KeyMap;

  private constructor(keymap: KeyMap = defaultKeymap) {
    this.#keymap = keymap;
    this.#isModifierStateSupported = isModifierStateSupported();
  }

  static getInstance(keymap: KeyMap = defaultKeymap): KeyboardInputManager {
    if (!KeyboardInputManager.#instance) {
      KeyboardInputManager.#instance = new KeyboardInputManager(keymap);
    }
    return KeyboardInputManager.#instance;
  }

  getModifiers(e: KeyboardEvent): PressedModifiers {
    return {
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
      caps: this.#capsLockOn,
    };
  }

  isPressed(code: string): boolean {
    if (code === 'CapsLock') return this.#capsLockOn;
    return this.#pressedKeys.has(code);
  }

  get pressedKeys(): Set<string> {
    return new Set(this.#pressedKeys);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;

    if (this.#pressedKeys.has(e.code)) return;

    const midiNote = this.#keymap[e.code];
    if (midiNote === undefined) return;

    const modifiers = this.getModifiers(e);
    // debugKeyModifiers(e);
    this.#pressedKeys.add(e.code);

    this.#handlers.forEach((handler) => handler.onNoteOn(midiNote, modifiers));
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (!this.#pressedKeys.has(e.code)) return;

    const midiNote = this.#keymap[e.code];
    if (midiNote === undefined) return;

    const modifiers = this.getModifiers(e);
    // debugKeyModifiers(e);
    this.#pressedKeys.delete(e.code);

    this.#handlers.forEach((handler) => handler.onNoteOff(midiNote, modifiers));
  };

  // Specifically handling caps for robust cross-platform behavior
  private handleCaps = (e: KeyboardEvent): void => {
    if (e.key === 'CapsLock') {
      this.#capsLockOn = e.getModifierState('CapsLock');
    }
  };

  private handleBlur = (e: FocusEvent): void => {
    // Create a copy of pressed keys
    const pressedKeyCodes = Array.from(this.#pressedKeys);

    // First notify handlers about each specific key release
    pressedKeyCodes.forEach((code) => {
      const midiNote = this.#keymap[code];
      if (midiNote !== undefined) {
        const modifiers = {
          shift: false,
          ctrl: false,
          alt: false,
          meta: false,
          caps: this.#capsLockOn, // Maintain caps lock state
        };

        this.#handlers.forEach((handler) =>
          handler.onNoteOff(midiNote, modifiers)
        );
      }
    });

    // Then notify all handlers about the blur event
    this.#handlers.forEach((handler) => {
      if (handler.onBlur) {
        handler.onBlur();
      }
    });

    // Clear pressed keys except for CapsLock
    this.#pressedKeys.clear();
  };

  public addHandler(handler: InputHandler): () => void {
    if (this.#handlers.has(handler)) {
      console.warn('Handler is already registered');
      return () => this.removeHandler(handler);
    }

    this.#handlers.add(handler);
    this.startListening();
    return () => this.removeHandler(handler);
  }

  public removeHandler(handler: InputHandler): void {
    this.#handlers.delete(handler);
    if (this.#handlers.size === 0) {
      this.stopListening();
    }
  }

  public hasHandler(handler: InputHandler | InputHandler[]): boolean {
    if (Array.isArray(handler)) {
      return handler.every((h) => this.#handlers.has(h));
    }
    return this.#handlers.has(handler);
  }

  public setKeymap(keymap: KeyMap): void {
    this.#keymap = keymap;
  }

  public getKeymap(): KeyMap {
    return { ...this.#keymap };
  }

  private startListening(): void {
    if (this.#isListening) return;
    if (typeof document !== 'undefined') {
      // use document for key & mouse events, window for blur & focus
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);

      // Attempting to ensure robust capslock behavior
      // remove if verified to be redundant
      document.addEventListener('keydown', this.handleCaps);
      document.addEventListener('keyup', this.handleCaps);
      document.addEventListener('keypress', this.handleCaps);

      // Blur
      window.addEventListener('blur', this.handleBlur);
      this.#isListening = true;
    }
  }

  private stopListening(): void {
    if (!this.#isListening) return;

    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);

      document.removeEventListener('keydown', this.handleCaps);
      document.removeEventListener('keyup', this.handleCaps);
      document.removeEventListener('keypress', this.handleCaps);

      if (typeof window !== 'undefined') {
        window.removeEventListener('blur', this.handleBlur);
      }

      this.#isListening = false;
    }
  }

  public dispose(): void {
    this.stopListening();
    this.#handlers.clear();
    this.#pressedKeys.clear();
  }
}

// Singleton instance for easy global access
export const globalKeyboardInput = KeyboardInputManager.getInstance();

// Helper function for checking key state
export const isKeyPressed = (code: string): boolean =>
  KeyboardInputManager.getInstance().isPressed(code);

export function debugKeyModifiers(e: KeyboardEvent, keys?: ModifierKey[]) {
  const modifiers: Record<ModifierKey, boolean> = {
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    meta: e.metaKey,
    caps: e.getModifierState('CapsLock'), // Changed from 'loop' to 'caps'
  };

  if (keys) {
    const selectedModifiers: Partial<Record<ModifierKey, boolean>> = {};
    keys.forEach((key) => {
      selectedModifiers[key] = modifiers[key];
    });
    console.log(selectedModifiers);
  } else {
    console.log(modifiers);
  }
}

// remove below, if/when verified to be redundant:
// private handleFirstKeyEvent = (e: KeyboardEvent): void => {
//   const isCapsActive = e.getModifierState('CapsLock');
//   console.debug(`isCapsActive: ${isCapsActive}`, e.code, isCapsActive);
//   this.#capsLockOn = isCapsActive;
// };

// document.addEventListener('keydown', this.handleFirstKeyEvent, {
//   once: true,
// });

// document.removeEventListener('keydown', this.handleFirstKeyEvent);
