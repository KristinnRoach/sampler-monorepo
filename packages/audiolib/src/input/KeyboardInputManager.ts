// src/input/KeyboardInputManager.ts
import { NoteHandler, KeyMap } from './types';
import { defaultKeymap } from './keymap';

export class KeyboardInputManager {
  private activeHandlers: Set<NoteHandler> = new Set();
  private isListening: boolean = false;
  private keymap: KeyMap;

  constructor(keymap: KeyMap = defaultKeymap) {
    this.keymap = keymap;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return; // Ignore key repeat events
    const midiNote = this.keymap[e.code];

    if (midiNote !== undefined) {
      this.activeHandlers.forEach((handler) => {
        handler.onNoteOn(midiNote);
      });
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const midiNote = this.keymap[e.code];

    if (midiNote !== undefined) {
      this.activeHandlers.forEach((handler) => {
        handler.onNoteOff(midiNote);
      });
    }
  };

  /**
   * Registers a note handler to receive keyboard events
   * @param handler The note handler to register
   * @returns A cleanup function to unregister the handler
   */
  public addHandler(handler: NoteHandler): () => void {
    if (this.activeHandlers.has(handler)) {
      console.warn('Handler is already registered');
      return () => {
        this.removeHandler(handler);
      };
    }

    this.activeHandlers.add(handler);
    this.startListening();

    // Return a cleanup function for convenience
    return () => {
      this.removeHandler(handler);
    };
  }

  /**
   * Removes a previously registered note handler
   * @param handler The note handler to remove
   */
  public removeHandler(handler: NoteHandler): void {
    this.activeHandlers.delete(handler);

    // If no more handlers, stop listening to save resources
    if (this.activeHandlers.size === 0) {
      this.stopListening();
    }
  }

  /**
   * Checks if a handler is registered
   * @param handler The note handler to check
   * @returns True if the handler is registered, false otherwise
   */
  public hasHandler(handler: NoteHandler | NoteHandler[]): boolean {
    if (Array.isArray(handler)) {
      return handler.every((h) => this.activeHandlers.has(h));
    }
    return this.activeHandlers.has(handler);
  }

  /**
   * Sets a new keymap for this input manager
   * @param keymap The new keymap to use
   */
  public setKeymap(keymap: KeyMap): void {
    this.keymap = keymap;
  }

  /**
   * Gets the current keymap
   * @returns The current keymap
   */
  public getKeymap(): KeyMap {
    return { ...this.keymap };
  }

  private startListening(): void {
    if (this.isListening) return;

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      this.isListening = true;
    }
  }

  private stopListening(): void {
    if (!this.isListening) return;

    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      this.isListening = false;
    }
  }

  /**
   * Completely stops listening and clears all handlers
   */
  public dispose(): void {
    this.stopListening();
    this.activeHandlers.clear();
  }
}
