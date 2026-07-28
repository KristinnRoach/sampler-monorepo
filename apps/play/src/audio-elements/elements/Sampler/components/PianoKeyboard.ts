import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import '../../controls/webaudio-controls/webaudio-keyboard';
import { getSamplePlayer } from '../../../../App';
import {
  COMPONENT_STYLE,
  DISABLED_STYLE,
} from '../../../shared/styles/component-styles';

import KeyMaps, {
  DEFAULT_KEYMAP_KEY,
} from '@/shared/keyboard/keyboard-keymaps';

const { div } = van.tags;
const MOBILE_KEY_COUNT = 13;
const MOBILE_MIN_NOTE = 48; // C3

export const PianoKeyboard = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const width = attributes.attr('width', '300');
  const height = attributes.attr('height', '60');
  const enabled = van.state(true);

  // Sync with computer keyboard keymap and octave
  const currentKeymap = van.state(KeyMaps[DEFAULT_KEYMAP_KEY]);
  const octaveOffset = van.state(0);
  const rootNote = van.state<
    'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'
  >('C');
  const mobileQuery = window.matchMedia('(max-width: 600px)');
  const isMobile = van.state(mobileQuery.matches);

  // Helper: get semitone offset from C
  const getRootNoteOffset = (note: string) => {
    const ROOT_NOTES = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ];
    return ROOT_NOTES.indexOf(note);
  };

  const keyboard = document.createElement('webaudio-keyboard') as any;

  const getDisplayRange = () => {
    const visibleKeys = isMobile.val ? MOBILE_KEY_COUNT : 25;

    // Get the actual note range from the current keymap
    const notes = Object.values(currentKeymap.val).filter(Boolean) as number[];
    const rootOffset = getRootNoteOffset(rootNote.val);
    if (notes.length === 0) {
      // Fallback to default range if no keymap
      const displayMin =
        MOBILE_MIN_NOTE + octaveOffset.val * 12 + rootOffset;
      return { min: displayMin, keys: visibleKeys };
    }

    // A compact keyboard should begin no lower than C3, irrespective of scale.
    const keymapMin = Math.min(...notes);
    const baseNote = isMobile.val
      ? Math.max(keymapMin, MOBILE_MIN_NOTE)
      : keymapMin;
    const displayMin = baseNote + octaveOffset.val * 12 + rootOffset;

    return { min: displayMin, keys: visibleKeys };
  };

  // Reactive updates
  van.derive(() => {
    const { min, keys } = getDisplayRange();
    keyboard.width = width.val;
    keyboard.height = height.val;
    keyboard.min = min;
    keyboard.keys = keys;
  });

  // Handle mouse/touch events only
  const handlePianoClick = (event: any) => {
    if (!enabled.val) return;
    const sampler = getSamplePlayer();
    if (!sampler) return;

    const [noteState, noteNumber] = event.note;
    if (noteState === 1) {
      sampler.play(noteNumber);
    } else {
      sampler.release(noteNumber);
    }
  };

  keyboard.addEventListener('pointer', handlePianoClick);

  van.derive(() => {
    const disabledStyles = enabled.val ? '' : DISABLED_STYLE;
    keyboard.style.cssText = disabledStyles;
  });

  attributes.mount(() => {
    const handleViewportChange = (event: MediaQueryListEvent) => {
      isMobile.val = event.matches;
    };

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

    // Listen for root note changes
    const handleRootNoteChange = (e: CustomEvent) => {
      if (
        e.detail.targetNodeId === targetNodeId.val ||
        !e.detail.targetNodeId
      ) {
        if (e.detail.rootNote) {
          rootNote.val = e.detail.rootNote;
        }
      }
    };

    // Listen for computer keyboard events to sync visual feedback
    const handleKeyboardEvents = (e: KeyboardEvent) => {
      if (!enabled.val) return;
      if (e.repeat) return;

      const midiNote = currentKeymap.val[e.code];
      if (!midiNote) return;

      const adjustedMidiNote =
        midiNote + octaveOffset.val * 12 + getRootNoteOffset(rootNote.val);

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
    mobileQuery.addEventListener('change', handleViewportChange);
    document.addEventListener(
      'keymap-changed',
      handleKeymapChange as EventListener
    );
    document.addEventListener(
      'rootnote-changed',
      handleRootNoteChange as EventListener
    );
    return () => {
      keyboard.removeEventListener('pointer', handlePianoClick);
      document.removeEventListener('keydown', handleKeyboardEvents);
      document.removeEventListener('keyup', handleKeyboardEvents);
      mobileQuery.removeEventListener('change', handleViewportChange);
      document.removeEventListener(
        'keymap-changed',
        handleKeymapChange as EventListener
      );
      document.removeEventListener(
        'rootnote-changed',
        handleRootNoteChange as EventListener
      );
    };
  });

  return div(
    {
      class: 'piano-keyboard-control',
      style: COMPONENT_STYLE,
    },
    keyboard
  );
};
