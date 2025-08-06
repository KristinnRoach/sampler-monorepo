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
import { getSampler } from '../SamplerRegistry';
import {
  COMPONENT_STYLE,
  HELP_TEXT_STYLE,
} from '../../../shared/styles/component-styles';

const { div } = van.tags;

export const ComputerKeyboard = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const enabled = van.state(true);
  const currentKeymap = van.state(KeyMaps.default);
  const octaveOffset = van.state(0); // todo: make 0 default work for major / minor
  const loopEnabled = van.state(false);
  const holdEnabled = van.state(false);
  const showUI = attributes.attr('show-ui', 'false'); // Hidden by default
  const MAX_OCT_SHIFT = 3;
  const MIN_OCT_SHIFT = -3;

  let spacePressed = false;
  let keyHandlersAttached = false;

  // Listen for keymap changes from the select component
  const handleKeymapChange = (e: CustomEvent) => {
    console.log('ComputerKeyboard: Received keymap change event:', {
      eventDetail: e.detail,
      myTargetNodeId: targetNodeId.val,
      willUpdate: e.detail.targetNodeId === targetNodeId.val || !e.detail.targetNodeId,
    });
    
    if (e.detail.targetNodeId === targetNodeId.val || !e.detail.targetNodeId) {
      if (e.detail.keymap) {
        console.log('ComputerKeyboard: Updating keymap from', currentKeymap.val, 'to', e.detail.keymap);
        currentKeymap.val = e.detail.keymap;
      }
      if (e.detail.octaveOffset !== undefined) {
        console.log('ComputerKeyboard: Updating octave offset to', e.detail.octaveOffset);
        octaveOffset.val = e.detail.octaveOffset;
      }
    }
  };

  const handleOctaveChange = (direction: number) => {
    const newOct = octaveOffset.val + direction;
    if (newOct >= MIN_OCT_SHIFT && newOct <= MAX_OCT_SHIFT) {
      octaveOffset.val += direction;

      // Broadcast octave changes to other components (like PianoKeyboard)
      document.dispatchEvent(
        new CustomEvent('keymap-changed', {
          detail: {
            keymap: currentKeymap.val,
            octaveOffset: octaveOffset.val,
            targetNodeId: targetNodeId.val,
          },
        })
      );
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
    // Listen for keymap changes from the select component
    document.addEventListener(
      'keymap-changed',
      handleKeymapChange as EventListener
    );

    setTimeout(updateKeyboardHandlers, 100);
    return () => {
      clearInterval(checkInterval);
      document.removeEventListener(
        'keymap-changed',
        handleKeymapChange as EventListener
      );
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
      style: showUI.val === 'true' ? COMPONENT_STYLE : 'display: none;',
    },

    // Only show UI elements if showUI is true
    ...(showUI.val === 'true'
      ? [
          div(
            () => `Loop: ${loopEnabled.val ? 'ON' : 'OFF'}`,
            ' | ',
            () => `Hold: ${holdEnabled.val ? 'ON' : 'OFF'}`
          ),

          div(
            { style: HELP_TEXT_STYLE },
            'CapsLock=Loop, Shift=Hold, Space=Override, </>=Octave'
          ),
        ]
      : [])
  );
};
