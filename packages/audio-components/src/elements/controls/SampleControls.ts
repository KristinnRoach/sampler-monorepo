// SampleControls.ts
import van, { State } from '@repo/vanjs-core';
import { defineElement } from '../elementRegistry.ts';
import { createSliderGSAP } from '../primitives/createSliderGSAP.ts';
import {
  KnobElement,
  type KnobChangeEventDetail,
} from '../primitives/KnobElement.ts';

export const SampleControls = (
  loopStart: State<number>,
  loopEnd: State<number>,
  startPoint: State<number>,
  endPoint: State<number>
) => {
  // MUST use rawVal to avoid creating dependencies !!!
  const initialLoopEnd = loopEnd.rawVal;
  let initialThumbDistance = loopEnd.rawVal - loopStart.rawVal;

  const { div } = van.tags;
  defineElement('knob-element', KnobElement);

  const minLoopDurationNorm = 0.001;

  const loopEndSliderThumb = van.state(initialLoopEnd);
  let loopEndKnobOffset = van.state(0);

  const { container: loopSliderContainer, sliderElement: loopSliderEl } =
    createSliderGSAP('Loop', loopStart, loopEndSliderThumb);

  const { container: trimSliderContainer, sliderElement: trimSliderEl } =
    createSliderGSAP('Trim', startPoint, endPoint);

  const loopEndOffsetKnob = document.createElement(
    'knob-element'
  ) as HTMLElement;
  loopEndOffsetKnob.setAttribute('min-value', '0');
  loopEndOffsetKnob.setAttribute('max-value', initialThumbDistance.toString());
  loopEndOffsetKnob.setAttribute('snap-increment', '0.0001');
  loopEndOffsetKnob.setAttribute('width', '45');
  loopEndOffsetKnob.setAttribute('height', '45');
  loopEndOffsetKnob.setAttribute('default-value', '0');
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
    const proposedLoopEnd = loopEndSliderThumb.val - loopEndKnobOffset.val;
    const minLoopEnd = loopStart.val + minLoopDurationNorm;
    loopEnd.val = Math.max(proposedLoopEnd, minLoopEnd);
  });

  const knobMaxValue = van.derive(() => {
    const thumbDistance = loopEndSliderThumb.val - loopStart.val;
    return Math.max(thumbDistance, 0.001);
  });

  van.derive(() => {
    loopEndOffsetKnob.setAttribute('max-value', knobMaxValue.val.toString());
  });

  const controls = div(
    { style: 'display: flex; flex-direction: column;' },

    // Note: LoopPoint and Trim sliders use normalized range: 0 to 1
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
