// src/input/types.ts
export interface NoteHandler {
  onNoteOn: (midiNote: number, velocity?: number) => void;
  onNoteOff: (midiNote?: number) => void;
}

export type KeyMap = Record<string, number>;
