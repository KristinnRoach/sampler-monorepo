import FeedbackDelayProcessorRaw from '@/processors/delays/feedback-delay-processor?raw';
import RandomNoiseProcessorRaw from '@/processors/noise/random-noise-processor?raw';
import SourceProcessor from '@/nodes/source/source-processor?raw';

const PROCESSORS = {
  'source-processor': SourceProcessor,
  'random-noise-processor': RandomNoiseProcessorRaw,
  'feedback-delay-processor': FeedbackDelayProcessorRaw,
} as const;

export default PROCESSORS;
