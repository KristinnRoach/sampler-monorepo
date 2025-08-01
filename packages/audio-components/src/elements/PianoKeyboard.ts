// WebAudioKeyboard.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import './controls/webaudio-controls/webaudio-keyboard';
import { getSampler } from '../SamplerRegistry';
import { COMPONENT_STYLE } from './ComponentStyles';
import KeyMaps from '@/shared/keyboard/keyboard-keymaps';

const { div, button } = van.tags;

export const PianoKeyboard = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const width = attributes.attr('width', '300');
  const height = attributes.attr('height', '60');
  const enabled = van.state(true);

  // Sync with current keymap from ComputerKeyboard
  const currentKeymap = van.state(KeyMaps.default);
  const octaveOffset = van.state(0); // -1, 0, +1, etc.

  const keyboard = document.createElement('webaudio-keyboard') as any;

  // Calculate keyboard range from keymap
  const getKeymapRange = () => {
    const notes = Object.values(currentKeymap.val).filter(Boolean) as number[];
    if (notes.length === 0) return { min: 60, max: 72 }; // Default C4-C5

    const min = Math.min(...notes) + octaveOffset.val * 12;
    const max = Math.max(...notes) + octaveOffset.val * 12;
    const span = max - min + 1;

    return { min, span };
  };

  // Update keyboard attributes reactively
  van.derive(() => {
    const { min, span } = getKeymapRange();

    keyboard.setAttribute('width', width.val);
    keyboard.setAttribute('height', height.val);
    keyboard.setAttribute('min', min.toString());
    keyboard.setAttribute('keys', span.toString());
  });

  // Handle keyboard events
  const handleKeyboardEvent = (event: any) => {
    if (!enabled.val) return;

    const sampler = getSampler(targetNodeId.val);
    if (!sampler) return;

    const [noteState, noteNumber] = event.note;
    // Apply octave offset to the actual MIDI note
    const adjustedNoteNumber = noteNumber + octaveOffset.val * 12;

    if (noteState === 1) {
      sampler.play(adjustedNoteNumber);
    } else {
      sampler.release(adjustedNoteNumber);
    }
  };

  // Handle octave controls
  const handleOctaveChange = (direction: number) => {
    octaveOffset.val += direction;
  };

  // Keyboard event listener for < and > keys
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Comma') {
      e.preventDefault();
      handleOctaveChange(-1);
    } else if (e.code === 'Period') {
      e.preventDefault();
      handleOctaveChange(1);
    }
  };

  keyboard.addEventListener('pointer', handleKeyboardEvent);

  // Enable/disable interaction
  van.derive(() => {
    keyboard.style.opacity = enabled.val ? '1' : '0.5';
    keyboard.style.pointerEvents = enabled.val ? 'auto' : 'none';
  });

  attributes.mount(() => {
    // Listen for keymap changes from ComputerKeyboard
    const handleKeymapChange = (e: CustomEvent) => {
      if (
        e.detail.targetNodeId === targetNodeId.val ||
        !e.detail.targetNodeId
      ) {
        currentKeymap.val = e.detail.keymap;
        // Sync octave offset from computer keyboard
        if (e.detail.octaveOffset !== undefined) {
          octaveOffset.val = e.detail.octaveOffset;
        }
      }
    };

    // Listen for octave key presses (as backup)
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener(
      'keymap-changed',
      handleKeymapChange as EventListener
    );

    return () => {
      keyboard.removeEventListener('pointer', handleKeyboardEvent);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener(
        'keymap-changed',
        handleKeymapChange as EventListener
      );
    };
  });

  return div(
    {
      class: 'piano-keyboard-control',
      style: COMPONENT_STYLE,
    },
    div(
      {
        style:
          'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;',
      },
      div('Piano Keyboard'),
      button(
        {
          onclick: () => handleOctaveChange(-1),
          style: 'padding: 0.25rem 0.5rem; font-size: 0.8rem;',
        },
        '< Oct'
      ),
      div(() => `Oct: ${octaveOffset.val >= 0 ? '+' : ''}${octaveOffset.val}`),
      button(
        {
          onclick: () => handleOctaveChange(1),
          style: 'padding: 0.25rem 0.5rem; font-size: 0.8rem;',
        },
        'Oct >'
      )
    ),
    keyboard,
    div(
      { style: 'font-size: 0.7rem; color: #666; margin-top: 0.25rem;' },
      'Use < and > keys for octave control'
    )
  );
};
