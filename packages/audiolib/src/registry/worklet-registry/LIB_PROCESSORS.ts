import FeedbackDelayProcessorRaw from '@/nodes/fx/delays/feedback-delay-processor?raw';
import RandomNoiseProcessorRaw from '@/nodes/Instruments/Synth/KarplusStrong/random-noise-processor?raw';
// import SamplePlayerProcessorRaw from '@/nodes/Instruments/Sampler/SingleSample/sample-player-processor?raw';

const LIB_PROCESSORS_RAW = {
  // 'sample-player-processor': SamplePlayerProcessorRaw,
  'random-noise-processor': RandomNoiseProcessorRaw,
  'feedback-delay-processor': FeedbackDelayProcessorRaw,
} as const;

export default LIB_PROCESSORS_RAW;
