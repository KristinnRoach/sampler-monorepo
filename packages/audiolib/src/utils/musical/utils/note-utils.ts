import {
  NOTE_NAMES,
  NOTE_ROOTS,
  NOTE_FREQUENCIES,
  NOTE_PERIODS,
  NOTE_NAMES_WITH_OCTAVE,
} from '../constants';
import { midiToFrequency } from './core-utils';
import type { Note } from '../types';

/**
 * Creates a complete Note object from a MIDI note number
 */
export function createNoteFromMidi(midiNote: number): Note {
  const frequency = midiToFrequency(midiNote);
  const octave = Math.floor(midiNote / 12) - 1; // MIDI note 0 is C-1
  const noteIndex = midiNote % 12;
  const name = NOTE_NAMES[noteIndex][0]; // Use first name (prefer sharps)

  return {
    name,
    octave,
    midiNote,
    frequency,
    period: 1 / frequency,
  };
}

/**
 * Gets the note name with octave for a given MIDI note number
 */
export function getNoteName(midiNote: number): string {
  if (midiNote < 0 || midiNote >= NOTE_NAMES_WITH_OCTAVE.length) {
    throw new RangeError(`Invalid MIDI note: ${midiNote}`);
  }
  return NOTE_NAMES_WITH_OCTAVE[midiNote];
}

/**
 * Gets the MIDI note number for a given note name
 */
export function getMidiNote(noteName: string): number {
  const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid note name format: ${noteName}`);
  }

  const [_, note, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const noteIndex = NOTE_ROOTS[note as keyof typeof NOTE_ROOTS];

  return octave * 12 + noteIndex;
}

/**
 * Gets the frequency for a given note name
 */
export function getNoteFrequency(noteName: string): number {
  const midiNote = getMidiNote(noteName);
  return midiToFrequency(midiNote);
}

/**
 * Creates a map of note names to frequencies
 */
export function createNoteNameToFreqMap(): Record<string, number> {
  const result: Record<string, number> = {};

  NOTE_NAMES_WITH_OCTAVE.forEach((noteName, index) => {
    result[noteName] = NOTE_FREQUENCIES[index];
  });

  return result;
}

// Pre-computed maps for quick lookups
export const noteNameToFreq = createNoteNameToFreqMap();
export const noteNamesToPeriod = Object.fromEntries(
  Object.entries(noteNameToFreq).map(([note, freq]) => [note, 1 / freq])
) as Record<string, number>;
