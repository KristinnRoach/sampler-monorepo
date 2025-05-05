// audiolib's predefined scale patterns
export const scales = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],

  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],

  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],

  lydian: [0, 2, 4, 6, 7, 9, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],

  locrian: [0, 1, 3, 5, 6, 8, 10],
  diminished: [0, 2, 3, 5, 6, 8, 9, 11],
  augmented: [0, 3, 4, 8, 9],

  major_pentatonic: [0, 2, 4, 7, 9],
  minor_pentatonic: [0, 2, 3, 7, 8],
  blues: [0, 3, 5, 6, 7, 10],

  whole_tone: [0, 2, 4, 6, 8, 10],
  // ... add more as needed
} as const;

// Generate frequencies algorithmically with adjustable precision
export function generateNoteFrequencies(
  startOctave = 0,
  endOctave = 8,
  a4Frequency = 440,
  precision = 2
): number[] {
  const frequencies: number[] = [];
  const semitoneRatio = Math.pow(2, 1 / 12);

  // A4 is 9 semitones above C4, and C4 is 4 octaves above C0
  const a4Index = 4 * 12 + 9;

  for (
    let i = startOctave * 12;
    i <= endOctave * 12 + (endOctave === 8 ? 0 : 11);
    i++
  ) {
    // Calculate frequency relative to A4 (440Hz)
    const frequency = a4Frequency * Math.pow(semitoneRatio, i - a4Index);
    frequencies.push(Number(frequency.toFixed(precision)));
  }

  return frequencies;
}

// Generate noteNameToFreq algorithmically
export function generateNoteNameToFreq(
  startOctave = 0,
  endOctave = 8,
  a4Frequency = 440,
  precision = 2
): Record<string, number> {
  const result: Record<string, number> = {};
  const semitoneRatio = Math.pow(2, 1 / 12);
  const a4Index = 4 * 12 + 9;

  const noteNames = [
    ['C'],
    ['C#', 'Db'],
    ['D'],
    ['D#', 'Eb'],
    ['E'],
    ['F'],
    ['F#', 'Gb'],
    ['G'],
    ['G#', 'Ab'],
    ['A'],
    ['A#', 'Bb'],
    ['B'],
  ];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    for (let semitone = 0; semitone < 12; semitone++) {
      // Skip notes after C8
      if (octave === 8 && semitone > 0) break;

      const absoluteIndex = octave * 12 + semitone;
      const frequency =
        a4Frequency * Math.pow(semitoneRatio, absoluteIndex - a4Index);
      const roundedFreq = Number(frequency.toFixed(precision));

      // Add all name variants for this note
      noteNames[semitone].forEach((noteName) => {
        result[`${noteName}${octave}`] = roundedFreq;
      });
    }
  }

  return result;
}

// Use the functions to generate the arrays and objects
export const noteToFreq = generateNoteFrequencies();
export const noteNameToFreq = generateNoteNameToFreq();

// Root note mapping (C-indexed)
export const rootNoteIdx = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
} as const;

export const noteNamesToPeriod = Object.fromEntries(
  Object.entries(noteNameToFreq).map(([note, freq]) => [note, 1 / freq])
) as { [K in keyof typeof noteNameToFreq]: number };

// Add this utility function
export function getNoteName(absoluteIndex: number): string {
  const octave = Math.floor(absoluteIndex / 12);
  const noteIndex = absoluteIndex % 12;

  // Get the first matching note name (preferring naturals/sharps over flats)
  const noteName =
    Object.entries(rootNoteIdx).find(
      ([_, idx]) => idx === noteIndex && !_.includes('b')
    )?.[0] || '';

  if (!noteName) {
    throw new RangeError(`Invalid note index: ${absoluteIndex}`);
  }
  return `${noteName}${octave}`;
}

// Export a pre-computed array for even faster lookup
export const noteIndexToName = Array.from(
  { length: noteToFreq.length },
  (_, i) => getNoteName(i)
);

export const allNotePeriodsInSec = noteToFreq.map((freq) => 1 / freq);
