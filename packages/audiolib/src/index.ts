// =*=*= Factories =*=*= \\
export { createSamplePlayer } from './nodes/instruments/Sample/createSamplePlayer';
export { createAudioRecorder } from './nodes/recorder';

// =*=*= Classes =*=*= \\
export { SamplePlayer } from './nodes/instruments/Sample/SamplePlayer';

// =*=*=  Types =*=*= \\
export type { Recorder } from './nodes/recorder';
export type { LibNode, LibAudioNode, SampleLoader } from './nodes';
export type {
  CustomEnvelope,
  EnvelopePoint,
  EnvelopeData,
  EnvelopeType,
} from './nodes/params/envelopes';

// =*=*= Utilities =*=*= \\
export { getAudioContext, ensureAudioCtx } from './context';

// =*=*= Storage =*=*= \\
// export * as samplelib from './storage/idb'; // Removed to reduce bundle size
