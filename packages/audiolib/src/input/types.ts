// src/input/types.ts

interface Keyboard {
  getLayoutMap(): Promise<Record<string, string>>;
  [key: string]: any;
}

declare global {
  interface Navigator {
    keyboard?: Keyboard;
  }
}

export type ModifierKey = 'shift' | 'ctrl' | 'alt' | 'meta' | 'caps';

export type PressedModifiers = Record<ModifierKey, boolean>;

export interface InputHandler {
  onNoteOn: (
    midiNote: number,
    modifiers: PressedModifiers,
    velocity?: number
  ) => void;
  onNoteOff: (midiNote: number, modifiers: PressedModifiers) => void;
  onBlur: () => void;
  onModifierChange?: (modifiers: PressedModifiers) => void;
}

export type KeyMap = Record<string, number>;
