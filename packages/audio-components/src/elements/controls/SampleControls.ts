// SampleControls.ts
import van, { State } from '@repo/vanjs-core';
import { createSliderGSAP } from '../primitives/createSliderGSAP';
import '../primitives/KnobElement';

const { div, label } = van.tags;
const knobElement = van.tags['knob-element'];

export const SampleControls = (
  loopStart: State<number>,
  loopEnd: State<number>,
  startPoint: State<number>,
  endPoint: State<number>
) => {
  const initialLoopEnd = loopEnd.val;
  const loopEndPointSliderState = van.state(initialLoopEnd); // Store the slider's base value
  const loopEndOffset = van.state(0);

  // Update loopEnd when either loopPoint or offset slider changes
  van.derive(() => {
    const proposedLoopEnd = loopEndPointSliderState.val - loopEndOffset.val;
    const minLoopEnd = loopStart.val + 0.001;
    loopEnd.val = Math.max(proposedLoopEnd, minLoopEnd);
  });

  const loopPointSlider = () =>
    div(
      {
        style: 'display: flex; align-items: center; column-gap: 0.5rem;',
      },
      label('Loop:'),
      van.tags['slider-gsap']({
        'onrange-change': (e: CustomEvent) => {
          loopStart.val = e.detail.min;
          loopEndPointSliderState.val = e.detail.max;
        },
      })
    );

  const loopDurationCranker = () =>
    knobElement({
      'min-value': '0',
      'max-value': '0.5',
      'snap-increment': '0.001',
      width: '35',
      height: '35',
      value: () => loopEndOffset.val.toString(),
      style: 'margin-left: 10px;',
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
        style: 'display: flex; place-items: center; column-gap: 1rem;',
      },
      loopPointSlider(),
      loopDurationCranker()
    ),
    div(
      { style: 'display: flex; align-items: center; column-gap: 0.5rem;' },
      createSliderGSAP('Trim', startPoint, endPoint)
    )
  );

  return controls;
};

// import { createTwoThumbSlider } from '../primitives/createTwoThumbSlider';
// createTwoThumbSlider('Loop', loopStart, loopEnd, 0.0001, 1, 0.001, 0.002),
// createTwoThumbSlider('Trim', startPoint, endPoint, 0, 1, 0.001, 0.03)

// const loopDurationCranker = () =>
//   input({
//     type: 'range',
//     min: 0,
//     max: 0.5,
//     step: 0.001,
//     value: () => loopEndOffset.val,
//     oninput: (e) => {
//       loopEndOffset.val = Math.max(0, parseFloat(e.target.value || '0'));
//     },
//     style: 'margin-left: 10px;',
//     class: 'cranker',
//     onchange: () => {
//       console.log(
//         'crankState.val:',
//         loopEndOffset.val,
//         'loopEnd.val:',
//         loopEnd.val
//       );
//     },
//   });
