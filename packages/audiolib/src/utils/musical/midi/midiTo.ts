export function midiToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 60) / 12);
}

export function midiToPlaybackRate(
  midiNote: number,
  baseNote: number = 60
): number {
  return Math.pow(2, (midiNote - baseNote) / 12);
}

export function midiToDetune(midiNote: number, baseNote: number = 60): number {
  return (midiNote - baseNote) * 100;
}
