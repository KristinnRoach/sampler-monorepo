import { normalizeAudioBuffer } from '@/utils/audiodata/process/normalizeAudioBuffer';
import { detectThresholdCrossing } from '@/utils/audiodata/process/detectSilence';
import { trimAudioBuffer } from '@/utils/audiodata/process/trimBuffer';

export type PreProcessOptions = {
  normalize: boolean;
  trimSilence: boolean;
  silenceThreshold: number;
  maxAmplitudePeak: number;
  fadeInOutMs: number;
  // autotune: true
};

export const DEFAULT_PRE_PROCESS_OPTIONS: PreProcessOptions = {
  normalize: true,
  trimSilence: true,
  silenceThreshold: 0.01, // Range of samples: [-1, 1]
  maxAmplitudePeak: 0.9, // [-1, 1]
  fadeInOutMs: 5,
};

// Todo: should optimize not to create a new audio buffer in each processing step ?

export function preProcessAudioBuffer(
  ctx: AudioContext,
  buffer: AudioBuffer,
  options: PreProcessOptions = DEFAULT_PRE_PROCESS_OPTIONS
) {
  const {
    normalize,
    trimSilence,
    silenceThreshold,
    maxAmplitudePeak,
    fadeInOutMs,
  } = options;

  let processed = buffer;

  if (normalize)
    processed = normalizeAudioBuffer(ctx, buffer, maxAmplitudePeak);

  if (trimSilence) {
    const { start, end } = detectThresholdCrossing(processed, silenceThreshold);
    console.debug(start, end);
    processed = trimAudioBuffer(ctx, processed, start, end, fadeInOutMs);
    console.debug(processed);
  }

  return processed;
}
