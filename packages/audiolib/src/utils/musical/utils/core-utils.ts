// Core utility functions that don't depend on other modules
// These can be used by both constants and other utility functions

/**
 * Converts a MIDI note number to frequency in Hz
 */
export function midiToFrequency(midiNote: number, a4Frequency = 440): number {
  return a4Frequency * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Converts a frequency in Hz to a MIDI note number
 */
export function frequencyToMidi(frequency: number, a4Frequency = 440): number {
  return Math.round(12 * Math.log2(frequency / a4Frequency) + 69);
}

/**
 * Generates frequencies for all notes in the specified range
 */
export function generateNoteFrequencies(
  startOctave = 0,
  endOctave = 9,
  a4Frequency = 440,
  precision = 4
): number[] {
  const frequencies: number[] = [];
  const semitoneRatio = Math.pow(2, 1 / 12);
  const a4Index = 4 * 12 + 9;

  for (
    let i = startOctave * 12;
    i <= endOctave * 12 + (endOctave === 8 ? 0 : 11);
    i++
  ) {
    const frequency = a4Frequency * Math.pow(semitoneRatio, i - a4Index);
    frequencies.push(Number(frequency.toFixed(precision)));
  }

  return frequencies;
}
