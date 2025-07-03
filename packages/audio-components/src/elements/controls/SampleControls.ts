// SampleControls.ts
import van, { State } from '@repo/vanjs-core';
import { createTwoThumbSlider } from '../primitives/createTwoThumbSlider';

const { div } = van.tags;

export const SampleControls = (
  loopStart: State<number>,
  loopEnd: State<number>,
  startPoint: State<number>,
  endPoint: State<number>
) => {
  const controls = div(
    { style: 'display: flex; flex-direction: column;' },

    // Note: sliders use normalized range: 0 to 1
    createTwoThumbSlider('Loop', loopStart, loopEnd, 0, 1, 0.001, 0.001),
    createTwoThumbSlider('Trim', startPoint, endPoint, 0, 1, 0.001, 0.03)
  );

  return controls;
};
