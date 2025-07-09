// SampleControls.ts
import van, { State } from '@repo/vanjs-core';
import { defineElement } from '../elementRegistry.ts';
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
  // Must use rawVal to avoid creating dependencies!
  const initialLoopEnd = loopEndSeconds.rawVal;
  let initialThumbDistance = loopEndSeconds.rawVal - loopStartSeconds.rawVal;

  const { div } = van.tags;
  defineElement('knob-element', KnobElement);

  const minLoopDurationSec = 0.001;

  const loopEndSliderThumb = van.state(initialLoopEnd);
  let loopEndKnobOffset = van.state(0);

  const { container: loopSliderContainer, sliderElement: loopSliderEl } =
    createSliderGSAP(
      'Loop',
      loopStartSeconds,
      loopEndSliderThumb,
      {
        min: 0,
        max: sampleDurationSeconds.rawVal,
      },
      loopRampSeconds
    );

  const { container: trimSliderContainer, sliderElement: trimSliderEl } =
    createSliderGSAP('Trim', startPointSeconds, endPointSeconds, {
      min: 0,
      max: sampleDurationSeconds.rawVal,
    });

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

  // Update loopEnd when either loopPoint thumb or knob offset changes
  van.derive(() => {
    // Todo: make knob properly update loopEnd when rolling back to 0
    // console.log(
    //   'loopEndSliderThumb.val',
    //   loopEndSliderThumb.val,
    //   'loopEndSeconds.val',
    //   loopEndSeconds.val
    // );
    const proposedLoopEnd = loopEndSliderThumb.val - loopEndKnobOffset.val;
    const minLoopEnd = loopStartSeconds.val + minLoopDurationSec;
    loopEndSeconds.val = Math.max(proposedLoopEnd, minLoopEnd);
  });

  const knobMaxValue = van.derive(() => {
    const thumbDistance = loopEndSliderThumb.val - loopStartSeconds.val;
    return Math.max(thumbDistance, 0.001);
  });

  van.derive(() => {
    loopEndOffsetKnob.setAttribute('max-value', knobMaxValue.val.toString());
  });

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
    ),
    div({ style: '' }, trimSliderContainer)
  );

  return controls;
};

// !? IDEA -> Cranker is OFF at min pos, subsequent positions correspond to allowed periods.
// (maybe even gsap can animate smoothly to them and replace some of the macroparam logic)
