import { ParamDescriptor } from './types';

const MAX_HZ = 22000;
const MIN_HZ = 0.1;
const DEFAULT_HPF_CUTOFF = 100;
const DEFAULT_LPF_CUTOFF = MAX_HZ;

// Default ParamDescriptors
export const DEFAULT_PARAM_DESCRIPTORS: Record<string, ParamDescriptor> = {
  LOOP_START: {
    nodeId: 'loop-start', // todo: remove default id's, ensure they are created when param is registered
    name: 'loop-start',
    valueType: 'number',
    minValue: 0,
    maxValue: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 0,
    group: 'loop-points',
  },

  LOOP_END: {
    nodeId: 'loop-start',
    name: 'loop-start',
    valueType: 'number',
    minValue: 0,
    maxValue: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 0, // Updated when sample loads
    group: 'loop-points',
  },

  LOOP_RAMP_DURATION: {
    nodeId: 'loop-point-ramp',
    name: 'loop-point-ramp',
    valueType: 'number' as const,
    minValue: 0.001,
    maxValue: 2.0,
    step: 0.001,
    defaultValue: 0.2,
    group: 'loop-points',
  },

  ATTACK: {
    nodeId: 'attack-time',
    name: 'attack-time',
    valueType: 'number',
    minValue: 0,
    maxValue: 5,
    step: 0.001,
    defaultValue: 0.01,
    group: 'envelope',
  },

  RELEASE: {
    nodeId: 'release-time',
    name: 'release-time',
    valueType: 'number',
    minValue: 0,
    maxValue: 5,
    step: 0.001,
    defaultValue: 0.05,
    group: 'envelope',
  },

  START_OFFSET: {
    nodeId: 'start-offset',
    name: 'start-offset',
    valueType: 'number',
    minValue: 0,
    maxValue: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 0,
    group: 'sample-offsets',
  },

  END_OFFSET: {
    nodeId: 'end-offset',
    name: 'end-offset',
    valueType: 'number',
    minValue: 0,
    maxValue: 100, // Updated when sample loads
    step: 0.001,
    defaultValue: 1, // Updated when sample loads
    group: 'sample-offsets',
  },

  PLAYBACK_RATE: {
    nodeId: 'playback-rate',
    name: 'playback-rate',
    valueType: 'number',
    minValue: 0.25,
    maxValue: 4,
    step: 0.01,
    defaultValue: 1,
    group: 'playback',
  },

  LOWPASS_CUTOFF: {
    nodeId: 'lpf-freq',
    name: 'lpf-freq',
    valueType: 'number',
    minValue: MIN_HZ,
    maxValue: MAX_HZ,
    step: 1,
    defaultValue: DEFAULT_LPF_CUTOFF,
    group: 'filter:lpf',
  },

  HIGHPASS_CUTOFF: {
    nodeId: 'hpf-freq',
    name: 'hpf-freq',
    valueType: 'number',
    minValue: MIN_HZ,
    maxValue: MAX_HZ,
    step: 1,
    defaultValue: DEFAULT_HPF_CUTOFF,
    group: 'filter:hpf',
  },
};
