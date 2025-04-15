import { Audiolib } from './Audiolib';

export const audiolib = Audiolib.getInstance();
// await audiolib.init(); // better to let the user call init?

export * from './store/persistent/idb/idb';
export * as samplelib from './store/persistent/idb/audioStorage';
export * from './input';

export { SingleSamplePlayer } from '@/instruments/SingleSample/SingleSamplePlayer';
export type { SingleSamplePlayerProps } from '@/instruments/SingleSample/SingleSamplePlayer';

export { getAudioContext, ensureAudioCtx } from './context';
export { registry } from '@/processors/ProcessorRegistry';
export { SourceWorkletNode } from '@/nodes/source/SourceCleanupSingle/SourceWorkletNode';
