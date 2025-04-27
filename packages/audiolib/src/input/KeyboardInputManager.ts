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
    console.log(`caps state supported: ${isModifierStateSupported()}`);
    console.log(`keyboard layout supported: ${isKeyboardAPISupported()}`);
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
      caps: this.detectCapsLock(e),
    };
  }

  isPressed(code: string): boolean {
    if (code === 'CapsLock') return this.#capsLockOn;
    return this.#pressedKeys.has(code);
  }

  get pressedKeys(): Set<string> {
    return new Set(this.#pressedKeys);
  }

  detectCapsLock(e: KeyboardEvent): boolean {
    if (e.key.length !== 1) return false; // Skip non-character keys

    // Modern method
    if (e.getModifierState) {
      return e.getModifierState('CapsLock');
    }

    // Legacy fallback (for letters only)
    else if (/[a-zA-Z]/.test(e.key)) {
      // Only for letters
      const isUppercaseWithoutShift =
        e.key === e.key.toUpperCase() && !e.shiftKey;
      const isLowercaseWithShift = e.key === e.key.toLowerCase() && e.shiftKey;
      return isUppercaseWithoutShift || isLowercaseWithShift;
    }

    return false; // Default for non-letters
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    const modifiers = this.getModifiers(e);
    this.#pressedKeys.add(e.code);

    const midiNote = this.#keymap[e.code];
    if (midiNote !== undefined) {
      this.#handlers.forEach((handler) =>
        handler.onNoteOn(midiNote, modifiers)
      );
    } // TODO: else handle non-midinote keys, e.g caps
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.#pressedKeys.delete(e.code);
    const modifiers = this.getModifiers(e);

    const midiNote = this.#keymap[e.code];
    if (midiNote !== undefined) {
      this.#handlers.forEach(
        (handler) => handler.onNoteOff(midiNote, modifiers) // ! handle caps only on keyup !?
      );
    } // TODO: else handle non-midinote keys, e.g caps
  };

  private handleBlur = (e: FocusEvent): void => {
    // const modifiers = this.getModifiers(e); //? should not handle modifiers?

    // Release all pressed keys
    this.#pressedKeys.forEach((code) => {
      const midiNote = this.#keymap[code];
      if (midiNote !== undefined) {
        this.#handlers.forEach((handler) => handler.onBlur());
      }
      // persist Capslock ?
    });
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
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);
      window.addEventListener('blur', this.handleBlur); // window vs doc ?
      this.#isListening = true;
    }
  }

  private stopListening(): void {
    if (!this.#isListening) return;

    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);
      window.removeEventListener('blur', this.handleBlur);
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
    caps: e.getModifierState('CapsLock'),
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
