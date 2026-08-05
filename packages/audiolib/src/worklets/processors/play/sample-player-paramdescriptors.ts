import { AudioParamDescriptor } from '@/nodes/params/param-types';

// Source of truth for SamplePlayerProcessor's parameterDescriptors.
// Plain data (no AudioWorkletProcessor reference) so it's safe to import
// from both the worklet processor and main-thread code.
export const SAMPLE_PLAYER_PARAM_DESCRIPTORS: AudioParamDescriptor[] = [
  {
    name: 'masterGain',
    defaultValue: 1,
    minValue: 0,
    maxValue: 2,
    automationRate: 'k-rate',
  },
  {
    name: 'envGain',
    defaultValue: 0,
    minValue: 0,
    maxValue: 1,
    automationRate: 'a-rate',
  },
  {
    name: 'velocity',
    defaultValue: 100,
    minValue: 0,
    maxValue: 127,
    automationRate: 'k-rate',
  },
  {
    name: 'pan',
    defaultValue: 0,
    minValue: -1, // -1 hard left
    maxValue: 1, // 1 hard right
    automationRate: 'k-rate',
  },
  {
    name: 'playbackRate',
    defaultValue: 1,
    minValue: 0.1,
    maxValue: 24,
    automationRate: 'a-rate',
  },
  // NOTE: Time based params use seconds
  {
    name: 'loopStart',
    defaultValue: 0,
    minValue: 0,
    maxValue: 99999, // Max sample length in seconds
    automationRate: 'k-rate',
  },
  {
    name: 'loopEnd',
    defaultValue: 99999, // Will be set to actual buffer duration when loaded
    minValue: 0,
    maxValue: 99999,
    automationRate: 'k-rate',
  },
  {
    name: 'startPoint',
    defaultValue: 0,
    minValue: 0,
    maxValue: 9999, // Max sample length in seconds
    automationRate: 'k-rate',
  },
  {
    name: 'endPoint',
    defaultValue: 9999, // Will be set to actual buffer duration when loaded
    minValue: 0,
    maxValue: 9999,
    automationRate: 'k-rate',
  },
  {
    name: 'playbackPosition',
    defaultValue: 0,
    minValue: 0,
    maxValue: 99999,
    automationRate: 'k-rate',
  },
  {
    name: 'loopDurationDriftAmount',
    defaultValue: 0,
    minValue: 0,
    maxValue: 1, // 0 = no drift, 1 = max drift (up to 100% of loop duration)
    automationRate: 'k-rate',
  },
  {
    name: 'maxLoopCount',
    defaultValue: 999999,
    minValue: 1,
    maxValue: 999999,
    automationRate: 'k-rate',
  },
  {
    name: 'tempo',
    defaultValue: 120,
    minValue: 20,
    maxValue: 300,
    automationRate: 'k-rate',
  },
];

export const SAMPLE_PLAYER_PARAM_KEYS = SAMPLE_PLAYER_PARAM_DESCRIPTORS.map(
  (desc) => desc.name
);

// Get typesafe param keys
export type SamplePlayerParamKey = (typeof SAMPLE_PLAYER_PARAM_KEYS)[number];
