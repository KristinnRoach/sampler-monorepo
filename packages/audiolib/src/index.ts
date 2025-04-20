import { Audiolib } from './Audiolib';

export const audiolib = Audiolib.getInstance();
// await audiolib.init(); // better to let the user call init?

export { SourceNode } from '@/nodes/source/SourceNode';
export { Sampler } from '@/nodes/source/Sampler';

export * from './store/persistent/idb/idb';
export * as samplelib from './store/persistent/idb/audioStorage';
export * from './input';

export { getAudioContext, ensureAudioCtx } from './context';
export { registry } from '@/processors/ProcessorRegistry';
