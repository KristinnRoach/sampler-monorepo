import { LibParamDescriptor } from '../../params/param-types';
import { DEFAULT_SAMPLE_RATE } from '@/constants/defaults/common';
import { assert } from '@/utils';
import {
  SAMPLE_PLAYER_PARAM_DESCRIPTORS,
  SamplePlayerParamKey,
} from '@/worklets';


// Worklet's parameterDescriptors are the source of truth for min/max/default/automationRate.
const fromWorklet = (name: SamplePlayerParamKey) => {
  const descriptor = SAMPLE_PLAYER_PARAM_DESCRIPTORS.find(
    (d) => d.name === name
  );
  assert(descriptor, `No worklet param descriptor found for "${name}"`);
  return descriptor as Required<typeof descriptor>;
};

// Allowed Hz range for native web audio filters is 10 to the Nyquist frequency (half the sample rate).
export const getMaxFilterFreq = (ctxSampleRate: number = DEFAULT_SAMPLE_RATE) =>
  Math.floor(ctxSampleRate / 2 - 1000);

const MAX_HZ = getMaxFilterFreq(); // Using default sample rate
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
    ...fromWorklet('playbackRate'),
    nodeId: 'playback-rate',
    name: 'playback-rate',
    dataType: 'number',
    step: 0.0001,
    group: 'pitch',
  },

  ENV_GAIN: {
    ...fromWorklet('envGain'),
    nodeId: 'env-gain',
    name: 'env-gain',
    dataType: 'number',
    step: 0.0001,
    group: 'amp-env',
  },

  LOOP_START: {
    ...fromWorklet('loopStart'),
    nodeId: 'loop-start',
    name: 'loop-start',
    dataType: 'number',
    step: 0.001,
    group: 'loop-points',
  },

  LOOP_END: {
    ...fromWorklet('loopEnd'),
    nodeId: 'loop-end',
    name: 'loop-end',
    dataType: 'number',
    step: 0.001,
    group: 'loop-points',
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
    ...fromWorklet('startPoint'),
    nodeId: 'start-point',
    name: 'start-point',
    dataType: 'number',
    step: 0.001,
    group: 'trim-sample',
  },

  END_POINT: {
    ...fromWorklet('endPoint'),
    nodeId: 'end-point',
    name: 'end-point',
    dataType: 'number',
    step: 0.001,
    group: 'trim-sample',
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
