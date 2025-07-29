// AudioControls.ts
import van, { type State } from '@repo/vanjs-core';
import { createCheckbox } from '../primitives/createInputEl';
import { UNICODES } from '../../utils/unicodes';

const { div } = van.tags;

export const InputControls = (
  keyboardEnabled: State<boolean>,
  midiEnabled: State<boolean>,
  keysSvg: any,
  midiSvg: any
) =>
  div(
    { style: 'display: flex; gap: 10px;' },
    createCheckbox(keysSvg, keyboardEnabled),
    createCheckbox(midiSvg, midiEnabled)
  );

export const LoopHoldControls = (
  loopEnabled: State<boolean>,
  loopLocked: State<boolean>,
  holdLocked: State<boolean>,
  icons: any
) =>
  div(
    { style: 'display: flex; gap: 10px;' },
    createCheckbox(
      () => (loopEnabled.val || loopLocked.val ? icons.loopOn : icons.loopOff),
      loopLocked,
      {
        unchecked: UNICODES.unlocked,
        checked: UNICODES.locked,
      }
    ),
    createCheckbox('Hold', holdLocked, {
      unchecked: UNICODES.unlocked,
      checked: UNICODES.locked,
    })
  );
