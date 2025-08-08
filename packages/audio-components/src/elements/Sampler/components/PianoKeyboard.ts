import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import '../../controls/webaudio-controls/webaudio-keyboard';
import { getSampler } from '../SamplerRegistry';
import {
  COMPONENT_STYLE,
  CONTROL_ROW_STYLE,
  SMALL_BUTTON_STYLE,
  DISABLED_STYLE,
} from '../../../shared/styles/component-styles';

import KeyMaps from '@/shared/keyboard/keyboard-keymaps';
import { KeymapSelect } from './SamplerSelectFactory';

const { div, button } = van.tags;

export const PianoKeyboard = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const width = attributes.attr('width', '300');
  const height = attributes.attr('height', '60');
  const enabled = van.state(true);

  // Sync with computer keyboard keymap and octave
  const currentKeymap = van.state(KeyMaps.default);
  const octaveOffset = van.state(0);
  const MAX_OCT_SHIFT = 2;
  const MIN_OCT_SHIFT = -2;

  const keyboard = document.createElement('webaudio-keyboard') as any;

  // Keep keyboard attribute disabled (default) so we handle keyboard events ourselves

  const getDisplayRange = () => {
    // Get the actual note range from the current keymap
    const notes = Object.values(currentKeymap.val).filter(Boolean) as number[];
    if (notes.length === 0) {
      // Fallback to default range if no keymap
      const displayMin = 48 + octaveOffset.val * 12; // C3 base
      return { min: displayMin, keys: 25 }; // 2 octaves
    }

    // Use keymap range + octave offset
    const keymapMin = Math.min(...notes);
    const keymapMax = Math.max(...notes);
    const displayMin = keymapMin + octaveOffset.val * 12;
    const keymapSpan = keymapMax - keymapMin + 1;

    return { min: displayMin, keys: Math.max(keymapSpan, 25) };
  };

  // Reactive updates
  van.derive(() => {
    const { min, keys } = getDisplayRange();
    keyboard.setAttribute('width', width.val);
    keyboard.setAttribute('height', height.val);
    keyboard.setAttribute('min', min.toString());
    keyboard.setAttribute('keys', keys.toString());
  });

  // Handle mouse/touch events only
  const handlePianoClick = (event: any) => {
    if (!enabled.val) return;
    const sampler = getSampler(targetNodeId.val);
    if (!sampler) return;

    const [noteState, noteNumber] = event.note;

    const midiNote = noteNumber + 12 * octaveOffset.val;

    if (noteState === 1) {
      sampler.play(midiNote);
    } else {
      sampler.release(midiNote);
    }
  };

  const handleOctaveChange = (direction: number) => {
    const newOct = octaveOffset.val + direction;
    if (newOct >= MIN_OCT_SHIFT && newOct <= MAX_OCT_SHIFT) {
      octaveOffset.val += direction;
    }
  };

  keyboard.addEventListener('pointer', handlePianoClick);

  van.derive(() => {
    const disabledStyles = enabled.val ? '' : DISABLED_STYLE;
    keyboard.style.cssText = disabledStyles;
  });

  attributes.mount(() => {
    // Sync octave changes from ComputerKeyboard
    const handleKeymapChange = (e: CustomEvent) => {
      if (
        e.detail.targetNodeId === targetNodeId.val ||
        !e.detail.targetNodeId
      ) {
        // Sync keymap and octave offset
        if (e.detail.keymap) {
          currentKeymap.val = e.detail.keymap;
        }
        if (e.detail.octaveOffset !== undefined) {
          octaveOffset.val = e.detail.octaveOffset;
        }
      }
    };

    // Listen for computer keyboard events to sync visual feedback
    const handleKeyboardEvents = (e: KeyboardEvent) => {
      // Early exit if component is disabled or targetNodeId is empty
      if (!enabled.val || !targetNodeId.val) return;
      if (e.repeat) return;

      const midiNote = currentKeymap.val[e.code];
      if (!midiNote) return;

      const adjustedMidiNote = midiNote + octaveOffset.val * 12;

      // Check if this note is within the piano keyboard's visible range
      const { min, keys } = getDisplayRange();
      if (adjustedMidiNote >= min && adjustedMidiNote < min + keys) {
        // Sync visual feedback with computer keyboard
        const isKeyDown = e.type === 'keydown';
        // Add safety check for keyboard element
        if (keyboard && typeof keyboard.setNote === 'function') {
          keyboard.setNote(isKeyDown ? 1 : 0, adjustedMidiNote);
        }
      }
    };

    document.addEventListener('keydown', handleKeyboardEvents);
    document.addEventListener('keyup', handleKeyboardEvents);
    document.addEventListener(
      'keymap-changed',
      handleKeymapChange as EventListener
    );
    return () => {
      keyboard.removeEventListener('pointer', handlePianoClick);
      document.removeEventListener('keydown', handleKeyboardEvents);
      document.removeEventListener('keyup', handleKeyboardEvents);
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
    // TODO: Remove or refactor keymap / oct controls !
    div(
      {
        style: CONTROL_ROW_STYLE,
      },
      button(
        {
          onclick: () => handleOctaveChange(-1),
          style: SMALL_BUTTON_STYLE,
        },
        '<'
      ),
      div(() => `Oct: ${octaveOffset.val >= 0 ? '+' : ''}${octaveOffset.val}`),
      button(
        {
          onclick: () => handleOctaveChange(1),
          style: SMALL_BUTTON_STYLE,
        },
        '>'
      ),
      KeymapSelect({
        attr: (name: string, defaultValue?: string) => {
          if (name === 'target-node-id') return targetNodeId;
          if (name === 'show-label') return van.state('true');
          return van.state(defaultValue || '');
        },
      } as ElementProps)
    ),
    keyboard
  );
};
