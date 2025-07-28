// createEnvelope.ts
import { CustomEnvelope } from './CustomEnvelope';
import type { EnvelopeType, EnvelopePoint, EnvelopeScaling } from './env-types';
import type { EnvelopeData } from './EnvelopeData';

interface EnvelopeOptions {
  durationSeconds?: number;
  points?: EnvelopePoint[];
  paramValueRange?: [number, number];
  scaling?: EnvelopeScaling;
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
    paramValueRange,
    scaling,
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
  let finalValueRange = paramValueRange || defaults.paramValueRange;
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

  // Force logarithmic=true for filter envelopes regardless of passed option
  const isFilterEnv = type === 'filter-env';

  const finalScaling = isFilterEnv
    ? scaling || 'logarithmic'
    : scaling || defaults.scaling;

  const envelope = new CustomEnvelope(
    context,
    type,
    undefined, // no shared data
    finalPoints,
    finalValueRange,
    durationSeconds,
    finalScaling,
    finalInitEnable
  );

  // Set sustain and release points
  envelope.setSustainPoint(finalSustainIndex);
  finalReleaseIndex && envelope.setReleasePoint(finalReleaseIndex);

  return envelope;
}
