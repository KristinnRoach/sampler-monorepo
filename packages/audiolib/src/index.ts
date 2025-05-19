import { Audiolib } from './Audiolib';

export const audiolib = Audiolib.getInstance();
export { Audiolib };

export { SamplePlayer } from '@/nodes/instruments/Sample/SamplePlayer';
export { KarplusStrongSynth } from '@/nodes/instruments/Synth/KarplusStrong/KarplusStrongSynth';
export { Recorder } from '@/nodes/recorder';

export { getAudioContext, ensureAudioCtx } from './context';

// Factories // todo: document need to call audiolib.init or make 100% tree-shakeable
export { createSamplePlayer } from '@/nodes/instruments/Sample/factory';
export { createKarplusStrongSynth } from '@/nodes/instruments/Synth/KarplusStrong/factory';
export { createAudioRecorder } from '@/nodes/recorder';

// types
export type { LibNode, SampleLoader } from '@/LibNode';

// export * from './storage/idb/idb';
// export * as samplelib from './storage/idb/audioStorage';
// export * from './input';
