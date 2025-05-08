import { ROOTS, NOTE_FREQUENCIES, SCALES, PERIODS, NOTES } from '@/constants';

// todo: Should return midinotes as well ?
// If not called often probly best to just get all the info in one place
// todo: convert to typescript
export function createScale(
  rootNote,
  scalePattern,
  lowestOctave = 0,
  highestOctave = 8
) {
  if (!ROOTS[rootNote] && ROOTS[rootNote] !== 0) {
    throw new Error(`Unknown root note: ${rootNote}`);
  }

  const rootIdx = ROOTS[rootNote];
  const frequencies = [];
  const periodsInSec = [];
  const noteNames = [];

  // Generate scale notes, Hz and periods in seconds
  // across requested nr of octaves
  for (let octave = lowestOctave; octave <= highestOctave; octave++) {
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
