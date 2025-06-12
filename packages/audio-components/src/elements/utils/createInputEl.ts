import van from '@repo/vanjs-core';
import type { State } from '@repo/vanjs-core';

const { div, span, input, label } = van.tags;

export const createSlider = (
  labelText: string,
  state: State<number>,
  min: number,
  max: number,
  step: number,
  unit: string = '%',
  multiplier: number = 100
) => {
  return div(
    { style: 'margin-bottom: 20px;' },
    label(labelText + ': '),
    input({
      type: 'range',
      min,
      max,
      step,
      value: state,
      oninput: (e) => (state.val = parseFloat(e.target.value)),
      style: 'margin-left: 10px;',
      class: 'interactive-element',
    }),
    span({ style: 'margin-left: 10px;' }, () =>
      unit === '%'
        ? Math.round(state.val * multiplier) + unit
        : state.val + unit
    )
  );
};

export const createCheckbox = (labelText: string, state: State<boolean>) => {
  return label(
    { style: 'display: flex; align-items: center; gap: 8px; cursor: pointer;' },
    input({
      type: 'checkbox',
      checked: state,
      onchange: (e) => (state.val = e.target.checked),
    }),
    labelText
  );
};
