import FeedbackDelayProcessorRaw from './delays/feedback-delay-processor?raw';
import RandomNoiseProcessorRaw from './noise/random-noise-processor?raw';
import SourceProcessor from './source/source-processor?raw';

const PROCESSORS = {
  'source-processor': SourceProcessor,
  'random-noise-processor': RandomNoiseProcessorRaw,
  'feedback-delay-processor': FeedbackDelayProcessorRaw,
} as const;

export default PROCESSORS;
