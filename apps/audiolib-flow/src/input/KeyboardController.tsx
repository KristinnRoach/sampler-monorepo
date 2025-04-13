// src/input/KeyboardController.tsx
import React, { useEffect } from 'react';
import { keymap } from './keymap';

interface Props {
  onNoteOn: (midiNote: number, velocity?: number) => void; // (midiNote: number, velocity?: number) => void;
  onNoteOff: (midiNote: number) => void; // (midiNote: number) => void;
}

const KeyboardController: React.FC<Props> = (props) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Ignore key repeat events
      const midiNote = keymap[e.code];

      if (midiNote) {
        props.onNoteOn(midiNote); // add velocity later
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const midiNote = keymap[e.code];
      if (midiNote) {
        props.onNoteOff(midiNote); // midiNote
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [props]); // props is necessary

  return null;
};

export default KeyboardController;
