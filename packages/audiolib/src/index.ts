// =*=*= Audiolib =*=*= \\
// export { Audiolib } from './Audiolib';
// export { getInstance } from './createAudiolib';

// =*=*= Factories =*=*= \\
// export { createAudiolib } from './createAudiolib';

export { createSamplePlayer } from './nodes/instruments/Sample/createSamplePlayer';
export { createAudioRecorder } from './nodes/recorder';

// =*=*= Classes =*=*= \\
export { SamplePlayer } from './nodes/instruments/Sample/SamplePlayer';
export { LibInstrument } from '@/nodes/instruments';

// =*=*=  Types =*=*= \\
export type { Recorder } from './nodes/recorder';
export type { LibNode, SampleLoader } from './nodes/LibNode';
export type { LibParamDescriptor } from './nodes/params';
export type {
  CustomEnvelope,
  EnvelopePoint,
  EnvelopeData,
  EnvelopeType,
} from './nodes/params/envelopes';

// =*=*= Utilities =*=*= \\
export { getAudioContext, ensureAudioCtx } from './context';

// =*=*= Storage =*=*= \\
export * as samplelib from './storage/idb';
