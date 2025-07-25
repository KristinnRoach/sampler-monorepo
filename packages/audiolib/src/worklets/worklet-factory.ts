import { FbDelayConfig, DistortionConfig, DattorroReverbConfig } from './types';
import { WorkletNode } from './WorkletNode';

function createDelay(context: AudioContext) {
  return new WorkletNode<FbDelayConfig>(context, 'feedback-delay-processor');
}

function createDistortion(context: AudioContext) {
  return new WorkletNode<DistortionConfig>(context, 'distortion-processor');
}

export function createDattorroReverb(context: AudioContext) {
  return new WorkletNode<DattorroReverbConfig>(
    context,
    'dattorro-reverb-processor'
  );
}

export { createDelay, createDistortion };
