// SampleControls.ts
import van, { State } from '@repo/vanjs-core';
import { createSlider } from '../primitives/createInputEl';
import { createTwoThumbSlider } from '../primitives/createTwoThumbSlider';

const { div } = van.tags;

export const SampleControls = (
  loopStart: State<number>,
  loopEnd: State<number>,
  loopEndFineTune: State<number>,
  startOffset: State<number>,
  endOffset: State<number>,
  sampleDuration: State<number>
) => {
  const controls = div(
    { style: 'display: flex; flex-direction: column;' },
    createTwoThumbSlider(
      'Loop Range',
      loopStart,
      loopEnd,
      0,
      1, // normalized range: 0 to 1
      0.001,
      0.001
    ),

    createSlider('Periods', loopEndFineTune, 0, 100, 1, false, 'ms', 1)
    // createSlider('Start Offset', startOffset, 0, 1, 0.001),
    // createSlider('End Offset', endOffset, 0, 1, 0.001)
  );

  // Attach the fine-tune state to the DOM element for access
  (controls as any).loopEndFineTune = loopEndFineTune;

  return controls;
};
