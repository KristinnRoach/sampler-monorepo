import { allPianoFrequencies, rootNotes, SCALE_PATTERNS } from './NOTE_FREQ';

export const allNotePeriodsInSec = allPianoFrequencies.map((freq) => 1 / freq);

/** general function to get periods for any scale
 * root: "C" | "C#" | D | ... | "B"
 * scalePattern: e.g [0, 2, 4, 5, 7, 9, 11] for major
 */
export function getScale(rootNote, scalePattern) {
  if (!rootNotes[rootNote] && rootNotes[rootNote] !== 0) {
    throw new Error(`Unknown root note: ${rootNote}`);
  }

  const rootIndex = rootNotes[rootNote];
  const frequencies = [];
  const periodsInSec = [];

  // Generate scale notes across all octaves
  for (let octave = 0; octave < 8; octave++) {
    scalePattern.forEach((interval) => {
      const absoluteIndex = octave * 12 + ((rootIndex + interval) % 12);

      if (absoluteIndex < allPianoFrequencies.length) {
        frequencies.push(allPianoFrequencies[absoluteIndex]);
        periodsInSec.push(allNotePeriodsInSec[absoluteIndex]);
      }
    });
  }

  return {
    frequencies,
    periodsInSec,
  };
}

// Usage examples:
//   export const CMajor = getScaleNotes('C major');
//   export const allCMajorFrequencies = CMajor.frequencies;
//   export const allCMajorPeriodsInSec = CMajor.periodsInSec;

// For other scales:
//   export const DMinor = getScaleNotes('D minor');
//   export const FSharpPentatonic = getScaleNotes('F# pentatonic');
