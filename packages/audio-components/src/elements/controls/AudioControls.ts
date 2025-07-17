// AudioControls.ts
import van, { type State } from '@repo/vanjs-core';
import { createCheckbox, createSlider } from '../primitives/createInputEl';
import { UNICODES } from '../../utils/unicodes';

const { div } = van.tags;

export const VolumeSlider = (volume: State<number>) => {
  return createSlider('Volume', volume, 0, 1, 0.001);
};

export const ReverbMixSlider = (reverbMix: State<number>) => {
  return createSlider('Reverb', reverbMix, 0, 1, 0.01);
};

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

export const FilterSliders = (
  lpfFreq: State<number>,
  hpfFreq: State<number>
) => {
  return div(
    {
      class: 'filter-controls',
      style: 'display: flex; flex-direction: column; gap: 10px;',
    },
    createSlider('HighCut', lpfFreq, 20, 20000, 1), // , true, ' Hz', 1), -> displays the value in Hz
    createSlider('LowCut', hpfFreq, 20, 20000, 1) // , true, ' Hz', 1)
  );
};

export const AREnvSliders = (attack: State<number>, release: State<number>) =>
  div(
    { style: 'display: flex; flex-direction: column; gap: 0.5rem;' },
    createSlider('Attack', attack, 0, 1, 0.001),
    createSlider('Release', release, 0, 2, 0.01)
  );
