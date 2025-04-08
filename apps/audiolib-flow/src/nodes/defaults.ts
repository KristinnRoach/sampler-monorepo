import { type SingleSamplePlayerProps } from '@repo/audiolib';

const DEFAULT_PLAYER_PROPS: SingleSamplePlayerProps = {
  name: 'Default SamplePlayer',
  sampleBuffer: undefined,
  addInputHandlers: true,
  polyphony: 8,
  rootNote: 60, // MIDI note number
  outputDestination: undefined,
};

export { DEFAULT_PLAYER_PROPS };
