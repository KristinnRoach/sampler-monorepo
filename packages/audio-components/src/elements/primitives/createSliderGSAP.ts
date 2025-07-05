// createSliderGsap.ts
import van, { State } from '@repo/vanjs-core';
import './SliderGSAP';

const { div, label } = van.tags;

export const createSliderGSAP = (
  labelText: string,
  firstThumbState: State<number>,
  secondThumbState: State<number>
) => {
  return div(
    {
      style:
        'margin-bottom: 10px; display: flex; align-items: center; gap: 8px;',
    },
    label(() => labelText + ':'),
    van.tags['slider-gsap']({
      'onrange-change': (e: CustomEvent) => {
        firstThumbState.val = e.detail.min;
        secondThumbState.val = e.detail.max;
      },
    })
  );
};
