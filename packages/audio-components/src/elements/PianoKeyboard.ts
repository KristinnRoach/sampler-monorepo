// WebAudioKeyboard.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import './controls/webaudio-controls/webaudio-keyboard';
import { getSampler } from '../SamplerRegistry';
import { COMPONENT_STYLE } from './ComponentStyles';

const { div } = van.tags;

export const PianoKeyboard = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const width = attributes.attr('width', '300');
  const height = attributes.attr('height', '60');
  const minNote = attributes.attr('min-note', '37');
  const numKeys = attributes.attr('num-keys', '31');
  const enabled = van.state(true);

  const keyboard = document.createElement('webaudio-keyboard') as any;

  // Set initial attributes
  keyboard.setAttribute('width', width.val);
  keyboard.setAttribute('height', height.val);
  keyboard.setAttribute('min', minNote.val);
  keyboard.setAttribute('keys', numKeys.val);

  // Update attributes reactively
  van.derive(() => {
    keyboard.setAttribute('width', width.val);
    keyboard.setAttribute('height', height.val);
    keyboard.setAttribute('min', minNote.val);
    keyboard.setAttribute('keys', numKeys.val);
  });

  // Handle keyboard events
  const handleKeyboardEvent = (event: any) => {
    if (!enabled.val) return;

    const sampler = getSampler(targetNodeId.val);
    if (!sampler) return;

    const [noteState, noteNumber] = event.note;

    if (noteState === 1) {
      sampler.play(noteNumber);
    } else {
      sampler.release(noteNumber);
    }
  };

  keyboard.addEventListener('pointer', handleKeyboardEvent);

  // Enable/disable interaction
  van.derive(() => {
    keyboard.style.opacity = enabled.val ? '1' : '0.5';
    keyboard.style.pointerEvents = enabled.val ? 'auto' : 'none';
  });

  attributes.mount(() => {
    return () => {
      keyboard.removeEventListener('pointer', handleKeyboardEvent);
    };
  });

  return div(
    {
      class: 'piano-keyboard-control',
      style: COMPONENT_STYLE,
    },
    div('Piano Keyboard'),
    keyboard
  );
};
