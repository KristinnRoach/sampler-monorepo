// SampleControls.ts
import van, { State } from '@repo/vanjs-core';
import { defineElement } from '../elementRegistry.ts';
import { mapToRange, clamp } from '@/utils/math-utils.ts';
import { createSliderGSAP } from '../primitives/createSliderGSAP.ts';
import {
  KnobElement,
  type KnobChangeEventDetail,
} from '../primitives/KnobElement.ts';

export const SampleControls = (
  loopStartSeconds: State<number>,
  loopEndSeconds: State<number>,
  loopRampSeconds: State<number>,
  startPointSeconds: State<number>,
  endPointSeconds: State<number>,
  sampleDurationSeconds: State<number>
) => {
  const SAFE_END_OFFSET = 0.001; // TODO: proper robust fix

  // Must use rawVal to avoid creating dependencies!
  const initialLoopEnd = loopEndSeconds.rawVal - SAFE_END_OFFSET;
  let initialThumbDistance = loopEndSeconds.rawVal - loopStartSeconds.rawVal;

  const { div } = van.tags;
  defineElement('knob-element', KnobElement);

  const loopEndSliderThumb = van.state(initialLoopEnd);
  let loopEndKnobOffset = van.state(0);

  const { container: loopSliderContainer, sliderElement: loopSliderEl } =
    createSliderGSAP(
      'Trim',
      loopStartSeconds,
      loopEndSliderThumb,
      {
        min: 0,
        max: sampleDurationSeconds.rawVal - SAFE_END_OFFSET,
      },
      loopRampSeconds
    );

  const loopEndOffsetKnob = document.createElement(
    'knob-element'
  ) as HTMLElement;
  loopEndOffsetKnob.setAttribute('min-value', '0');
  loopEndOffsetKnob.setAttribute('max-value', initialThumbDistance.toString());
  loopEndOffsetKnob.setAttribute('snap-increment', '0.0001');
  loopEndOffsetKnob.setAttribute('width', '45');
  loopEndOffsetKnob.setAttribute('height', '45');
  loopEndOffsetKnob.setAttribute('default-value', '0');

  loopEndOffsetKnob.setAttribute('curve', '0.1');

  loopEndOffsetKnob.style.marginTop = '10px';
  loopEndOffsetKnob.className = 'cranker';

  (loopEndOffsetKnob as HTMLElement).addEventListener(
    'knob-change',
    (e: CustomEvent) => {
      if (!loopEndOffsetKnob) return;
      const msg: KnobChangeEventDetail = e.detail;
      loopEndKnobOffset.val = msg.value;
    }
  );

  const knobMaxValue = van.derive(() => {
    const thumbDistance = loopEndSliderThumb.val - loopStartSeconds.val;
    return Math.max(thumbDistance, 0.001);
  });

  van.derive(() => {
    loopEndOffsetKnob.setAttribute('max-value', knobMaxValue.val.toString());
  });

  // Update loopEnd when either loopPoint thumb or knob offset changes
  // van.derive(() => {
  //   loopEndSeconds.val = Math.max(
  //     loopStartSeconds.rawVal + 0.001,
  //     loopEndSliderThumb.val - loopEndKnobOffset.val
  //   );
  // });

  van.derive(() => {
    const newLoopEnd = Math.max(
      loopStartSeconds.rawVal + 0.001,
      loopEndSliderThumb.val - loopEndKnobOffset.val
    );

    loopEndSeconds.val = newLoopEnd;

    // If loop end is less than loop start, also update loop start
    if (newLoopEnd < loopStartSeconds.val) {
      loopStartSeconds.val = Math.max(0, newLoopEnd - 0.001);
    }
  });

  // van.derive(() => (startPointSeconds.val = loopStartSeconds.val));
  // van.derive(() => (endPointSeconds.val = loopEndSeconds.val));

  const controls = div(
    { style: 'display: flex; flex-direction: column;' },

    // Note: Time based sliders use absolute time in seconds
    div(
      {
        style:
          'display: flex; place-items: center; column-gap: 0.5rem; margin-top: 10px;',
      },
      loopSliderContainer,
      loopEndOffsetKnob
    )
    // div({ style: '' }, trimSliderContainer) // Currently using same slider for loop and trim points
  );

  return controls;
};

// Ignore comments below:
// !? IDEA -> Cranker is OFF at min pos, subsequent positions correspond to allowed periods.
// (maybe even gsap can animate smoothly to them and replace some of the macroparam logic)
// const { container: trimSliderContainer, sliderElement: trimSliderEl } =
//   createSliderGSAP('Trim', startPointSeconds, endPointSeconds, {
//     min: 0,
//     max: sampleDurationSeconds.rawVal,
//   });
