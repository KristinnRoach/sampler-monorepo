import FeedbackDelayProcessorRaw from '@/processors/delays/feedback-delay-processor?raw'; // /GrainSamplerProcessor?raw';
import LoopControlProcessorRaw from '@/processors/loop/loop-control-processor?raw';
// import MultiLoopProcessorRaw from '@/processors/loop/loop-control-processor?raw';
import RandomNoiseProcessorRaw from '@/processors/noise/random-noise-processor?raw';

const PROCESSORS = {
  'loop-control-processor': LoopControlProcessorRaw,
  // 'multi-loop-processor': MultiLoopProcessorRaw,
  'random-noise-processor': RandomNoiseProcessorRaw,
  'feedback-delay-processor': FeedbackDelayProcessorRaw,
} as const;

export default PROCESSORS;
