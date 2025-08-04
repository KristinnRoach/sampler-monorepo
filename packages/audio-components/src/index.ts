// index.ts - audio-components package entry point

// Registry utilities
export {
  getSampler,
  registerSampler,
  unregisterSampler,
  onRegistryChange,
  getAllSamplerIds,
  hasSampler,
} from './SamplerRegistry';

// Core sampler
export { defineSampler, SamplerElement } from './elements/Sampler/Sampler';

// Basic controls
export { LoadButton } from './elements/Sampler/Sampler';
export { RecordButton } from './elements/Sampler/components/RecordButton';

// Knob components
export {
  DryWetKnob,
  FeedbackKnob,
  DriveKnob,
  ClippingKnob,
  GlideKnob,
  FeedbackPitchKnob,
  FeedbackDecayKnob,
  GainLFORateKnob,
  GainLFODepthKnob,
  PitchLFORateKnob,
  PitchLFODepthKnob,
  VolumeKnob,
  ReverbKnob,
  LowpassFilterKnob,
  HighpassFilterKnob,
  LoopStartKnob,
  LoopDurationKnob,
  LoopDurationDriftKnob,
  AMModKnob,
} from './elements/Sampler/components/SamplerKnobFactory';

// Toggle components
export {
  FeedbackModeToggle,
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
  GainLFOSyncNoteToggle,
  PitchLFOSyncNoteToggle,
  PlaybackDirectionToggle,
  PanDriftToggle,
} from './elements/Sampler/components/SamplerToggleFactory';

// Input controls
export { ComputerKeyboard } from './elements/Sampler/components/ComputerKeyboard';
export { PianoKeyboard } from './elements/Sampler/components/PianoKeyboard';

// Utilities
export {
  createFindNodeId,
  createToggle,
  createKnob,
} from './shared/utils/component-utils';

// Old all-in-one version (for reference):
export { defineSamplerMonolith } from './elements/instruments/sampler/SamplerMonolith';
