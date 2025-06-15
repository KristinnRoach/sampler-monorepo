/**
 * Validates if a number is a valid MIDI value (0-127)
 */
export function isMidiValue(value?: number): boolean {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 127
  );
}

/**
 * Converts a MIDI note to a playback rate relative to a base note
 */
export function midiToPlaybackRate(
  midiNote: number,
  baseNote: number = 60
): number {
  return Math.pow(2, (midiNote - baseNote) / 12);
}

/**
 * Converts a MIDI note to a detune value in cents relative to a base note
 */
export function midiToDetune(midiNote: number, baseNote: number = 60): number {
  return (midiNote - baseNote) * 100;
}

/**
 * Normalizes a MIDI value (0-127) to a range of 0-1
 */
export function normalizeMidi(midiValue: number): number {
  return midiValue / 127;
}

/**
 * Converts a normalized value (0-1) to a MIDI value (0-127)
 */
export function denormalizeMidi(normalizedValue: number): number {
  return Math.round(normalizedValue * 127);
}
