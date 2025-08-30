import { LibParamDescriptor } from '../../params/param-types';
import { DEFAULT_SAMPLE_RATE } from '@/constants/defaults/common';

// Allowed Hz range for native web audio filters is 10 to the Nyquist frequency (half the sample rate).
export const getMaxFilterFreq = (ctxSampleRate: number) =>
  Math.floor(ctxSampleRate / 2 - 1000);

const MAX_HZ = getMaxFilterFreq(DEFAULT_SAMPLE_RATE); // Using default sample rate
const MIN_HZ = 20; // Minimum frequency for filters
const DEFAULT_HPF_CUTOFF = 100;
const DEFAULT_LPF_CUTOFF = MAX_HZ;
const FILTER_STEP = 10; // Step size for filter frequency adjustments

export type ParamDescriptorKey =
  | 'ENV_GAIN'
  | 'PLAYBACK_RATE'
  | 'LOOP_START'
  | 'LOOP_END'
  | 'LOOP_RAMP_DURATION'
  | 'START_POINT'
  | 'END_POINT'
  | 'LOWPASS_CUTOFF'
  | 'HIGHPASS_CUTOFF';

// Default ParamDescriptors
export const DEFAULT_PARAM_DESCRIPTORS: Record<
  ParamDescriptorKey,
  LibParamDescriptor
> = {
  PLAYBACK_RATE: {
    nodeId: 'playback-rate',
    name: 'playback-rate',
    dataType: 'number',
    minValue: -4,
    maxValue: 4,
    step: 0.0001,
    defaultValue: 1,
    group: 'pitch',
    automationRate: 'k-rate',
  },

  ENV_GAIN: {
    nodeId: 'env-gain',
    name: 'env-gain',
    dataType: 'number',
    minValue: 0,
    maxValue: 1,
    step: 0.0001,
    defaultValue: 0,
    group: 'amp-env',
    automationRate: 'k-rate',
  },

  LOOP_START: {
    nodeId: 'loop-start',
    name: 'loop-start',
    dataType: 'number',
    minValue: 0,
    maxValue: 9999, // Max sample length in seconds
    step: 0.001,
    defaultValue: 0,
    group: 'loop-points',
    automationRate: 'k-rate',
  },

  LOOP_END: {
    nodeId: 'loop-end',
    name: 'loop-end',
    dataType: 'number',
    minValue: 0,
    maxValue: 9999, // Max sample length in seconds
    step: 0.001,
    defaultValue: 9999, // Will be set to actual buffer duration when loaded
    group: 'loop-points',
    automationRate: 'k-rate',
  },

  LOOP_RAMP_DURATION: {
    nodeId: 'loop-point-ramp',
    name: 'loop-point-ramp',
    dataType: 'number' as const,
    minValue: 0.001,
    maxValue: 1.0,
    step: 0.001,
    defaultValue: 0.5,
    group: 'loop-points',
    automationRate: 'k-rate',
  },

  START_POINT: {
    nodeId: 'start-point',
    name: 'start-point',
    dataType: 'number',
    minValue: 0,
    maxValue: 9999, // Max sample length in seconds
    step: 0.001,
    defaultValue: 0,
    group: 'trim-sample',
    automationRate: 'k-rate',
  },

  END_POINT: {
    nodeId: 'end-point',
    name: 'end-point',
    dataType: 'number',
    minValue: 0,
    maxValue: 9999, // Max sample length in seconds
    step: 0.001,
    defaultValue: 9999, // Will be set to actual buffer duration when loaded
    group: 'trim-sample',
    automationRate: 'k-rate',
  },

  LOWPASS_CUTOFF: {
    nodeId: 'lpf-freq',
    name: 'lpf-freq',
    dataType: 'number',
    minValue: MIN_HZ,
    maxValue: MAX_HZ,
    step: FILTER_STEP,
    defaultValue: DEFAULT_LPF_CUTOFF,
    group: 'filter:lpf',
    automationRate: 'k-rate',
  },

  HIGHPASS_CUTOFF: {
    nodeId: 'hpf-freq',
    name: 'hpf-freq',
    dataType: 'number',
    minValue: MIN_HZ,
    maxValue: MAX_HZ,
    step: FILTER_STEP,
    defaultValue: DEFAULT_HPF_CUTOFF,
    group: 'filter:hpf',
    automationRate: 'k-rate',
  },
} as const;

// Exporting keys for easy reference
export const PARAM_KEYS = Object.keys(
  DEFAULT_PARAM_DESCRIPTORS
) as ParamDescriptorKey[];

export const getDefaultValue = (param: ParamDescriptorKey) =>
  DEFAULT_PARAM_DESCRIPTORS[param].defaultValue;

export const getParamDescriptor = (param: ParamDescriptorKey) =>
  DEFAULT_PARAM_DESCRIPTORS[param];
