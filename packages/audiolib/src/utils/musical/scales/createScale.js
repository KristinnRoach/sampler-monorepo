import { ROOTS, NOTE_FREQUENCIES, SCALES, PERIODS, NOTES } from '@/constants';

// todo: Should return midinotes as well ?
// If not called often probly best to just get all the info in one place
// todo: convert to typescript
export function createScale(rootNote, scalePattern) {
  if (!ROOTS[rootNote] && ROOTS[rootNote] !== 0) {
    throw new Error(`Unknown root note: ${rootNote}`);
  }

  const rootIdx = ROOTS[rootNote];
  const frequencies = [];
  const periodsInSec = [];
  const noteNames = [];

  // Generate scale notes across all octaves
  for (let octave = 0; octave < 8; octave++) {
    scalePattern.forEach((interval) => {
      const absoluteIndex = octave * 12 + ((rootIdx + interval) % 12);

      if (absoluteIndex < NOTE_FREQUENCIES.length) {
        frequencies.push(NOTE_FREQUENCIES[absoluteIndex]);
        periodsInSec.push(PERIODS[absoluteIndex]);
        noteNames.push(NOTES.noteIndexToName[absoluteIndex]);
      }
    });
  }

  return {
    rootIdx,
    frequencies,
    periodsInSec,
    scalePattern,
    noteNames,
  };
}

// Usage examples:
//   export const CMajor = getScaleNotes('C major');
//   export const allCMajorFrequencies = CMajor.frequencies;
//   export const allCMajorPeriodsInSec = CMajor.periodsInSec;

// For other scales:
//   export const DMinor = getScaleNotes('D minor');
//   export const FSharpPentatonic = getScaleNotes('F# pentatonic');
