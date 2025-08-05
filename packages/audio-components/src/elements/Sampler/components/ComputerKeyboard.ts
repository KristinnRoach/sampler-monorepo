// ComputerKeyboard.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import {
  keyboardEnabledInstruments,
  enableComputerKeyboard,
  disableComputerKeyboard,
  pressedKeys,
} from '../../../shared/keyboard/keyboard-state';
import KeyMaps from '@/shared/keyboard/keyboard-keymaps';
import { getSampler } from '../../../SamplerRegistry';
import {
  COMPONENT_STYLE,
  CONTROL_GROUP_STYLE,
  SELECT_STYLE,
  HELP_TEXT_STYLE,
} from '../../../shared/styles/component-styles';

const { div, select, option } = van.tags;

export const ComputerKeyboard = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const enabled = van.state(true);
  const currentKeymap = van.state(KeyMaps.major);
  const octaveOffset = van.state(1); // todo: make 0 default work for major / minor
  const loopEnabled = van.state(false);
  const holdEnabled = van.state(false);
  const MAX_OCT_SHIFT = 3;
  const MIN_OCT_SHIFT = -3;

  let spacePressed = false;
  let keyHandlersAttached = false;

  // Broadcast keymap changes
  const broadcastKeymapChange = () => {
    document.dispatchEvent(
      new CustomEvent('keymap-changed', {
        detail: {
          keymap: currentKeymap.val,
          octaveOffset: octaveOffset.val,
          targetNodeId: targetNodeId.val,
        },
      })
    );
  };

  // Broadcast initial keymap and when it changes
  van.derive(() => {
    broadcastKeymapChange();
  });

  const handleOctaveChange = (direction: number) => {
    const newOct = octaveOffset.val + direction;
    if (newOct >= MIN_OCT_SHIFT && newOct <= MAX_OCT_SHIFT) {
      octaveOffset.val += direction;
    }
  };

  const keyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;

    if (e.code === 'Backquote') {
      e.preventDefault();
      if (e.shiftKey) handleOctaveChange(1);
      else handleOctaveChange(-1);
    }

    const sampler = getSampler(targetNodeId.val);
    if (!sampler || !enabled.val) return;

    const baseLoopEnabled = e.getModifierState('CapsLock');
    const baseHoldEnabled = e.shiftKey;

    if (e.code === 'Space') {
      spacePressed = true;
      e.preventDefault();
    }

    loopEnabled.val = baseLoopEnabled !== spacePressed;
    holdEnabled.val = baseHoldEnabled !== spacePressed;

    sampler.setLoopEnabled?.(loopEnabled.val);
    sampler.setHoldEnabled?.(holdEnabled.val);

    const midiNote = currentKeymap.val[e.code];
    if (!midiNote) return;

    const adjustedMidiNote = midiNote + octaveOffset.val * 12;

    pressedKeys.add(e.code);
    sampler.play(adjustedMidiNote);
  };

  const keyUp = (e: KeyboardEvent) => {
    const sampler = getSampler(targetNodeId.val);
    if (!sampler || !enabled.val) return;

    if (e.code === 'Space') {
      spacePressed = false;
      loopEnabled.val = e.getModifierState('CapsLock');
      holdEnabled.val = e.shiftKey;
      sampler.setLoopEnabled?.(loopEnabled.val);
      sampler.setHoldEnabled?.(holdEnabled.val);
    }

    const midiNote = currentKeymap.val[e.code];
    if (!midiNote) return;

    // Apply octave offset to the MIDI note
    const adjustedMidiNote = midiNote + octaveOffset.val * 12;

    sampler.release(adjustedMidiNote);
    pressedKeys.delete(e.code);
  };

  const updateKeyboardHandlers = () => {
    const sampler = getSampler(targetNodeId.val);

    if (sampler && enabled.val && !keyHandlersAttached) {
      document.addEventListener('keydown', keyDown);
      document.addEventListener('keyup', keyUp);
      enableComputerKeyboard(sampler.nodeId);
      keyHandlersAttached = true;
    } else if (!sampler || !enabled.val) {
      if (keyHandlersAttached) {
        document.removeEventListener('keydown', keyDown);
        document.removeEventListener('keyup', keyUp);
        if (sampler) disableComputerKeyboard(sampler.nodeId);
        keyHandlersAttached = false;
      }
    }
  };

  van.derive(updateKeyboardHandlers);

  const checkInterval = setInterval(() => {
    if (targetNodeId.val && !keyHandlersAttached && enabled.val) {
      updateKeyboardHandlers();
    }
  }, 500);

  attributes.mount(() => {
    setTimeout(updateKeyboardHandlers, 100);
    return () => {
      clearInterval(checkInterval);
      if (keyHandlersAttached) {
        document.removeEventListener('keydown', keyDown);
        document.removeEventListener('keyup', keyUp);
        const sampler = getSampler(targetNodeId.val);
        if (sampler) disableComputerKeyboard(sampler.nodeId);
      }
    };
  });

  // Available keymaps
  const keymapOptions = [
    { value: 'default', label: 'Default' },
    { value: 'major', label: 'Major Scale' },
    { value: 'minor', label: 'Minor Scale' },
    { value: 'pentatonic', label: 'Pentatonic' },
  ];

  return div(
    {
      class: 'computer-keyboard-control',
      style: COMPONENT_STYLE,
    },

    div(
      { style: CONTROL_GROUP_STYLE },
      'Keymap: ',
      select(
        {
          onchange: (e: Event) => {
            const target = e.target as HTMLSelectElement;
            const selectedKeymap = target.value as keyof typeof KeyMaps;
            currentKeymap.val = KeyMaps[selectedKeymap] || KeyMaps.default;
          },
          style: SELECT_STYLE,
        },
        ...keymapOptions.map((opt) => option({ value: opt.value }, opt.label))
      )
    ),

    div(
      () => `Loop: ${loopEnabled.val ? 'ON' : 'OFF'}`,
      ' | ',
      () => `Hold: ${holdEnabled.val ? 'ON' : 'OFF'}`
    ),

    div(
      { style: HELP_TEXT_STYLE },
      'CapsLock=Loop, Shift=Hold, Space=Override, </>=Octave'
    )
  );
};
