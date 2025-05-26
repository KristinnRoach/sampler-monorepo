import { ParamDescriptor } from './types';

// Default ParamDescriptors
export const DEFAULT_PARAM_DESCRIPTORS: Record<string, ParamDescriptor> = {
  LOOP_START: {
    id: 'loop-start',
    name: 'loop-start',
    type: 'number',
    min: 0,
    max: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 0,
    group: 'loop-points',
  },

  LOOP_END: {
    id: 'loop-start',
    name: 'loop-start',
    type: 'number',
    min: 0,
    max: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 0, // Updated when sample loads
    group: 'loop-points',
  },

  ATTACK: {
    id: 'attack-time',
    name: 'attack-time',
    type: 'number',
    min: 0,
    max: 5,
    step: 0.001,
    defaultValue: 0.01,
    group: 'envelope',
  },

  RELEASE: {
    id: 'release-time',
    name: 'release-time',
    type: 'number',
    min: 0,
    max: 5,
    step: 0.001,
    defaultValue: 0.05,
    group: 'envelope',
  },

  START_OFFSET: {
    id: 'start-offset',
    name: 'start-offset',
    type: 'number',
    min: 0,
    max: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 0,
    group: 'sample-offsets',
  },

  END_OFFSET: {
    id: 'end-offset',
    name: 'end-offset',
    type: 'number',
    min: 0,
    max: 1, // Updated when sample loads
    step: 0.001,
    defaultValue: 1, // Updated when sample loads
    group: 'sample-offsets',
  },

  PLAYBACK_RATE: {
    id: 'playback-rate',
    name: 'playback-rate',
    type: 'number',
    min: 0.25,
    max: 4,
    step: 0.01,
    defaultValue: 1,
    group: 'playback',
  },
};
