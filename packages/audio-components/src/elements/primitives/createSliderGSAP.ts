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
  range: { min: number; max: number },
  rampTime?: State<number> // ? Make generic
) => {
  const sliderElement = van.tags['slider-gsap']({});
  const initialRampTime = rampTime?.rawVal ?? 0.5;

  // Defer until element is fully connected
  setTimeout(() => {
    (sliderElement as any).setRange(range.min, range.max);
    (sliderElement as any).setPosition(0, firstThumbState.rawVal); // ! rawVal ?
    (sliderElement as any).setPosition(1, secondThumbState.rawVal);
    // rampTime && (sliderElement as any).setRampTime(rampTime.rawVal);
  }, 0);

  // Add listener to the actual slider element
  (sliderElement as HTMLElement).addEventListener(
    'range-change',
    (e: CustomEvent) => {
      firstThumbState.val = e.detail.min;
      secondThumbState.val = e.detail.max;
      if (rampTime !== undefined) {
        rampTime.val = e.detail.isShiftDragging ? 0 : initialRampTime;
      }
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

//  ? Use this if createSliderGSAP can be async ?
//  Wait for the custom element to be fully defined and connected
// await customElements.whenDefined('slider-gsap');
// await new Promise(resolve => setTimeout(resolve, 0));
