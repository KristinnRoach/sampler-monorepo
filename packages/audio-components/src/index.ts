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
export { defineSampler, SamplerElement } from './elements/Sampler';

// Basic controls
export { LoadButton, RecordButton } from './elements/Sampler';

// Knob components
export {
  VolumeKnob,
  ReverbKnob,
  FilterKnob,
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
} from './elements/Sampler';

// Toggle components
export {
  FeedbackModeToggle,
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
} from './elements/Sampler';

// Input controls
export { ComputerKeyboard } from './elements/ComputerKeyboard';
export { PianoKeyboard } from './elements/PianoKeyboard';

// Utilities
export { createFindNodeId } from './elements/ComponentUtils';

// Old all-in-one version (deprecated):
export { defineSamplerMonolith } from './elements/instruments/sampler/SamplerMonolith';
