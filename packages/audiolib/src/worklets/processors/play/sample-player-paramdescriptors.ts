import { SamplePlayerProcessor } from './sample-player-processor.js';

export const SAMPLE_PLAYER_PARAM_DESCRIPTORS =
  SamplePlayerProcessor.parameterDescriptors;

export const SAMPLE_PLAYER_PARAM_KEYS = SAMPLE_PLAYER_PARAM_DESCRIPTORS.map(
  (desc) => desc.name
);

// Get typesafe param keys
export type SamplePlayerParamKey = (typeof SAMPLE_PLAYER_PARAM_KEYS)[number];
