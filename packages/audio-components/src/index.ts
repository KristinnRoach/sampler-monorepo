// packages/audio-components/src/index.ts

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
export { defineSampler } from './elements/Sampler/Sampler';
export type { SamplerElement } from './elements/Sampler/Sampler';

// SamplePlayer class
// import { SamplePlayer } from '@repo/audiolib';
export type { SamplePlayer } from '@repo/audiolib';

// Basic controls
export {
  UploadButton,
  RecordButton,
  SaveButton,
} from './elements/Sampler/components/SamplerButtonFactory';

// Knob components
export { KnobElement } from './elements/primitives/KnobElement';

// Oscilloscope components
export { OscilloscopeElement } from './elements/OscilloscopeElement';

export {
  DryWetKnob,
  FeedbackKnob,
  DriveKnob,
  ClippingKnob,
  GlideKnob,
  FeedbackPitchKnob,
  FeedbackDecayKnob,
  FeedbackLpfKnob,
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
  TrimStartKnob,
  TrimEndKnob,
  DistortionKnob,
  TempoKnob,
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
  PitchToggle,
} from './elements/Sampler/components/SamplerToggleFactory';

// Input controls
export { ComputerKeyboard } from './elements/Sampler/components/ComputerKeyboard';
export { PianoKeyboard } from './elements/Sampler/components/PianoKeyboard';

// Select controls
export {
  KeymapSelect,
  WaveformSelect,
  InputSourceSelect,
  RootNoteSelect,
} from './elements/Sampler/components/SamplerSelectFactory';

// Envelopes
export { EnvelopeDisplay } from './elements/Sampler/components/EnvelopeDisplay';
export { EnvelopeSwitcher } from './elements/Sampler/components/EnvelopeSwitcher';

// Utilities
export {
  findNodeId as createFindNodeId,
  createToggleForTarget as createToggle,
  createKnobForTarget as createKnob,
} from './elements/Sampler/component-utils';

export { SamplerStatusElement } from './elements/Sampler/components/SamplerStatusElement';

// Old all-in-one version (for reference):
// export { defineSamplerMonolith } from './elements/monoliths/sampler/SamplerMonolith';

// Framework wrappers // TODO: Move to separate entry point (was a hassle)
export * from './frameworks/solidjs/solidjsEntry';
