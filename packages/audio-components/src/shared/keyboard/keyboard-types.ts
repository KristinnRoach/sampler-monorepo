// src/input/types.ts

export type KeyMap = Record<string, number>;

export type KeymapConfig = {
  baseNote: number; // Starting MIDI note
  scale?: number[]; // Custom scale intervals
  layout: 'piano' | 'chromatic' | 'custom';
};

// Then you could have:
// export const pentatonicKeymap = generateKeymap({
//   baseNote: 48,
//   scale: [0, 2, 4, 7, 9], // Pentatonic intervals
//   layout: 'chromatic'
// });

// interface Keyboard {
//   getLayoutMap(): Promise<Record<string, string>>;
//   // [key: string]: any;
// }

// declare global {
//   interface Navigator {
//     keyboard?: Keyboard;
//   }
// }

// export type ModifierKey = 'space' | 'caps' | 'meta' | 'shift' | 'ctrl' | 'alt';
// // needed to add space and just simplified for flexibility for now by using string

// export type PressedModifiers = Partial<Record<ModifierKey, boolean>>;

// export interface InputHandler {
//   onNoteOn: (
//     midiNote: number,
//     velocity: number,
//     modifiers?: PressedModifiers
//   ) => void;
//   onNoteOff: (midiNote: number, modifiers: PressedModifiers) => void;
//   onBlur: () => void;
//   onModifierChange?: (modifiers: PressedModifiers) => void;
// }
