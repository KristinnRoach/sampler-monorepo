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
export { LoadButton } from './elements/Sampler';
export { RecordButton } from './elements/RecordButton';

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
  FilterKnob,
} from './elements/KnobFactory';

// Toggle components
export {
  FeedbackModeToggle,
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
} from './elements/ToggleComponents';

// Input controls
export { ComputerKeyboard } from './elements/ComputerKeyboard';
export { PianoKeyboard } from './elements/PianoKeyboard';

// Utilities
export { createFindNodeId } from './shared/utils/component-utils';

// Old all-in-one version (for reference):
export { defineSamplerMonolith } from './elements/instruments/sampler/SamplerMonolith';
