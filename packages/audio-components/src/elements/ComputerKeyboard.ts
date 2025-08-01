// ComputerKeyboard.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import {
  keyboardEnabledInstruments,
  enableComputerKeyboard,
  disableComputerKeyboard,
  pressedKeys,
} from '../shared/keyboard/keyboard-state';
import KeyMaps from '@/shared/keyboard/keyboard-keymaps';
import { getSampler } from '../SamplerRegistry';
import {
  COMPONENT_STYLE,
  BUTTON_STYLE,
  BUTTON_ACTIVE_STYLE,
} from './ComponentStyles';

const { div, button } = van.tags;

export const ComputerKeyboard = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const enabled = van.state(true);
  const currentKeymap = van.state(KeyMaps.default);
  const loopEnabled = van.state(false);
  const holdEnabled = van.state(false);

  let spacePressed = false;
  let keyHandlersAttached = false;

  const keyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;

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

    pressedKeys.add(e.code);
    sampler.play(midiNote);
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

    sampler.release(midiNote);
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

  return div(
    {
      class: 'computer-keyboard-control',
      style: COMPONENT_STYLE,
    },
    div('Computer Keyboard'),
    button(
      {
        onclick: () => (enabled.val = !enabled.val),
        style: () =>
          `${BUTTON_STYLE} ${enabled.val ? BUTTON_ACTIVE_STYLE : ''}`,
      },
      () => (enabled.val ? 'ON' : 'OFF')
    ),
    div(
      () => `Loop: ${loopEnabled.val ? 'ON' : 'OFF'}`,
      ' | ',
      () => `Hold: ${holdEnabled.val ? 'ON' : 'OFF'}`
    )
  );
};
