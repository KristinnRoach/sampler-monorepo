// src/input/KeyboardInputManager.ts
import { InputHandler, KeyMap, PressedModifiers, ModifierKey } from './types';
import { isKeyboardAPISupported, isModifierStateSupported } from '@/utils';
import { defaultKeymap } from './keymap';

export class KeyboardInputManager {
  static #instance: KeyboardInputManager;

  #handlers: Set<InputHandler> = new Set();
  // #triggerHandlers: Set<InputHandler> = new Set(); // todo: Set<InputHandler<"NoteOn">>

  #isModifierStateSupported: boolean = false;
  #isListening: boolean = false;

  #pressedNoteKeys: Set<string> = new Set();
  #pressedModKeys: Set<string> = new Set();

  #noteKeyMap: KeyMap;

  // just hardcoded e.code values since only using caps and space for now
  #modifierKeys = { loopToggle: 'CapsLock', loopMomentary: 'Space' } as const;

  #capslockOn: boolean = false;
  #spacebarDown: boolean = false;

  private constructor(keymap: KeyMap = defaultKeymap) {
    this.#noteKeyMap = keymap;
    this.#isModifierStateSupported = isModifierStateSupported();
  }

  static getInstance(keymap: KeyMap = defaultKeymap): KeyboardInputManager {
    if (!KeyboardInputManager.#instance) {
      KeyboardInputManager.#instance = new KeyboardInputManager(keymap);
    }
    return KeyboardInputManager.#instance;
  }

  get pressedKeys() {
    return new Set([...this.#pressedNoteKeys, ...this.#pressedModKeys]);
  }

  isPressed(keycode: string): boolean {
    if (this.#modifierKeys.hasOwnProperty(keycode)) {
      return this.#pressedModKeys.has(keycode);
    } else return this.#pressedNoteKeys.has(keycode);
  }

  getCapslock(e?: KeyboardEvent): boolean {
    if (e && this.#isModifierStateSupported) {
      return e.getModifierState('CapsLock');
    } else return this.#capslockOn;
  }

  get pressedNoteKeys(): Set<string> {
    return new Set(this.#pressedNoteKeys);
  }

  getALLModifiers(e: KeyboardEvent): PressedModifiers {
    return {
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
      caps: this.getCapslock(e),
      space: this.#spacebarDown,
    } as const;
  }

  #handleModKeyDown(e: KeyboardEvent) {
    e.preventDefault();

    if (this.#pressedModKeys.has(e.code)) return;

    if (e.code === 'Space') {
      this.#spacebarDown = true;
    } else if (e.code === 'CapsLock') {
      this.#capslockOn = this.getCapslock(e);
    }

    this.#pressedModKeys.add(e.code);

    const modifiers = this.getALLModifiers(e); // todo: rethink / remove redundancy !
    this.#handlers.forEach((handler) => {
      if (handler.onModifierChange) {
        handler.onModifierChange(modifiers);
      }
    });
  }

  #handleModKeyUp(e: KeyboardEvent) {
    e.preventDefault();

    if (!this.#pressedModKeys.has(e.code)) return;

    if (e.code === 'Space') {
      this.#spacebarDown = false;
    }

    this.#pressedModKeys.delete(e.code);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    const keycode = e.code; // consider switching to e.key

    if (this.#modifierKeys.hasOwnProperty(keycode)) {
      this.#handleModKeyDown(e);
      return;
    }

    if (this.#pressedNoteKeys.has(keycode)) return;
    this.#pressedNoteKeys.add(keycode);

    const midiNote = this.#noteKeyMap[keycode];
    if (midiNote === undefined) return;
    e.preventDefault();

    const defaultVelocity = 100; // for now (no velocity for computer keyboard)

    const modifiers = this.getALLModifiers(e); // todo: rethink / remove redundancy !

    this.#handlers.forEach((handler) =>
      handler.onNoteOn(midiNote, defaultVelocity, modifiers)
    );
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const keycode = e.code;

    this.#capslockOn = this.getCapslock(e); // caps doesnt fire keyup so just always checking
    if (this.#modifierKeys.hasOwnProperty(keycode)) {
      this.#handleModKeyUp(e);
      return;
    }

    const modifiers = this.getALLModifiers(e); // todo: rethink / remove redundancy !
    this.#handlers.forEach((handler) => {
      if (handler.onModifierChange) {
        handler.onModifierChange(modifiers);
      }
    });

    if (!this.#pressedNoteKeys.has(e.code)) return;

    const midiNote = this.#noteKeyMap[e.code];
    if (midiNote === undefined) return;

    this.#handlers.forEach((handler) => handler.onNoteOff(midiNote, modifiers));

    // Moved after handlers to prevent stuck notes (?)
    this.#pressedNoteKeys.delete(e.code);
  };

  private handleBlur = (e: FocusEvent): void => {
    // Create a copy of pressed keys
    const pressedKeyCodes = Array.from(this.#pressedNoteKeys);

    console.log(`Blur occured ${e}`);

    const modifiers = {
      shift: false,
      ctrl: false,
      alt: false,
      meta: false,
      caps: this.getCapslock(), // Maintains caps lock state
      space: false,
    };

    // First notify handlers about each specific key release
    pressedKeyCodes.forEach((code) => {
      const midiNote = this.#noteKeyMap[code];
      if (midiNote !== undefined) {
        this.#handlers.forEach((handler) =>
          handler.onNoteOff(midiNote, modifiers)
        );
      }
      this.#pressedNoteKeys.delete(code);
    });

    // Then notify all handlers about the blur event
    this.#handlers.forEach((handler) => {
      if (handler.onBlur) {
        handler.onBlur();
      }
    });

    // Clear pressed keys except for CapsLock
    this.#pressedNoteKeys.clear();
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
    this.#noteKeyMap = keymap;
  }

  public getKeymap(): KeyMap {
    return { ...this.#noteKeyMap };
  }

  private startListening(): void {
    if (this.#isListening) return;
    if (typeof document !== 'undefined') {
      // Use document for key & mouse events, window for blur & focus
      // ? focus ?

      // Attach time critical handlers first (e.g. keydown triggering playback)
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);

      window.addEventListener('blur', this.handleBlur);

      this.#isListening = true;
    }
  }

  private stopListening(): void {
    if (!this.#isListening) return;

    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);

      if (typeof window !== 'undefined') {
        window.removeEventListener('blur', this.handleBlur);
      }

      this.#isListening = false;
    }
  }

  public dispose(): void {
    this.stopListening();
    this.#handlers.clear();
    this.#pressedNoteKeys.clear();
  }
}

// Singleton instance for easy global access // TODO: Remove if not needed
export const globalKeyboardInput = KeyboardInputManager.getInstance();

export function debugKeyModifiers(e: KeyboardEvent, keys?: ModifierKey[]) {
  const modifiers: Record<ModifierKey, boolean> = {
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    meta: e.metaKey,
    caps: globalKeyboardInput.getCapslock(e),
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

// Attempting to ensure robust capslock behavior
// check caps / modifiers on first keyevent ?

// Attempting to ensure robust capslock behavior
// document.addEventListener('keydown', this.handleCaps);
// document.addEventListener('keyup', this.handleCaps);
// document.addEventListener('keypress', this.handleCaps);
// document.removeEventListener('keydown', this.handleCaps);
// document.removeEventListener('keyup', this.handleCaps);
// document.removeEventListener('keypress', this.handleCaps);

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
