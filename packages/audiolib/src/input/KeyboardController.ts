// src/components/input/KeyboardController.tsx

import { createEffect, onCleanup } from 'solid-js';
import { keymap } from './keymap';

interface Props {
  onNoteOn: (midiNote: number, velocity?: number) => void;
  onNoteOff: (midiNote: number) => void;
}

export const KeyboardController = (props: Props) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return; // Ignore key repeat events
    const midiNote = keymap[e.code];

    if (midiNote) {
      props.onNoteOn(midiNote, 100); // Todo: add velocity
      // console.log('Key pressed:', e.code, 'MIDI note:', midiNote);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const midiNote = keymap[e.code];
    if (midiNote) {
      props.onNoteOff(midiNote);
      // console.log('Key released:', e.code, 'MIDI note:', midiNote);
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
