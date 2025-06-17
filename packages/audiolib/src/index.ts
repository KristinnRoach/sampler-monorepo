// Todo: remove singleton once full implementation is tree shake-able

// =*=*= Audiolib =*=*= \\
export { Audiolib } from './Audiolib';
export { getInstance } from './createAudiolib';

// =*=*= Factories =*=*= \\
export { createAudiolib } from './createAudiolib';
export { createSamplePlayer } from './nodes/instruments/Sample/factory';
export { createKarplusStrongSynth } from './nodes/instruments/Synth/KarplusStrong/factory';
export { createAudioRecorder } from './nodes/recorder';
export { createCustomEnvelope } from './nodes/params/Envelope';

// =*=*=  Types =*=*= \\
export type { AudiolibOptions } from './createAudiolib';
export type { SamplePlayer } from './nodes/instruments/Sample/SamplePlayer';
export type { KarplusStrongSynth } from './nodes/instruments/Synth/KarplusStrong/KarplusStrongSynth';
export type { Recorder } from './nodes/recorder';
export type { LibNode as LibNode, SampleLoader } from './nodes/LibNode';
export type { LibInstrument } from '@/nodes/instruments';
export type { LibParamDescriptor } from './nodes/params';
export type { CustomEnvelope } from './nodes/params/Envelope';

// =*=*=  Constants =*=*= \\
export { DEFAULT_PARAM_DESCRIPTORS, DEFAULT_ENV } from './nodes/params';

// =*=*= Utilities =*=*= \\
export { getAudioContext, ensureAudioCtx } from './context';

// =*=*= Storage =*=*= \\
export * as samplelib from './storage/idb';
