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
  baseStep: number = 0.001,
  minGap = baseStep,
  logarithmicScaling = false
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
      step: baseStep,
      'minimum-gap': minGap,
      'value-min': firstThumbState.val,
      'value-max': secondThumbState.val,
      'use-logarithmic-scaling': logarithmicScaling,
      'onrange-change': (e: CustomEvent) => {
        firstThumbState.val = e.detail.min;
        secondThumbState.val = e.detail.max;
      },
    })
  );
};

// export const createTwoThumbSlider = (
//   labelText: string,
//   firstThumbState: State<number>,
//   secondThumbState: State<number>,
//   min: number,
//   max: number,
//   baseStep: number = 0.001,
//   minGap = baseStep,
//   useScaling = false,
//   logarithmic = false
// ) => {
//   const scaleLoopPoint = (
//     valueToAdjust: 'start' | 'end',
//     start: number,
//     end: number
//   ): number => {
//     const proposedLoopSize = Math.abs(end - start);
//     const compressionFactor = Math.min(1, proposedLoopSize + 0.01); // More compression when size is small

//     const center = (start + end) / 2;
//     const value = valueToAdjust === 'start' ? start : end;

//     // Compress towards center
//     return center + (value - center) * compressionFactor;
//   };

//   return div(
//     { style: 'margin-bottom: 20px;' },
//     label(labelText + ': '),
//     van.tags['two-thumb-slider']({
//       min,
//       max,
//       step: baseStep,
//       useLogarithmicScaling: logarithmic,
//       'minimum-gap': minGap,
//       'value-min': firstThumbState.val,
//       'value-max': secondThumbState.val,
//       'onrange-change': (e: CustomEvent) => {
//         if (useScaling) {
//           firstThumbState.val = scaleLoopPoint(
//             'start',
//             e.detail.min,
//             e.detail.max
//           );
//           secondThumbState.val = scaleLoopPoint(
//             'end',
//             e.detail.min,
//             e.detail.max
//           );
//         } else {
//           firstThumbState.val = e.detail.min;
//           secondThumbState.val = e.detail.max;
//         }
//       },
//     })
//   );
// };

// export const createTwoThumbSlider = (
//   labelText: string,
//   firstThumbState: State<number>,
//   secondThumbState: State<number>,
//   min: number,
//   max: number,
//   baseStep: number = 0.001,
//   minGap = baseStep,
//   useScaling = false,
//   logarithmic = false
// ) => {
//   const scaleLoopPoint = (
//     valueToAdjust: 'start' | 'end',
//     start: number,
//     end: number
//   ): number => {
//     const proposedLoopSize = Math.abs(end - start);
//     // const scalingFactor = Math.max(1, 1 / (proposedLoopSize + 0.01));
//     const scalingFactor = Math.max(
//       1,
//       Math.pow(1 / (proposedLoopSize + 0.1), 2)
//     );
//     // const scalingFactor = Math.max(1, 10 / (proposedLoopSize + 0.01));

//     if (valueToAdjust === 'start') return Math.pow(start, scalingFactor);
//     else return Math.pow(end, scalingFactor);
//   };

//   return div(
//     { style: 'margin-bottom: 20px;' },
//     label(labelText + ': '),
//     van.tags['two-thumb-slider']({
//       min,
//       max,
//       step: baseStep,
//       useLogarithmicScaling: logarithmic,
//       'minimum-gap': minGap,
//       'value-min': firstThumbState.val,
//       'value-max': secondThumbState.val,
//       'onrange-change': (e: CustomEvent) => {
//         if (useScaling) {
//           firstThumbState.val = scaleLoopPoint(
//             'start',
//             e.detail.min,
//             e.detail.max
//           );
//           secondThumbState.val = scaleLoopPoint(
//             'end',
//             e.detail.min,
//             e.detail.max
//           );
//         } else {
//           firstThumbState.val = e.detail.min;
//           secondThumbState.val = e.detail.max;
//         }
//       },
//     })
//   );
// };

// export const createTwoThumbSlider = (
//   labelText: string,
//   firstThumbState: State<number>,
//   secondThumbState: State<number>,
//   min: number,
//   max: number,
//   baseStep: number = 0.001,
//   minGap = baseStep,
//   adaptivePrecision = false,
//   logarithmic = false
// ) => {
//   return div(
//     { style: 'margin-bottom: 20px;' },
//     label(labelText + ': '),
//     van.tags['two-thumb-slider']({
//       min,
//       max,
//       step: baseStep,
//       useLogarithmicScaling: logarithmic,
//       'minimum-gap': minGap,
//       'value-min': firstThumbState.val,
//       'value-max': secondThumbState.val,
//       'onrange-change': (e: CustomEvent) => {
//         if (adaptivePrecision) {
//           const range = e.detail.max - e.detail.min;
//           const precision = Math.max(range / 1000, 0.000001);

//           firstThumbState.val =
//             Math.round(e.detail.min / precision) * precision;
//           secondThumbState.val =
//             Math.round(e.detail.max / precision) * precision;
//         } else {
//           firstThumbState.val = e.detail.min;
//           secondThumbState.val = e.detail.max;
//         }
//       },
//     })
//   );
// };
