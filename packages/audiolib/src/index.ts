// =*=*= Audiolib =*=*= \\
// export { Audiolib } from './Audiolib';
// export { getInstance } from './createAudiolib';

// =*=*= Factories =*=*= \\
// export { createAudiolib } from './createAudiolib';
export { createSamplePlayer } from './nodes/instruments/Sample/createSamplePlayer';
// export { createKarplusStrongSynth } from './nodes/instruments/Synth/KarplusStrong/factory';
export { createAudioRecorder } from './nodes/recorder';
// export { createCustomEnvelope } from './nodes/params/envelopes/Envelope';

// =*=*= Classes =*=*= \\
export { SamplePlayer } from './nodes/instruments/Sample/SamplePlayer';

// =*=*=  Types =*=*= \\
// export type { AudiolibOptions } from './createAudiolib';
// export type { KarplusStrongSynth } from './nodes/instruments/Synth/KarplusStrong/KarplusStrongSynth';
export type { Recorder } from './nodes/recorder';
export type { LibNode, SampleLoader } from './nodes/LibNode';
export type { LibInstrument } from '@/nodes/instruments';
export type { LibParamDescriptor } from './nodes/params';
export type {
  CustomEnvelope,
  EnvelopePoint,
  EnvelopeData,
  EnvelopeType,
} from './nodes/params/envelopes';

// =*=*=  Constants =*=*= \\
// export { DEFAULT_PARAM_DESCRIPTORS } from './nodes/params';

// =*=*= Utilities =*=*= \\
export { getAudioContext, ensureAudioCtx } from './context';

// =*=*= Storage =*=*= \\
export * as samplelib from './storage/idb';
