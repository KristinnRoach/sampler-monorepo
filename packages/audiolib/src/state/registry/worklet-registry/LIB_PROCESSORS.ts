import FeedbackDelayProcessorRaw from '@/nodes/fx/fx_processors/delays/feedback-delay-processor?raw';
import RandomNoiseProcessorRaw from '@/nodes/voices/voice_processors/synth/random-noise-processor?raw';
import SamplePlayerProcessorRaw from '@/nodes/voices/voice_processors/sample/sample-player-processor?raw';

const LIB_PROCESSORS_RAW = {
  'sample-player-processor': SamplePlayerProcessorRaw,
  'random-noise-processor': RandomNoiseProcessorRaw,
  'feedback-delay-processor': FeedbackDelayProcessorRaw,
} as const;

export default LIB_PROCESSORS_RAW;
