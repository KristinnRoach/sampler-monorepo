// checkboxes.ts
import van, { type State } from '@repo/vanjs-core';
import {
  createCheckbox,
  LabelContent,
  StaticLabelContent,
} from '../primitives/createInputEl';
import { UNICODES } from '../../shared/utils/icons/unicodes';

const { div } = van.tags;

export const InputControls = (
  keyboardEnabled: State<boolean>,
  midiEnabled: State<boolean>,
  keysSvg: LabelContent,
  midiSvg: LabelContent
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
  icons: { loopOn: StaticLabelContent; loopOff: StaticLabelContent }
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
