import { KeyMap } from './keyboard-types';

/**
 * Default keyboard-to-MIDI note mapping for audio input.
 * Provides a "two-story" piano-like layout across the QWERTY keyboard.
 */
export const defaultKeymap: KeyMap = {
  KeyZ: 48,
  KeyS: 49,
  KeyX: 50,
  KeyD: 51,
  KeyC: 52,
  KeyV: 53,
  KeyG: 54,
  KeyB: 55,
  KeyH: 56,
  KeyN: 57,
  KeyJ: 58,
  KeyM: 59,
  Comma: 60,
  KeyL: 61,
  Period: 62,
  Semicolon: 63,
  Slash: 64,
  KeyQ: 60,
  Digit2: 61,
  KeyW: 62,
  Digit3: 63,
  KeyE: 64,
  KeyR: 65,
  Digit5: 66,
  KeyT: 67,
  Digit6: 68,
  KeyY: 69,
  Digit7: 70,
  KeyU: 71,
  KeyI: 72,
  Digit9: 73,
  KeyO: 74,
  Digit0: 75,
  KeyP: 76,
  BracketLeft: 77,
  Equal: 78,
  BracketRight: 79,

  // Numpad:
  Numpad1: 60,
  Numpad2: 62,
  Numpad3: 64,
  Numpad4: 65,
  Numpad5: 67,
  Numpad6: 69,
  Numpad7: 71,
  Numpad8: 72,
  Numpad9: 74,
} as const;

/**
 * Generate a keymap from a base note and scale intervals
 */
export function generateKeymap(config: {
  baseNote: number;
  scale: number[]; // Semitone intervals from base note
}): KeyMap {
  const { baseNote, scale } = config;

  // Fourth row: 1 to - (top row)
  const fourthRow = [
    'Digit1',
    'Digit2',
    'Digit3',
    'Digit4',
    'Digit5',
    'Digit6',
    'Digit7',
    'Digit8',
    'Digit9',
    'Digit0',
    'Minus',
    'Equal',
  ];

  // Third row: q to '
  const thirdRow = [
    'KeyQ',
    'KeyW',
    'KeyE',
    'KeyR',
    'KeyT',
    'KeyY',
    'KeyU',
    'KeyI',
    'KeyO',
    'KeyP',
    'BracketLeft',
    'BracketRight',
  ];

  // Second row: a to + (fixed the order)
  const secondRow = [
    'KeyA',
    'KeyS',
    'KeyD',
    'KeyF',
    'KeyG',
    'KeyH',
    'KeyJ',
    'KeyK',
    'KeyL',
    'Semicolon',
    'Quote',
    'Backslash',
  ];

  // First row: z to þ (bottom row)
  const firstRow = [
    'KeyZ',
    'KeyX',
    'KeyC',
    'KeyV',
    'KeyB',
    'KeyN',
    'KeyM',
    'Comma',
    'Period',
    'Slash',
  ];

  const numpad = [
    'Numpad1',
    'Numpad2',
    'Numpad3',
    'Numpad4',
    'Numpad5',
    'Numpad6',
    'Numpad7',
    'Numpad8',
    'Numpad9',
  ];

  const keymap: KeyMap = {};

  // Map each row, with each row one octave higher
  [firstRow, secondRow, thirdRow, fourthRow].forEach((row, rowIndex) => {
    const rowBaseNote = baseNote + rowIndex * 12; // Each row +12 semitones (1 octave)

    row.forEach((key, keyIndex) => {
      const scaleIndex = keyIndex % scale.length;
      const octave = Math.floor(keyIndex / scale.length);
      const midiNote = rowBaseNote + octave * 12 + scale[scaleIndex];

      keymap[key as keyof KeyMap] = midiNote;
    });
  });

  numpad.forEach((key, keyIndex) => {
    const scaleIndex = keyIndex % scale.length;
    const octaveOffset = Math.floor(keyIndex / scale.length);
    const octave = 3;
    const numpadBaseNote = baseNote + octave * 12;
    const midiNote = numpadBaseNote + octaveOffset * 12 + scale[scaleIndex];

    keymap[key as keyof KeyMap] = midiNote;
  });

  return keymap;
}

// Some scales:
export const majorKeymap = generateKeymap({
  baseNote: 24,
  scale: [0, 2, 4, 5, 7, 9, 11],
});

export const minorKeymap = generateKeymap({
  baseNote: 24,
  scale: [0, 2, 3, 5, 7, 8, 10],
});

export const pentatonicKeymap = generateKeymap({
  baseNote: 32,
  scale: [0, 2, 4, 7, 9], // Major pentatonic
});

export const chromaticKeymap = generateKeymap({
  baseNote: 48,
  scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // All semitones
});

const KeyMaps = {
  default: defaultKeymap,
  major: majorKeymap,
  minor: minorKeymap,
  pentatonic: pentatonicKeymap,
  chromatic: chromaticKeymap,
};

export default KeyMaps;

/** Octaves reference
    C0	12
    C1	24
    C2	36
    C3	48
    C4	60
    C5	72
    C6	84
    C7	96
    C8	108
 */
