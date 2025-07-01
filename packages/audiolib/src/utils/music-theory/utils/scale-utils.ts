import {
  NOTE_ROOTS,
  NOTE_FREQUENCIES,
  NOTE_PERIODS,
  NOTE_NAMES_WITH_OCTAVE,
  SCALE_PATTERNS,
} from '../constants';
import type { Scale } from '../types';

/**
 * Creates a scale with frequencies, periods, and note names
 */
export function createScale(
  rootNote: string,
  scalePattern: number[] | keyof typeof SCALE_PATTERNS,
  lowestOctave: number = 0,
  highestOctave: number = 8
): Scale {
  // Get the root note index
  if (
    !NOTE_ROOTS[rootNote as keyof typeof NOTE_ROOTS] &&
    NOTE_ROOTS[rootNote as keyof typeof NOTE_ROOTS] !== 0
  ) {
    throw new Error(`Unknown root note: ${rootNote}`);
  }

  // Handle scale pattern as string (predefined scale) or number[] (custom pattern)
  const patternSource =
    typeof scalePattern === 'string'
      ? SCALE_PATTERNS[scalePattern]
      : scalePattern;

  // Create a copy of the pattern to ensure it's mutable
  const pattern = [...patternSource];

  const rootIdx: number = NOTE_ROOTS[rootNote as keyof typeof NOTE_ROOTS];
  const frequencies: number[] = [];
  const periodsInSec: number[] = [];
  const noteNames: string[] = [];

  // Generate scale notes across requested octaves
  for (let octave = lowestOctave; octave <= highestOctave; octave++) {
    pattern.forEach((interval: number) => {
      const absoluteIndex = octave * 12 + ((rootIdx + interval) % 12);

      if (absoluteIndex < NOTE_FREQUENCIES.length) {
        frequencies.push(NOTE_FREQUENCIES[absoluteIndex]);
        periodsInSec.push(NOTE_PERIODS[absoluteIndex]);
        noteNames.push(NOTE_NAMES_WITH_OCTAVE[absoluteIndex]);
      }
    });
  }

  return {
    rootIdx,
    frequencies,
    periodsInSec,
    scalePattern: pattern,
    noteNames,
  };
}

/**
 * Gets a scale by name (e.g., "C major", "D minor")
 */
export function getScaleByName(scaleName: string): Scale {
  const parts = scaleName.split(' ');
  if (parts.length !== 2) {
    throw new Error(
      `Invalid scale name format: ${scaleName}. Expected "root scaletype" (e.g., "C major")`
    );
  }

  const [rootNote, scaleType] = parts;
  const scalePattern = SCALE_PATTERNS[scaleType as keyof typeof SCALE_PATTERNS];

  if (!scalePattern) {
    throw new Error(`Unknown scale type: ${scaleType}`);
  }

  // Create a copy of the pattern to ensure it's mutable
  return createScale(rootNote, [...scalePattern]);
}
