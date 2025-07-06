// createSliderGsap.ts
import van, { State } from '@repo/vanjs-core';
import './SliderGSAP';

// ? add to types.d.ts ?
declare global {
  interface HTMLElementEventMap {
    'range-change': CustomEvent<{ min: number; max: number }>;
  }
}

const { div, label } = van.tags;

export const createSliderGSAP = (
  labelText: string,
  firstThumbState: State<number>,
  secondThumbState: State<number>
) => {
  const sliderElement = van.tags['slider-gsap']({});

  // Add listener to the actual slider element
  (sliderElement as HTMLElement).addEventListener(
    'range-change',
    (e: CustomEvent) => {
      firstThumbState.val = e.detail.min;
      secondThumbState.val = e.detail.max;
    }
  );

  const container = div(
    {
      style:
        'margin-bottom: 10px; display: flex; align-items: center; gap: 8px;',
    },
    label(() => labelText + ':'),
    sliderElement
  );

  return { container, sliderElement }; // Return both
};

// export const createSliderGSAP = (
//   labelText: string,
//   firstThumbState: State<number>,
//   secondThumbState: State<number>
// ) => {
//   return div(
//     {
//       style:
//         'margin-bottom: 10px; display: flex; align-items: center; gap: 8px;',
//     },
//     label(() => labelText + ':'),
//     van.tags['slider-gsap']({
//       'onrange-change': (e: CustomEvent) => {
//         firstThumbState.val = e.detail.min;
//         secondThumbState.val = e.detail.max;
//       },
//     })
//   );
// };
