import { KeyMap } from './keyboard-types';

/**
 * Generate a keymap from a base note and scale intervals
 */
export function generateKeymap(config: {
  baseNote: number;
  scale: number[]; // Semitone intervals from base note
}): KeyMap {
  const { baseNote, scale } = config;

  // Standard QWERTY key layout (your existing pattern)
  const keys = [
    'KeyZ',
    'KeyS',
    'KeyX',
    'KeyD',
    'KeyC',
    'KeyV',
    'KeyG',
    'KeyB',
    'KeyH',
    'KeyN',
    'KeyJ',
    'KeyM',
    'Comma',
    'KeyL',
    'Period',
    'Semicolon',
    'Slash',
    'KeyQ',
    'Digit2',
    'KeyW',
    'Digit3',
    'KeyE',
    'KeyR',
    'Digit5',
    'KeyT',
    'Digit6',
    'KeyY',
    'Digit7',
    'KeyU',
    'KeyI',
    'Digit9',
    'KeyO',
    'Digit0',
    'KeyP',
    'BracketLeft',
    'Equal',
    'BracketRight',
  ];

  const keymap: KeyMap = {};

  keys.forEach((key, index) => {
    const scaleIndex = index % scale.length;
    const octave = Math.floor(index / scale.length);
    const midiNote = baseNote + octave * 12 + scale[scaleIndex];

    keymap[key as keyof KeyMap] = midiNote;
  });

  return keymap;
}

// Usage examples:
export const pentatonicKeymap = generateKeymap({
  baseNote: 48, // C3
  scale: [0, 2, 4, 7, 9], // Major pentatonic
});

export const chromaticKeymap = generateKeymap({
  baseNote: 48,
  scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // All semitones
});

export const majorScaleKeymap = generateKeymap({
  baseNote: 60, // C4
  scale: [0, 2, 4, 5, 7, 9, 11], // Major scale
});
