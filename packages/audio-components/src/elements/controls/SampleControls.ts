// SampleControls.ts
import van, { State } from '@repo/vanjs-core';
import { defineElement } from '../elementRegistry.ts';
import { createSliderGSAP } from '../primitives/createSliderGSAP';
import { KnobElement } from '../primitives/KnobElement.ts';

const { div } = van.tags;

export const SampleControls = (
  loopStart: State<number>,
  loopEnd: State<number>,
  startPoint: State<number>,
  endPoint: State<number>
) => {
  defineElement('knob-element', KnobElement);
  const knobTag = van.tags['knob-element'];

  const initialLoopEnd = loopEnd.val;
  const loopEndPointSliderState = van.state(initialLoopEnd); // Store the slider's base value
  const loopEndOffset = van.state(0);

  // Update loopEnd when either loopPoint or offset slider changes
  van.derive(() => {
    const proposedLoopEnd = loopEndPointSliderState.val - loopEndOffset.val;
    const minLoopEnd = loopStart.val + 0.0001;
    loopEnd.val = Math.max(proposedLoopEnd, minLoopEnd);
  });

  // TODO: IDEA -> Cranker is OFF at min pos, subsequent positions correspond to allowed periods.
  // (maybe even gsap can animate smoothly to them and replace some of the macroparam logic)

  const loopDurationCranker = () =>
    knobTag({
      'min-value': '0',
      'max-value': '0.025',
      'snap-increment': '0.0001',
      width: '45',
      height: '45',
      value: () => loopEndOffset.val.toString(),
      style: 'margin-top: 10px;',
      class: 'cranker',
      'onknob-change': (e: CustomEvent) => {
        loopEndOffset.val = Math.max(0, e.detail.value);
      },
    });

  const controls = div(
    { style: 'display: flex; flex-direction: column;' },

    // Note: LoopPoint and Trim sliders use normalized range: 0 to 1
    div(
      {
        style:
          'display: flex; place-items: center; column-gap: 0.5rem; margin-top: 10px;',
      },
      createSliderGSAP('Loop', loopStart, loopEndPointSliderState),
      loopDurationCranker()
    ),
    div({ style: '' }, createSliderGSAP('Trim', startPoint, endPoint))
  );

  return controls;
};

// import { createTwoThumbSlider } from '../primitives/createTwoThumbSlider';
// createTwoThumbSlider('Loop', loopStart, loopEnd, 0.0001, 1, 0.001, 0.002),
// createTwoThumbSlider('Trim', startPoint, endPoint, 0, 1, 0.001, 0.03)

// const loopPointSlider = () =>
//   div(
//     {
//       style: 'display: flex; align-items: center; column-gap: 0.5rem;',
//     },
//     label('Loop:'),
//     van.tags['slider-gsap']({
//       'onrange-change': (e: CustomEvent) => {
//         loopStart.val = e.detail.min;
//         loopEndPointSliderState.val = e.detail.max;
//       },
//     })
//   );
