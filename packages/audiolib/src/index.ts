// Audiolib class and instance // Todo: remove singleton once full implementation is tree shake-able
export { Audiolib } from './Audiolib';
export { getInstance } from './createAudiolib';

// Factories
export { createAudiolib } from './createAudiolib';
export type { AudiolibOptions } from './createAudiolib';

// Instruments
export { createSamplePlayer } from './nodes/instruments/Sample/factory';
export { createKarplusStrongSynth } from './nodes/instruments/Synth/KarplusStrong/factory';

// Recorder
export { createAudioRecorder } from './nodes/recorder';

// Types
export type { SamplePlayer } from './nodes/instruments/Sample/SamplePlayer';
export type { KarplusStrongSynth } from './nodes/instruments/Synth/KarplusStrong/KarplusStrongSynth';
export type { Recorder } from './nodes/recorder';
export type { LibNode as LibNode, SampleLoader } from './nodes/LibNode';
export type { LibInstrument } from '@/nodes/instruments';
export type {
  LibParam,
  ParamDescriptor,
  DEFAULT_PARAM_DESCRIPTORS,
} from './nodes/params';

// Context utilities
export { getAudioContext, ensureAudioCtx } from './context';

// Storage utilities
export * as samplelib from './storage/idb';
