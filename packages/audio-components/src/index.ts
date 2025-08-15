// index.ts - audio-components package entry point

// Import CSS for bundling
import './shared/styles/audio-components.css';

// Registry utilities
export {
  getSampler,
  registerSampler,
  unregisterSampler,
  onRegistryChange,
  getAllSamplerIds,
  hasSampler,
} from './elements/Sampler/SamplerRegistry';

// Core sampler
export { defineSampler, SamplerElement } from './elements/Sampler/Sampler';

// Basic controls
export {
  UploadButton as LoadButton,
  RecordButton,
} from './elements/Sampler/components/SamplerButtonFactory';

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
  ReverbSendKnob,
  ReverbSizeKnob,
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

// Select controls
export {
  KeymapSelect,
  WaveformSelect,
} from './elements/Sampler/components/SamplerSelectFactory';

// Envelopes
export { EnvelopeDisplay } from './elements/Sampler/components/EnvelopeDisplay';
export { EnvelopeSwitcher } from './elements/Sampler/components/EnvelopeSwitcher';

// Utilities
export {
  createFindNodeId,
  createToggle,
  createKnob,
} from './shared/utils/component-utils';

export { SamplerStatusElement } from './elements/Sampler/components/SamplerStatusElement';

// Old all-in-one version (for reference):
export { defineSamplerMonolith } from './elements/monoliths/sampler/SamplerMonolith';
