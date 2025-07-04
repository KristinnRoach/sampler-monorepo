import van from '@repo/vanjs-core';
import type { State } from '@repo/vanjs-core';
import './TwoThumbSlider';

const { div, label } = van.tags;

export const createTwoThumbSlider = (
  labelText: string,
  firstThumbState: State<number>,
  secondThumbState: State<number>,
  min: number,
  max: number,
  step: number = 0.001,
  minGap = step
) => {
  return div(
    { style: 'margin-bottom: 20px;' },
    label(
      () =>
        labelText +
        ': Start ' +
        firstThumbState.val.toFixed(2) +
        ': End ' +
        secondThumbState.val.toFixed(2)
    ),
    van.tags['two-thumb-slider']({
      min,
      max,
      step: step,
      'minimum-gap': minGap,
      'value-min': firstThumbState.val,
      'value-max': secondThumbState.val,
      'onrange-change': (e: CustomEvent) => {
        firstThumbState.val = e.detail.min;
        secondThumbState.val = e.detail.max;
      },
    })
  );
};
