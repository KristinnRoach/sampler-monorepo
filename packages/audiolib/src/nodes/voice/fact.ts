import { OptimizedLoopWorkletNode } from './OptimizedLoopWorkletNode';

export async function createLWN(context: AudioContext | BaseAudioContext) {
  const looper = await OptimizedLoopWorkletNode.create(context as AudioContext);
  return looper;
}
