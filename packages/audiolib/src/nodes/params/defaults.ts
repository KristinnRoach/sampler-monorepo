import { ParamDescriptor } from './types';

// Default ParamDescriptors
export const DEFAULT_PARAM_DESCRIPTORS: Record<string, ParamDescriptor> = {
  LOOP_START: {
    id: 'loop-start',
    name: 'loop-start',
    type: 'number',
    minValue: 0,
    maxValue: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 0,
    group: 'loop-points',
  },

  LOOP_END: {
    id: 'loop-start',
    name: 'loop-start',
    type: 'number',
    minValue: 0,
    maxValue: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 0, // Updated when sample loads
    group: 'loop-points',
  },

  LOOP_RAMP_DURATION: {
    id: 'loop-point-ramp',
    name: 'loop-point-ramp',
    type: 'number' as const,
    minValue: 0.001,
    maxValue: 2.0,
    step: 0.001,
    defaultValue: 0.2,
    group: 'loop-points',
  },

  ATTACK: {
    id: 'attack-time',
    name: 'attack-time',
    type: 'number',
    minValue: 0,
    maxValue: 5,
    step: 0.001,
    defaultValue: 0.01,
    group: 'envelope',
  },

  RELEASE: {
    id: 'release-time',
    name: 'release-time',
    type: 'number',
    minValue: 0,
    maxValue: 5,
    step: 0.001,
    defaultValue: 0.05,
    group: 'envelope',
  },

  START_OFFSET: {
    id: 'start-offset',
    name: 'start-offset',
    type: 'number',
    minValue: 0,
    maxValue: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 0,
    group: 'sample-offsets',
  },

  END_OFFSET: {
    id: 'end-offset',
    name: 'end-offset',
    type: 'number',
    minValue: 0,
    maxValue: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 1, // Updated when sample loads
    group: 'sample-offsets',
  },

  PLAYBACK_RATE: {
    id: 'playback-rate',
    name: 'playback-rate',
    type: 'number',
    minValue: 0.25,
    maxValue: 4,
    step: 0.01,
    defaultValue: 1,
    group: 'playback',
  },

  LOWPASS_FILTER_FREQ: {
    id: 'lpf-freq',
    name: 'lpf-freq',
    type: 'number',
    minValue: 0,
    maxValue: 20000,
    step: 1,
    defaultValue: 20000,
    group: 'filter:lpf',
  },

  HIGHPASS_FILTER_FREQ: {
    id: 'hpf-freq',
    name: 'hpf-freq',
    type: 'number',
    minValue: 0,
    maxValue: 20000,
    step: 1,
    defaultValue: 100,
    group: 'filter:hpf',
  },
};
