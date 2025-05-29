import { Audiolib } from './Audiolib';

export const audiolib = Audiolib.getInstance();
export * as samplelib from './storage/idb';

export { getAudioContext, ensureAudioCtx } from './context';

// Factories
export { createSamplePlayer } from '@/nodes/instruments/Sample/factory';
export { createKarplusStrongSynth } from '@/nodes/instruments/Synth/KarplusStrong/factory';
export { createAudioRecorder } from '@/nodes/recorder';

// types
export type { Audiolib };
export type { SamplePlayer } from '@/nodes/instruments/Sample/SamplePlayer';
export type { KarplusStrongSynth } from '@/nodes/instruments/Synth/KarplusStrong/KarplusStrongSynth';
export type { Recorder } from '@/nodes/recorder';
export type {
  LibInstrument,
  LibAudioNode as LibNode,
  SampleLoader,
} from '@/nodes/LibNode';
export type {
  LibParam,
  ParamDescriptor,
  DEFAULT_PARAM_DESCRIPTORS,
} from '@/nodes/params';

// todo: document need to call audiolib.init or make 100% tree-shakeable
