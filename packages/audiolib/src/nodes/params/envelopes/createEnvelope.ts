// createEnvelope.ts
import { CustomEnvelope } from './CustomEnvelope';
import type { EnvelopeType, EnvelopePoint } from './env-types';
import type { EnvelopeData } from './EnvelopeData';

interface EnvelopeOptions {
  durationSeconds?: number;
  points?: EnvelopePoint[];
  valueRange?: [number, number];
  logarithmic?: boolean;
  initEnable?: boolean;
  sharedData?: EnvelopeData;
  sustainPointIndex?: number | null;
  releasePointIndex?: number;
}

export function createEnvelope(
  context: AudioContext,
  type: EnvelopeType,
  options: EnvelopeOptions = {}
): CustomEnvelope {
  const {
    durationSeconds = 2,
    points,
    sustainPointIndex,
    releasePointIndex,
    valueRange,
    logarithmic,
    initEnable,
    sharedData,
  } = options;

  // Use shared data if provided // todo: finish or remove
  if (sharedData) {
    return new CustomEnvelope(context, type, sharedData);
  }

  const defaults = CustomEnvelope.getDefaults(type, durationSeconds);

  // Use custom values or defaults
  const finalPoints = points || defaults.points;
  const finalValueRange = valueRange || defaults.valueRange;
  const finalLogarithmic =
    logarithmic !== undefined ? logarithmic : defaults.logarithmic;
  const finalInitEnable =
    initEnable !== undefined ? initEnable : defaults.initEnable;
  const finalSustainIndex =
    sustainPointIndex !== undefined
      ? sustainPointIndex
      : defaults.sustainPointIndex;
  const finalReleaseIndex =
    releasePointIndex !== undefined
      ? releasePointIndex
      : defaults.releasePointIndex;

  const envelope = new CustomEnvelope(
    context,
    type,
    undefined, // no shared data
    finalPoints,
    finalValueRange,
    durationSeconds,
    finalLogarithmic,
    finalInitEnable
  );

  // Set sustain and release points
  envelope.setSustainPoint(finalSustainIndex);
  envelope.setReleasePoint(finalReleaseIndex);

  return envelope;
}

// // createEnvelope.ts
// import { CustomEnvelope } from './CustomEnvelope';
// import type { EnvelopeType, EnvelopePoint } from './env-types';

// interface EnvelopeOptions {
//   durationSeconds?: number;
//   points?: EnvelopePoint[];
//   valueRange?: [number, number];
//   initEnable?: boolean;
// }

// export function createEnvelope(
//   context: AudioContext,
//   type: EnvelopeType,
//   options: EnvelopeOptions = {}
// ): CustomEnvelope {
//   const {
//     durationSeconds = 1,
//     points,
//     valueRange = [0, 1],
//     initEnable = true,
//   } = options;

//   // If custom points provided, use them
//   if (points) {
//     return new CustomEnvelope(
//       context,
//       type,
//       points,
//       valueRange,
//       durationSeconds,
//       initEnable
//     );
//   }

//   // Otherwise use defaults based on type
//   switch (type) {
//     case 'amp-env':
//       return new CustomEnvelope(
//         context,
//         'amp-env',
//         [
//           { time: 0, value: 0, curve: 'exponential' },
//           { time: 0.005, value: 1, curve: 'exponential' },
//           { time: 0.3, value: 0.5, curve: 'exponential' },
//           { time: durationSeconds - 0.1, value: 0.5, curve: 'exponential' },
//           { time: durationSeconds, value: 0.0, curve: 'exponential' },
//         ],
//         valueRange || [0, 1],
//         durationSeconds,
//         true, // logarithmic
//         true // init enabled
//       );

//     case 'pitch-env':
//       return new CustomEnvelope(
//         context,
//         'pitch-env',
//         [
//           { time: 0, value: 0.5, curve: 'exponential' },
//           { time: durationSeconds, value: 0.5, curve: 'exponential' },
//         ],
//         valueRange || [0.5, 1.5],
//         durationSeconds,
//         false, // log
//         false // init enabled
//       );

//     case 'filter-env':
//       return new CustomEnvelope(
//         context,
//         'filter-env',
//         [
//           { time: 0, value: 0.3, curve: 'exponential' },
//           { time: 0.05, value: 1.0, curve: 'exponential' },
//           { time: durationSeconds, value: 0.5, curve: 'exponential' },
//         ],
//         valueRange || [30, 18000],
//         durationSeconds,
//         false, // log
//         false // init enabled
//       );

//     default:
//       throw new Error(`Unknown envelope type: ${type}`);
//   }
// }
