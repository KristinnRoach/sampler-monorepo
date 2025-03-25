// src/input/KeyboardController.tsx

import { createEffect, onCleanup } from 'solid-js';
import { keymap } from './keymap.js';

interface Props {
  onNoteOn: (midiNote: number, velocity?: number) => void;
  onNoteOff: (midiNote: number) => void;
}

const KeyboardController = (props: Props) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return; // Ignore key repeat events
    const midiNote = keymap[e.code];

    if (midiNote) {
      props.onNoteOn(midiNote); // Todo: add velocity
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const midiNote = keymap[e.code];
    if (midiNote) {
      props.onNoteOff(midiNote);
    }
  };

  createEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    });
  });

  return null;
};

export default KeyboardController;
