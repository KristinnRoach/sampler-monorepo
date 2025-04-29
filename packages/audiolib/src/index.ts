import { Audiolib } from './Audiolib';

export const audiolib = Audiolib.getInstance();
// await audiolib.init(); // currently the user calls init

export { Sampler } from '@/nodes/instruments/Sampler';
export { KarplusStrongSynth } from '@/nodes/instruments/KarplusStrongSynth';

export { SampleVoice } from '@/nodes/voices/voice_nodes/sample/SampleVoice';

export { Recorder } from '@/recorder';

export * from './store/persistent/idb/idb';
export * as samplelib from './store/persistent/idb/audioStorage';
export * from './input';

export { getAudioContext, ensureAudioCtx } from './context';
export { registry } from '@/store/state/worklet-registry/ProcessorRegistry';
