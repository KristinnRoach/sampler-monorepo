import { FbDelayConfig, DistortionConfig, DistortionWorklet } from './types';
import { WorkletNode } from './WorkletNode';

function createFeedbackDelay(context: AudioContext) {
  return new WorkletNode<FbDelayConfig>(context, 'feedback-delay-processor');
}

function createDistortion(context: AudioContext) {
  return new WorkletNode<DistortionConfig>(
    context,
    'distortion-processor'
  ) as DistortionWorklet;
}

export { createFeedbackDelay, createDistortion };
