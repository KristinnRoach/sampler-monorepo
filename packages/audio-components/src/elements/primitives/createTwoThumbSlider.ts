import van from '@repo/vanjs-core';
import type { State } from '@repo/vanjs-core';
import './misc/TwoThumbSlider';

const { div, label } = van.tags;

export const createTwoThumbSlider = (
  labelText: string,
  startState: State<number>,
  endState: State<number>,
  min: number,
  max: number,
  step: number = 0.001,
  minGap = step
) => {
  return div(
    label(labelText + ': '),
    van.tags['two-thumb-slider']({
      min: min,
      max: max,
      step: step,
      'minimum-gap': minGap,
      'value-min': startState.val,
      'value-max': endState.val,
      'onrange-change': (e: CustomEvent) => {
        startState.val = e.detail.min;
        endState.val = e.detail.max;
      },
    })
  );
};
