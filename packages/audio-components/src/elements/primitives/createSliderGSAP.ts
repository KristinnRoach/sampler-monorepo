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
  secondThumbState: State<number>,
  range: { min: number; max: number }
) => {
  const sliderElement = van.tags['slider-gsap']({});

  //   // Wait for the custom element to be fully defined and connected
  // await customElements.whenDefined('slider-gsap');
  // // Small additional delay to ensure connectedCallback is complete
  // await new Promise(resolve => setTimeout(resolve, 0));

  // Defer the setRange call until after the element is fully connected
  setTimeout(() => {
    (sliderElement as any).setRange(range.min, range.max);
    (sliderElement as any).setPosition(0, firstThumbState.val);
    (sliderElement as any).setPosition(1, secondThumbState.val);
  }, 0);

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

  return { container, sliderElement };
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
